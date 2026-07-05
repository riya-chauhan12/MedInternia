"""
tests/test_ner_service.py
=========================
Unit + integration tests for the MedInternia NER microservice.

Run with:
    pytest tests/ -v

Mocking strategy
----------------
The HuggingFace pipelines are expensive to load. All tests use
`unittest.mock.patch` to inject lightweight fakes so the test suite runs
quickly without downloading any model weights.
"""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

FAKE_DISEASE_OUTPUT = [
    {"word": "STEMI", "entity_group": "DISEASE", "score": 0.98, "start": 50, "end": 55},
    {"word": "Dengue fever", "entity_group": "DISEASE", "score": 0.95, "start": 60, "end": 72},
]

FAKE_GENERAL_OUTPUT = [
    {"word": "fever", "entity_group": "SIGN_OR_SYMPTOM", "score": 0.91, "start": 10, "end": 15},
    {"word": "chest pain", "entity_group": "SIGN_OR_SYMPTOM", "score": 0.89, "start": 17, "end": 27},
    {"word": "Aspirin", "entity_group": "CHEMICAL", "score": 0.97, "start": 80, "end": 87},
    {"word": "Metformin", "entity_group": "CHEMICAL", "score": 0.94, "start": 90, "end": 99},
]


def _make_pipeline_mock(output):
    """Return a callable mock that mimics `pipeline(text)` returning `output`."""
    m = MagicMock(return_value=output)
    return m


@pytest.fixture
def patched_app():
    """
    Yield a FastAPI app instance with both pipelines replaced by mocks.
    We patch at the module level so `_run_ner_sync` picks up the mocks.
    """
    from app import main

    disease_mock = _make_pipeline_mock(FAKE_DISEASE_OUTPUT)
    general_mock = _make_pipeline_mock(FAKE_GENERAL_OUTPUT)

    with (
        patch.object(main, "_disease_pipeline", disease_mock),
        patch.object(main, "_general_pipeline", general_mock),
    ):
        yield main.app


import pytest_asyncio

@pytest_asyncio.fixture
async def async_client(patched_app):
    async with AsyncClient(
        transport=ASGITransport(app=patched_app), base_url="http://test"
    ) as client:
        yield client


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_health_ok(async_client):
    resp = await async_client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "disease_model" in body
    assert "general_model" in body


@pytest.mark.asyncio
async def test_health_503_when_models_not_loaded():
    """When pipelines are None the health endpoint must return 503."""
    from app import main
    import importlib

    with (
        patch.object(main, "_disease_pipeline", None),
        patch.object(main, "_general_pipeline", None),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=main.app), base_url="http://test"
        ) as client:
            resp = await client.get("/health")
    assert resp.status_code == 503


# ---------------------------------------------------------------------------
# /extract — happy paths
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_extract_returns_all_three_entity_types(async_client):
    payload = {
        "text": (
            "A 45-year-old male presented with fever and chest pain. "
            "He was diagnosed with STEMI and Dengue fever. "
            "Aspirin and Metformin were prescribed."
        )
    }
    resp = await async_client.post("/extract", json=payload)
    assert resp.status_code == 200
    body = resp.json()

    assert "entities" in body
    assert "entity_counts" in body

    labels = {e["label"] for e in body["entities"]}
    assert "DISEASE" in labels
    assert "SYMPTOM" in labels
    assert "MEDICATION" in labels


@pytest.mark.asyncio
async def test_extract_entity_counts_match(async_client):
    payload = {"text": "Patient has fever, STEMI, and takes Aspirin."}
    resp = await async_client.post("/extract", json=payload)
    body = resp.json()

    counts = body["entity_counts"]
    entities = body["entities"]

    # Counts must agree with actual entity list length per label
    for label in ("SYMPTOM", "DISEASE", "MEDICATION"):
        expected = sum(1 for e in entities if e["label"] == label)
        assert counts[label] == expected


@pytest.mark.asyncio
async def test_extract_case_id_echoed(async_client):
    payload = {"text": "Patient has fever.", "case_id": "CASE-007"}
    resp = await async_client.post("/extract", json=payload)
    body = resp.json()
    assert body["case_id"] == "CASE-007"


@pytest.mark.asyncio
async def test_extract_processing_time_present(async_client):
    payload = {"text": "Patient has fever and was given Aspirin."}
    resp = await async_client.post("/extract", json=payload)
    body = resp.json()
    assert body["processing_time_ms"] >= 0


# ---------------------------------------------------------------------------
# /extract — edge cases & validation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_extract_rejects_empty_text(async_client):
    resp = await async_client.post("/extract", json={"text": ""})
    assert resp.status_code == 422  # Pydantic min_length violation


