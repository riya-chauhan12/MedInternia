/**
 * backend/src/services/nerService.ts
 * ===================================
 * Thin TypeScript client that calls the Python NER microservice.
 * Drop this file into backend/src/services/ alongside the existing
 * symptomExtractionService.ts — it is intentionally standalone.
 *
 * Usage in a controller:
 *
 *   import { extractEntities } from "../services/nerService";
 *
 *   const result = await extractEntities(req.body.description, caseId);
 *   // result.entities, result.entity_counts, result.processing_time_ms
 */


const NER_SERVICE_URL =
  process.env.NLP_SERVICE_URL ?? "http://localhost:8001";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EntityLabel = "SYMPTOM" | "DISEASE" | "MEDICATION";

export interface NEREntity {
  text: string;
  label: EntityLabel;
  score: number;   // 0–1 confidence
  start: number;   // character offset in original text
  end: number;
}

export interface NERResult {
  case_id: string | null;
  entities: NEREntity[];
  entity_counts: Record<EntityLabel, number>;
  processing_time_ms: number;
}

export interface BatchNERResult extends NERResult {}

// ---------------------------------------------------------------------------
// Single-case extraction
// ---------------------------------------------------------------------------

/**
 * Extract SYMPTOM, DISEASE and MEDICATION entities from a clinical text.
 *
 * @param text    - Free-text case description (5–4 000 characters).
 * @param caseId  - Optional identifier; echoed back in the response.
 * @returns       Structured NERResult or null if the service is unreachable.
 */
export async function extractEntities(
  text: string,
  caseId?: string
): Promise<NERResult> {
  const res = await fetch(`${NER_SERVICE_URL}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, case_id: caseId ?? null }),
    // Abort if the NER service doesn't respond within 30 s
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(
      `NER service returned ${res.status} for case ${caseId}: ${body}`
    );
  }

  return res.json() as Promise<NERResult>;
}

// ---------------------------------------------------------------------------
// Batch extraction (up to 20 texts per call)
// ---------------------------------------------------------------------------

export async function batchExtractEntities(
  items: Array<{ text: string; case_id?: string }>
): Promise<BatchNERResult[]> {
  if (items.length === 0) return [];
  if (items.length > 20) {
    throw new RangeError("batchExtractEntities: maximum batch size is 20");
  }

  const payload = items.map((i) => ({
    text: i.text,
    case_id: i.case_id ?? null,
  }));

  const res = await fetch(`${NER_SERVICE_URL}/batch_extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    throw new Error(`NER batch service returned ${res.status}`);
  }

  return res.json() as Promise<BatchNERResult[]>;
}

// ---------------------------------------------------------------------------
// Health check helper (use in startup or monitoring)
// ---------------------------------------------------------------------------

export async function isNERServiceHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${NER_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}