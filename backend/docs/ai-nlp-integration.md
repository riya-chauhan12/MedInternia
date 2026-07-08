# AI-Powered Suggestions & NLP Integration

## Current Status

> **Status: Planned — Not Yet Implemented**
>
> The "AI-Powered Suggestions" feature is documented in the README as a planned
> capability. This document defines the architecture for contributors who want
> to implement it.

The `requirements.txt` at the repository root is a placeholder for the
future Python NLP module. No NLP module currently exists.

---

## Planned Architecture

### Why Python?

The NLP tasks required for MedInternia (case recommendations, symptom matching,
medical text classification) are best served by Python's ML ecosystem
(scikit-learn, spaCy, transformers). Python will run as a **separate microservice**
alongside the Node.js backend.

### Communication Pattern

The Node.js backend will call the Python NLP service via **HTTP REST API**:
Next.js Frontend
↓ HTTP
Node.js/Express Backend (port 3000)
↓ HTTP (internal)
Python NLP Service (port 5000)
↓
NLP Models (spaCy / transformers)

This approach was chosen over:
- **Child process spawning** — not suitable for high-concurrency requests
- **gRPC** — adds complexity not justified at current scale
- **Message queue** — appropriate if NLP tasks take > 5 seconds

---

## Planned NLP Features

| Feature | Implementation Plan | Priority |
|---|---|---|
| Case Recommendations | Cosine similarity on TF-IDF vectors of case descriptions | High |
| AI Learning Suggestions | Collaborative filtering based on user case history | Medium |
| Medical Term Extraction | spaCy with en_core_med7_lg medical NER model | Medium |
| Search Ranking | BM25 ranking for case search results | Low |

---

## Planned File Structure
nlp/
├── README.md              ← This document (to be moved here)
├── requirements.txt       ← Python dependencies (currently at repo root)
├── main.py                ← FastAPI entrypoint (GET /health, POST /recommend)
├── models/
│   ├── case_recommender.py
│   └── medical_ner.py
└── tests/
└── test_recommender.py

---

## Planned API Contract

### POST /recommend/cases

**Request** (from Node.js backend):
```json
{
  "case_description": "Patient presents with chest pain and shortness of breath",
  "user_id": "user_123",
  "limit": 5
}
```

**Response**:
```json
{
  "recommendations": [
    {
      "case_id": "case_456",
      "title": "Acute Myocardial Infarction - Case Study",
      "similarity_score": 0.87
    }
  ]
}
```

---

## How to Implement This (For Contributors)

If you want to implement the NLP module:

1. **Comment on this issue first** to avoid duplicate work
2. Create the `nlp/` directory following the structure above
3. Install Python 3.10+ and create a virtual environment: `python -m venv nlp/.venv`
4. Use FastAPI for the REST service: `pip install fastapi uvicorn spacy scikit-learn`
5. The Node.js backend should call the NLP service using `axios` with a timeout
6. Add `NLP_SERVICE_URL=http://localhost:5000` to `backend/.env.example`
7. Add `nlp/.venv` and `nlp/__pycache__` to `.gitignore`

---

## Environment Variables Required (Future)

Add these to `backend/.env` when implementing:
NLP Service (Python microservice — must be running before backend)
NLP_SERVICE_URL=http://localhost:5000
NLP_SERVICE_TIMEOUT_MS=5000    # Timeout for NLP API calls (ms)
NLP_ENABLED=false              # Set to true when NLP service is running

---

## Startup Order (Once Implemented)

```bash
# Terminal 1: Start NLP service first
cd nlp
pip install -r requirements.txt
uvicorn main:app --port 5000

# Terminal 2: Start backend (connects to NLP service)
cd backend
npm run dev

# Terminal 3: Start frontend
cd frontend
npm run dev
```