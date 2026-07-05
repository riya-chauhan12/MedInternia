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


class BatchNERRequestItem(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=MAX_CHARS,
        description="Free-text medical case description.",
    )
    case_id: str | None = Field(
        None,
        description="Optional case identifier — echoed back in the response for easy correlation.",
    )


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
async def batch_extract(requests: list[BatchNERRequestItem]):
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
# Clinical Sandbox endpoints
# ---------------------------------------------------------------------------
import difflib
import re

class GenerateTestRequest(BaseModel):
    actual_diagnosis: str
    test_type: str

class GenerateTestResponse(BaseModel):
    test_type: str
    result: str

class EvaluateDiagnosisRequest(BaseModel):
    proposed_diagnosis: str
    actual_diagnosis: str

class EvaluateDiagnosisResponse(BaseModel):
    similarity_score: float

@app.post("/sandbox/generate_test", response_model=GenerateTestResponse, tags=["sandbox"])
async def generate_sandbox_test(req: GenerateTestRequest):
    """
    Generate mock clinical test results based on the actual diagnosis and requested test type.
    """
    diag = req.actual_diagnosis.lower()
    test = req.test_type.lower()
    
    result = ""
    if "ecg" in test or "electrocardiogram" in test:
        if any(w in diag for w in ["stemi", "myocardial", "infarction", "cardiac", "heart", "coronary"]):
            result = "ECG shows ST-segment elevation in leads II, III, and aVF, with reciprocal ST depression in leads I and aVL, indicative of an acute inferior wall myocardial infarction (STEMI)."
        elif any(w in diag for w in ["arrhythmia", "fibrillation", "flutter", "tachycardia"]):
            result = "ECG shows irregular rhythm with absent P waves and variable ventricular response, consistent with atrial fibrillation."
        else:
            result = "ECG shows normal sinus rhythm at 75 bpm, normal PR and QT intervals, and no acute ST-segment or T-wave abnormalities."
    elif "blood" in test or "lab" in test or "work" in test:
        if any(w in diag for w in ["stemi", "myocardial", "infarction", "cardiac", "heart"]):
            result = "Cardiac Troponin I is elevated at 4.2 ng/mL (normal < 0.04 ng/mL). CK-MB is 28 ng/mL (normal < 5.0 ng/mL). BMP and CBC are within normal limits."
        elif any(w in diag for w in ["diabetes", "diabetic", "hyperglycemia"]):
            result = "Fasting Blood Glucose is 245 mg/dL (normal 70-100 mg/dL). HbA1c is 8.8% (normal < 5.7%). Electrolytes and kidney function are normal."
        elif any(w in diag for w in ["infection", "pneumonia", "sepsis", "appendicitis", "meningitis"]):
            result = "WBC count is elevated at 15,200/mcL (normal 4,500-11,000/mcL) with 88% neutrophils. C-reactive protein (CRP) is elevated at 52 mg/L (normal < 3.0 mg/L)."
        elif any(w in diag for w in ["anemia", "bleeding", "hemorrhage"]):
            result = "Hemoglobin is low at 8.5 g/dL (normal 13.5-17.5 g/dL). Hematocrit is 26% (normal 41%-50%). Red blood cell indices show microcytic, hypochromic anemia."
        else:
            result = "CBC: WBC 6,800/mcL, Hb 14.5 g/dL, Platelets 240,000/mcL. BMP: Sodium 140 mEq/L, Potassium 4.2 mEq/L, Creatinine 0.8 mg/dL. Glucose 95 mg/dL."
    elif "x-ray" in test or "xray" in test or "imaging" in test or "radiograph" in test:
        if any(w in diag for w in ["pneumonia", "infection", "bronchitis", "covid", "cough"]):
            result = "Chest radiograph reveals dense airspace consolidation and air bronchograms in the right lower lobe, consistent with lobar pneumonia. No pleural effusion."
        elif any(w in diag for w in ["heart", "stemi", "failure", "cardiac"]):
            result = "Chest radiograph shows mild cardiomegaly and prominent pulmonary vasculature, but no clear alveolar infiltrates or pleural effusions."
        elif any(w in diag for w in ["fracture", "bone", "rib", "trauma"]):
            result = "Radiograph shows a clear disruption of the bony cortex, consistent with an acute fracture. Surrounding soft tissue swelling is noted."
        else:
            result = "Chest X-ray shows normal cardiac silhouette size, clear lung fields with no consolidation or pleural effusion, and intact bony thorax."
    else:
        # Fallback response
        result = f"Diagnostic test '{req.test_type}' performed. Findings indicate physiological signs correlated with {req.actual_diagnosis}."

    return GenerateTestResponse(test_type=req.test_type, result=result)

@app.post("/sandbox/evaluate", response_model=EvaluateDiagnosisResponse, tags=["sandbox"])
async def evaluate_sandbox_diagnosis(req: EvaluateDiagnosisRequest):
    """
    Evaluate an intern's proposed diagnosis against the actual diagnosis using string similarity and token overlap.
    """
    proposed = req.proposed_diagnosis.lower().strip()
    actual = req.actual_diagnosis.lower().strip()
    
    if proposed == actual:
        return EvaluateDiagnosisResponse(similarity_score=1.0)
        
    if not proposed or not actual:
        return EvaluateDiagnosisResponse(similarity_score=0.0)

    # Substring check for significant matches
    if proposed in actual or actual in proposed:
        if len(proposed) >= 4 or len(actual) >= 4:
            len_ratio = min(len(proposed), len(actual)) / max(len(proposed), len(actual))
            score = round(0.7 + 0.3 * len_ratio, 4)
            return EvaluateDiagnosisResponse(similarity_score=min(1.0, score))

    stop_words = {'a', 'an', 'the', 'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'from', 'and', 'or', 'patient', 'showing', 'acute', 'chronic', 'mild', 'severe', 'moderate'}
    prop_tokens = [w for w in re.findall(r'\b\w+\b', proposed) if w not in stop_words]
    act_tokens = [w for w in re.findall(r'\b\w+\b', actual) if w not in stop_words]
    
    if not act_tokens or not prop_tokens:
        ratio = difflib.SequenceMatcher(None, proposed, actual).ratio()
        return EvaluateDiagnosisResponse(similarity_score=round(ratio, 4))
        
    matches = 0.0
    for at in act_tokens:
        if at in prop_tokens:
            matches += 1.0
            continue
        for pt in prop_tokens:
            if at in pt or pt in at:
                matches += 0.8
                break
                
    coverage = matches / len(act_tokens)
    jaccard = matches / (len(act_tokens) + len(prop_tokens) - matches) if (len(act_tokens) + len(prop_tokens) - matches) > 0 else 0
    seq_ratio = difflib.SequenceMatcher(None, proposed, actual).ratio()
    
    score = (0.2 * seq_ratio) + (0.3 * jaccard) + (0.5 * coverage)
    final_score = min(1.0, max(0.0, round(score, 4)))
    
    return EvaluateDiagnosisResponse(similarity_score=final_score)


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