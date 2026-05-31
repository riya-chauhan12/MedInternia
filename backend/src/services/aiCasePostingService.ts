import { predictDiseaseInsights } from './diseaseInsightService';

export const AI_CASE_POSTING_INTERVALS = ['daily', 'weekly', 'biweekly', 'monthly'] as const;
export const AI_CASE_REVIEW_STATUSES = ['pending', 'approved', 'changes_requested', 'rejected'] as const;

export type AICasePostingInterval = typeof AI_CASE_POSTING_INTERVALS[number];
export type AICaseReviewStatus = typeof AI_CASE_REVIEW_STATUSES[number];

type AICaseScheduleInput = {
  symptoms?: unknown;
  specialization?: unknown;
  difficulty?: unknown;
  interval?: unknown;
  scheduledFor?: unknown;
  learningObjective?: unknown;
  patientAge?: unknown;
  patientGender?: unknown;
};

export type GeneratedAICase = {
  title: string;
  description: string;
  symptoms: string[];
  patientInfo: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    medicalHistory: string[];
    currentMedications: string[];
  };
  diagnosis: string;
  treatment: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  specialization: string;
  aiSummary: string;
  reviewChecklist: string[];
};

export type ValidatedAICaseSchedule = {
  generatedCase: GeneratedAICase;
  interval: AICasePostingInterval;
  scheduledFor: Date;
};

const MAX_SYMPTOMS = 8;
const DEFAULT_SYMPTOMS = ['fever', 'cough', 'fatigue'];

const normalizeText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeSymptoms = (value: unknown): string[] => {
  const rawSymptoms = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : DEFAULT_SYMPTOMS;

  const symptoms = rawSymptoms
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, MAX_SYMPTOMS);

  return symptoms.length > 0 ? Array.from(new Set(symptoms)) : DEFAULT_SYMPTOMS;
};

const normalizeDifficulty = (value: unknown): GeneratedAICase['difficulty'] => {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced'
    ? value
    : 'intermediate';
};

const normalizeInterval = (value: unknown): AICasePostingInterval => {
  return AI_CASE_POSTING_INTERVALS.includes(value as AICasePostingInterval)
    ? value as AICasePostingInterval
    : 'weekly';
};

const normalizePatientGender = (value: unknown): GeneratedAICase['patientInfo']['gender'] => {
  return value === 'male' || value === 'female' || value === 'other' ? value : undefined;
};

const normalizePatientAge = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  if (value < 0 || value > 120) return undefined;
  return Math.round(value);
};

const parseScheduledFor = (value: unknown): Date => {
  if (typeof value !== 'string') return new Date();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('scheduledFor must be a valid ISO date string');
  }

  return parsed;
};

const addInterval = (date: Date, interval: AICasePostingInterval): Date => {
  const next = new Date(date);

  if (interval === 'daily') next.setDate(next.getDate() + 1);
  if (interval === 'weekly') next.setDate(next.getDate() + 7);
  if (interval === 'biweekly') next.setDate(next.getDate() + 14);
  if (interval === 'monthly') next.setMonth(next.getMonth() + 1);

  return next;
};

export const getNextAICasePostDate = (
  lastScheduledFor: Date,
  interval: AICasePostingInterval
): Date => addInterval(lastScheduledFor, interval);

export const buildAICaseSchedule = (body: AICaseScheduleInput): ValidatedAICaseSchedule => {
  const symptoms = normalizeSymptoms(body.symptoms);
  const predictions = predictDiseaseInsights({ symptoms });
  const primaryPrediction = predictions[0];
  const specialization =
    normalizeText(body.specialization) ?? primaryPrediction?.specialty ?? 'General Medicine';
  const difficulty = normalizeDifficulty(body.difficulty);
  const learningObjective =
    normalizeText(body.learningObjective) ?? `Practice triage reasoning for ${specialization}.`;
  const diagnosis = primaryPrediction?.condition ?? 'Undifferentiated clinical presentation';
  const redFlagText = primaryPrediction?.redFlags.length
    ? primaryPrediction.redFlags.join(', ')
    : 'no immediate profile-specific red flags';

  const generatedCase: GeneratedAICase = {
    title: `AI case draft: ${diagnosis}`,
    description: [
      `An anonymized ${difficulty} learning case generated for ${specialization}.`,
      `Presenting symptoms: ${symptoms.join(', ')}.`,
      `Learning objective: ${learningObjective}`,
      'This draft is intentionally held for clinician review before publication.'
    ].join('\n\n'),
    symptoms,
    patientInfo: {
      age: normalizePatientAge(body.patientAge),
      gender: normalizePatientGender(body.patientGender),
      medicalHistory: [],
      currentMedications: []
    },
    diagnosis,
    treatment: primaryPrediction?.recommendations.join('\n') ?? 'Clinician review required.',
    tags: Array.from(new Set(['ai-generated', 'scheduled-case', specialization.toLowerCase()])),
    difficulty,
    specialization,
    aiSummary: [
      `${primaryPrediction?.confidence ?? 0} confidence educational draft for ${diagnosis}.`,
      `Matched symptoms: ${primaryPrediction?.matchedSymptoms.join(', ') || symptoms.join(', ')}.`,
      `Red flags: ${redFlagText}.`
    ].join(' '),
    reviewChecklist: [
      'Confirm the case is anonymized and contains no real patient identifiers.',
      'Verify clinical reasoning, likely diagnosis, and suggested management.',
      'Approve publication only after the draft is useful for interns and safe for learners.'
    ]
  };

  return {
    generatedCase,
    interval: normalizeInterval(body.interval),
    scheduledFor: parseScheduledFor(body.scheduledFor)
  };
};