@pytest.mark.asyncio
async def test_extract_rejects_text_too_long(async_client):
    from app.main import MAX_CHARS
    payload = {"text": "a" * (MAX_CHARS + 1)}
    resp = await async_client.post("/extract", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_extract_deduplicates_entities(async_client):
    """If both pipelines return the same entity, it should appear only once."""
    from app import main

    both_return_stemi = [
        {"word": "STEMI", "entity_group": "DISEASE", "score": 0.98, "start": 10, "end": 15}
    ]

    with (
        patch.object(main, "_disease_pipeline", _make_pipeline_mock(both_return_stemi)),
        patch.object(main, "_general_pipeline", _make_pipeline_mock(both_return_stemi)),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=main.app), base_url="http://test"
        ) as client:
            resp = await client.post("/extract", json={"text": "He has STEMI."})

    body = resp.json()
    stemi_hits = [e for e in body["entities"] if e["text"].upper() == "STEMI"]
    assert len(stemi_hits) == 1, "Duplicate entity not deduplicated"


@pytest.mark.asyncio
async def test_extract_keeps_highest_confidence_on_duplicate(async_client):
    """When the same entity appears twice, keep the higher-confidence one."""
    from app import main

    low = [{"word": "fever", "entity_group": "SIGN_OR_SYMPTOM", "score": 0.70, "start": 0, "end": 5}]
    high = [{"word": "fever", "entity_group": "SIGN_OR_SYMPTOM", "score": 0.95, "start": 0, "end": 5}]

    with (
        patch.object(main, "_disease_pipeline", _make_pipeline_mock(low)),
        patch.object(main, "_general_pipeline", _make_pipeline_mock(high)),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=main.app), base_url="http://test"
        ) as client:
            resp = await client.post("/extract", json={"text": "Patient has fever."})

    body = resp.json()
    fever = next(e for e in body["entities"] if e["text"].lower() == "fever")
    assert fever["score"] == pytest.approx(0.95)


# ---------------------------------------------------------------------------
# /batch_extract
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_batch_extract_happy_path(async_client):
    payload = [
        {"text": "Patient has fever.", "case_id": "C1"},
        {"text": "Diagnosed with Dengue.", "case_id": "C2"},
    ]
    resp = await async_client.post("/batch_extract", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 2
    assert body[0]["case_id"] == "C1"
    assert body[1]["case_id"] == "C2"


@pytest.mark.asyncio
async def test_batch_extract_rejects_oversized_batch(async_client):
    payload = [{"text": "fever"} for _ in range(21)]
    resp = await async_client.post("/batch_extract", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_batch_extract_mixed_valid_invalid(async_client):
    """Batch with a mix of valid and invalid items should process valid ones."""
    payload = [
        {"text": "Patient has fever.", "case_id": "C1"},
        {"text": "xy", "case_id": "C2"},  # too short, but batch doesn't validate individually
    ]
    resp = await async_client.post("/batch_extract", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 2


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_global_exception_handler(async_client):
    """Unhandled exceptions should return JSON, not HTML."""
    resp = await async_client.get("/nonexistent-route")
    assert resp.status_code in (404, 500)
    assert resp.headers["content-type"] == "application/json"


# ---------------------------------------------------------------------------
# Label canonicalisation unit tests (no HTTP involved)
# ---------------------------------------------------------------------------


def test_canonical_label_disease():
    from app.main import _canonical_label
    assert _canonical_label("DISEASE") == "DISEASE"
    assert _canonical_label("DIS") == "DISEASE"
    assert _canonical_label("B-DISEASE") == "DISEASE"


def test_canonical_label_symptom():
    from app.main import _canonical_label
    assert _canonical_label("SIGN_OR_SYMPTOM") == "SYMPTOM"
    assert _canonical_label("SYMPTOM") == "SYMPTOM"
    assert _canonical_label("B-SIGN_OR_SYMPTOM") == "SYMPTOM"


def test_canonical_label_medication():
    from app.main import _canonical_label
    assert _canonical_label("CHEMICAL") == "MEDICATION"
    assert _canonical_label("DRUG") == "MEDICATION"
    assert _canonical_label("MEDICATION") == "MEDICATION"


def test_canonical_label_unknown_returns_none():
    from app.main import _canonical_label
    assert _canonical_label("PERSON") is None
    assert _canonical_label("ORG") is None


def test_canonical_label_rejects_substring_false_positives():
    """Labels containing keywords as substrings should NOT be classified."""
    from app.main import _canonical_label
    assert _canonical_label("NON_DISEASE") is None
    assert _canonical_label("DISEASE_OUTBREAK") is None
    assert _canonical_label("ASYMPTOMATIC") is None
    assert _canonical_label("PRESYMPTOMATIC") is None
    assert _canonical_label("DESIGN") is None
    assert _canonical_label("ASSIGNMENT") is None
    assert _canonical_label("SIGNAL") is None
    assert _canonical_label("SIGNATURE") is None
    assert _canonical_label("DRUG_STORE") is None
    assert _canonical_label("DRUG_TRIAL") is None
    assert _canonical_label("PRODRUG") is None