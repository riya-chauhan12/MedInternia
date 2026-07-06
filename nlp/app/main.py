"""
MedInternia — Biomedical NER Microservice
==========================================
FastAPI service that wraps a BioBERT-based NER model (pruas/BENT-PubMedBERT-NER-Disease
or a multi-entity variant) to extract medical entities from free-text case descriptions.

Entities extracted:
  - SYMPTOM   : fever, chest pain, shortness of breath …
  - DISEASE   : Dengue fever, STEMI, Type-2 Diabetes …
  - MEDICATION: Paracetamol, Metformin, Aspirin …

Design decisions:
  - Models are loaded once at startup (lifespan context manager) to avoid
    per-request cold-starts.
  - Entity classes are merged from two separate checkpoints:
      * pruas/BENT-PubMedBERT-NER-Disease  → DISEASE labels
      * d4data/biomedical-ner-all           → SYMPTOM + MEDICATION labels
    Both pipelines run in parallel via asyncio.gather for minimal latency.
  - Token-level B-I-O predictions are post-processed with a simple span-merger
    so the caller receives clean entity strings rather than token fragments.
  - The /health endpoint lets the Node.js backend (or k8s liveness probe)
    verify the service is ready before sending traffic.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import time
from contextlib import asynccontextmanager
from typing import Any

INFERENCE_TIMEOUT = int(os.getenv("INFERENCE_TIMEOUT", "30"))
BATCH_SEMAPHORE_LIMIT = int(os.getenv("BATCH_SEMAPHORE_LIMIT", "4"))

import torch
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from transformers import pipeline, Pipeline

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
log = logging.getLogger("medinternia.ner")

# ---------------------------------------------------------------------------
# Configuration  (override via environment variables)
# ---------------------------------------------------------------------------
DISEASE_MODEL = os.getenv(
    "DISEASE_MODEL", "pruas/BENT-PubMedBERT-NER-Disease"
)
GENERAL_BIO_MODEL = os.getenv(
    "GENERAL_BIO_MODEL", "d4data/biomedical-ner-all"
)

# Label mappings — normalise model-specific tag names into our three classes
DISEASE_TAGS: set[str] = {"DISEASE", "DIS", "B-DISEASE", "I-DISEASE"}
SYMPTOM_TAGS: set[str] = {
    "SIGN_OR_SYMPTOM",
    "SYMPTOM",
    "SIGN",
    "B-SIGN_OR_SYMPTOM",
    "I-SIGN_OR_SYMPTOM",
    "B-SYMPTOM",
    "I-SYMPTOM",
}
MEDICATION_TAGS: set[str] = {
    "CHEMICAL",
    "MEDICATION",
    "DRUG",
    "B-CHEMICAL",
    "I-CHEMICAL",
    "B-MEDICATION",
    "I-MEDICATION",
}

# Text length limits
MAX_CHARS = int(os.getenv("MAX_CHARS", "4000"))

# ---------------------------------------------------------------------------
# Global model holders  (populated in lifespan)
# ---------------------------------------------------------------------------
_disease_pipeline: Pipeline | None = None
_general_pipeline: Pipeline | None = None
_batch_semaphore: asyncio.Semaphore | None = None


# ---------------------------------------------------------------------------
# Lifespan — load models once at startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _disease_pipeline, _general_pipeline, _batch_semaphore

    device = 0 if torch.cuda.is_available() else -1
    log.info("Loading NER models on device=%s …", "GPU" if device == 0 else "CPU")

    # We load both models concurrently in a thread-pool so the event loop
    # stays responsive during the (potentially slow) first download.
    loop = asyncio.get_event_loop()

    def _load_disease():
        return pipeline(
            "ner",
            model=DISEASE_MODEL,
            aggregation_strategy="simple",
            device=device,
        )

    def _load_general():
        return pipeline(
            "ner",
            model=GENERAL_BIO_MODEL,
            aggregation_strategy="simple",
            device=device,
        )

    _disease_pipeline, _general_pipeline = await asyncio.gather(
        loop.run_in_executor(None, _load_disease),
        loop.run_in_executor(None, _load_general),
    )
    _batch_semaphore = asyncio.Semaphore(BATCH_SEMAPHORE_LIMIT)
    log.info("Both NER models ready.")
    yield
    log.info("Shutting down — releasing model resources.")
    _disease_pipeline = None
    _general_pipeline = None
    _batch_semaphore = None


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="MedInternia Biomedical NER Service",
    version="1.0.0",
    description=(
        "Named Entity Recognition microservice for MedInternia. "
        "Extracts SYMPTOM, DISEASE and MEDICATION entities from clinical text."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class NERRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=5,
        max_length=MAX_CHARS,
        description="Free-text medical case description.",
        examples=["A 45-year-old male presented with fever, chest pain and "
                  "shortness of breath. He was diagnosed with STEMI. "
                  "Aspirin 300 mg was administered immediately."],
    )
    case_id: str | None = Field(
        None,
        description="Optional case identifier — echoed back in the response for easy correlation.",
    )


class BatchNERRequest(BaseModel):
    text: str = Field(
        ...,
        max_length=MAX_CHARS,
        description="Free-text medical case description.",
    )
    case_id: str | None = Field(
        None,
        description="Optional case identifier.",
    )


class ComplianceCheckRequest(BaseModel):
    text: str
    patient_age: float | None = None


class ComplianceCheckResponse(BaseModel):
    original_text: str
    redacted_text: str
    is_flagged: bool
    flag_reasons: list[str]


class EntityItem(BaseModel):
    text: str
    label: str          # SYMPTOM | DISEASE | MEDICATION
    score: float        # confidence, 0–1
    start: int          # character offset in original text
    end: int


class NERResponse(BaseModel):
    case_id: str | None
    entities: list[EntityItem]
    entity_counts: dict[str, int]
    processing_time_ms: float


class HealthResponse(BaseModel):
    status: str
    disease_model: str
    general_model: str
    device: str


# ---------------------------------------------------------------------------
# Helper: classify raw entity group labels into our canonical three labels
# ---------------------------------------------------------------------------
def _canonical_label(raw: str) -> str | None:
    upper = raw.upper()
    if upper in DISEASE_TAGS or upper == "DIS":
        return "DISEASE"
    if upper in SYMPTOM_TAGS:
        return "SYMPTOM"
    if upper in MEDICATION_TAGS:
        return "MEDICATION"
    return None  # skip labels we don't care about


# ---------------------------------------------------------------------------
# Helper: deduplicate & merge overlapping spans
# ---------------------------------------------------------------------------
def _merge_entities(raw_entities: list[dict[str, Any]]) -> list[EntityItem]:
    """
    Convert raw HuggingFace pipeline outputs into EntityItem objects,
    deduplicate by (text, label) and keep the highest-confidence span.
    """
    seen: dict[tuple[str, str], EntityItem] = {}

    for ent in raw_entities:
        label = _canonical_label(ent.get("entity_group", ent.get("entity", "")))
        if label is None:
            continue

        word: str = ent["word"].strip()
        if not word:
            continue

        score: float = round(float(ent["score"]), 4)
        start: int = ent.get("start", 0)
        end: int = ent.get("end", 0)

        key = (word.lower(), label)
        if key not in seen or score > seen[key].score:
            seen[key] = EntityItem(
                text=word,
                label=label,
                score=score,
                start=start,
                end=end,
            )

    # Sort by position in original text for readability
    return sorted(seen.values(), key=lambda e: e.start)


# ---------------------------------------------------------------------------
# Core extraction logic (runs in thread pool to avoid blocking event loop)
# ---------------------------------------------------------------------------
def _run_ner_sync(text: str) -> list[EntityItem]:
    if _disease_pipeline is None:
        raise RuntimeError("Disease model pipeline not loaded")
    if _general_pipeline is None:
        raise RuntimeError("General model pipeline not loaded")

    disease_raw = _disease_pipeline(text)
    general_raw = _general_pipeline(text)

    combined = list(disease_raw) + list(general_raw)
    return _merge_entities(combined)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["ops"])
async def health():
    """Liveness + readiness check. Returns 503 if models are not loaded."""
    if _disease_pipeline is None or _general_pipeline is None:
        raise HTTPException(status_code=503, detail="Models not yet loaded.")
    return HealthResponse(
        status="ok",
        disease_model=DISEASE_MODEL,
        general_model=GENERAL_BIO_MODEL,
        device="GPU" if torch.cuda.is_available() else "CPU",
    )


@app.post("/extract", response_model=NERResponse, tags=["ner"])
async def extract_entities(req: NERRequest):
    """
    Extract biomedical named entities from the supplied text.

    Returns deduplicated lists of SYMPTOM, DISEASE, and MEDICATION entities
    with character offsets and confidence scores.
    """
    if _disease_pipeline is None or _general_pipeline is None:
        raise HTTPException(status_code=503, detail="Models still loading, retry shortly.")

    t0 = time.perf_counter()

    loop = asyncio.get_event_loop()
    entities = await asyncio.wait_for(
        loop.run_in_executor(None, _run_ner_sync, req.text),
        timeout=INFERENCE_TIMEOUT,
    )

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

    counts: dict[str, int] = {"SYMPTOM": 0, "DISEASE": 0, "MEDICATION": 0}
    for ent in entities:
        counts[ent.label] = counts.get(ent.label, 0) + 1

    log.info(
        "Extracted %d entities in %.1f ms (case_id=%s)",
        len(entities),
        elapsed_ms,
        req.case_id,
    )

    return NERResponse(
        case_id=req.case_id,
        entities=entities,
        entity_counts=counts,
        processing_time_ms=elapsed_ms,
    )


@app.post("/batch_extract", tags=["ner"])
async def batch_extract(requests: list[BatchNERRequest]):
    """
    Process up to 20 case descriptions in a single round-trip.
    Each item is processed independently; results are returned in the same order.
    """
    if len(requests) > 20:
        raise HTTPException(status_code=422, detail="Batch size must be ≤ 20.")

    if _disease_pipeline is None or _general_pipeline is None:
        raise HTTPException(status_code=503, detail="Models still loading, retry shortly.")

    loop = asyncio.get_event_loop()
    t0 = time.perf_counter()

    sem = _batch_semaphore or asyncio.Semaphore(BATCH_SEMAPHORE_LIMIT)

    async def _run_with_semaphore(text: str) -> list[EntityItem]:
        if len(text.strip()) < 5:
            return []
        async with sem:
            return await asyncio.wait_for(
                loop.run_in_executor(None, _run_ner_sync, text),
                timeout=INFERENCE_TIMEOUT,
            )

    results = await asyncio.gather(
        *[_run_with_semaphore(r.text) for r in requests]
    )

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
    log.info("Batch of %d processed in %.1f ms", len(requests), elapsed_ms)

    out = []
    for req, entities in zip(requests, results):
        counts: dict[str, int] = {"SYMPTOM": 0, "DISEASE": 0, "MEDICATION": 0}
        for ent in entities:
            counts[ent.label] = counts.get(ent.label, 0) + 1
        out.append(
            NERResponse(
                case_id=req.case_id,
                entities=entities,
                entity_counts=counts,
                processing_time_ms=elapsed_ms / len(requests),
            )
        )
    return out


# ---------------------------------------------------------------------------
# Compliance Checking Logic (PHI Redaction & Discrepancy Checks)
# ---------------------------------------------------------------------------

_nlp_spacy = None
try:
    import spacy
    _nlp_spacy = spacy.load("en_core_web_sm")
except Exception:
    pass

def redact_phi(text: str) -> str:
    # 1. Redact Emails
    email_pattern = r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b"
    text = re.sub(email_pattern, "[REDACTED]", text)
    
    # 2. Redact Phone numbers
    phone_pattern = r"\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b"
    text = re.sub(phone_pattern, "[REDACTED]", text)
    
    # 3. Redact SSNs
    ssn_pattern = r"\b\d{3}-\d{2}-\d{4}\b"
    text = re.sub(ssn_pattern, "[REDACTED]", text)
    
    # 4. Redact Patient names using spacy if available
    if _nlp_spacy is not None:
        try:
            doc = _nlp_spacy(text)
            spans = sorted(doc.ents, key=lambda e: e.start_char, reverse=True)
            text_list = list(text)
            for span in spans:
                if span.label_ == "PERSON":
                    text_list[span.start_char:span.end_char] = list("[REDACTED]")
            text = "".join(text_list)
        except Exception:
            pass
            
    # Regex fallback/additional name redactor
    title_pattern = r"\b(Mr\.|Mrs\.|Ms\.|Miss)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b"
    text = re.sub(title_pattern, r"\1 [REDACTED]", text)
    
    patient_name_pattern = r"\b(patient\s+named\s+|patient\s+is\s+|patient\s+name\s+is\s+)([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b"
    text = re.sub(patient_name_pattern, r"\1[REDACTED]", text)
    
    return text

def check_discrepancies(text: str, patient_age: float | None) -> list[str]:
    reasons = []
    text_lower = text.lower()
    
    # 1. Pediatric contraindications (if age < 18)
    if patient_age is not None and patient_age < 18:
        if "aspirin" in text_lower or "acetylsalicylic acid" in text_lower:
            reasons.append("Pediatric contraindication: Aspirin is contraindicated in patients under 18 due to risk of Reye's syndrome.")
        if "tetracycline" in text_lower or "doxycycline" in text_lower:
            reasons.append("Pediatric contraindication: Tetracyclines/Doxycycline are contraindicated in patients under 18 due to risk of tooth discoloration.")
        if "ciprofloxacin" in text_lower or "levofloxacin" in text_lower or "moxifloxacin" in text_lower:
            reasons.append("Pediatric contraindication: Fluoroquinolones are contraindicated in patients under 18 due to risk of arthropathy.")
        if "codeine" in text_lower:
            reasons.append("Pediatric contraindication: Codeine is contraindicated in patients under 18 due to risk of severe respiratory depression.")

    # 2. Dosage checks
    dosage_rules = [
        {
            "names": ["paracetamol", "acetaminophen", "tylenol"],
            "max_mg": 4000,
            "display": "Paracetamol/Acetaminophen"
        },
        {
            "names": ["ibuprofen", "advil", "motrin"],
            "max_mg": 3200,
            "display": "Ibuprofen"
        },
        {
            "names": ["aspirin", "acetylsalicylic acid"],
            "max_mg": 4000,
            "display": "Aspirin"
        }
    ]
    
    for rule in dosage_rules:
        if any(name in text_lower for name in rule["names"]):
            for name in rule["names"]:
                matches = re.finditer(rf'\b{name}\b.*?\b(\d+(?:\.\d+)?)\s*(mg|g)\b', text_lower, re.DOTALL)
                for match in matches:
                    try:
                        if len(match.group(0)) > 100:
                            continue
                        val = float(match.group(1))
                        unit = match.group(2)
                        val_mg = val * 1000 if unit == "g" else val
                        if val_mg > rule["max_mg"]:
                            reasons.append(f"Dosage discrepancy: {rule['display']} dosage of {val} {unit} exceeds the maximum recommended daily limit of {rule['max_mg']} mg.")
                    except ValueError:
                        continue
                
                matches = re.finditer(rf'\b(\d+(?:\.\d+)?)\s*(mg|g)\b.*?\b{name}\b', text_lower, re.DOTALL)
                for match in matches:
                    try:
                        if len(match.group(0)) > 100:
                            continue
                        val = float(match.group(1))
                        unit = match.group(2)
                        val_mg = val * 1000 if unit == "g" else val
                        if val_mg > rule["max_mg"]:
                            reasons.append(f"Dosage discrepancy: {rule['display']} dosage of {val} {unit} exceeds the maximum recommended daily limit of {rule['max_mg']} mg.")
                    except ValueError:
                        continue
                        
    return reasons


@app.post("/compliance/check", response_model=ComplianceCheckResponse, tags=["compliance"])
async def compliance_check(req: ComplianceCheckRequest):
    """
    Check case content or comment for PHI redaction and dosage/pediatric discrepancies.
    """
    if not req.text.strip():
        return ComplianceCheckResponse(
            original_text=req.text,
            redacted_text=req.text,
            is_flagged=False,
            flag_reasons=[]
        )
    redacted = redact_phi(req.text)
    reasons = check_discrepancies(req.text, req.patient_age)
    return ComplianceCheckResponse(
        original_text=req.text,
        redacted_text=redacted,
        is_flagged=len(reasons) > 0,
        flag_reasons=reasons
    )


# ---------------------------------------------------------------------------
# Global exception handler — always return JSON
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def _global_handler(request: Request, exc: Exception):
    log.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )