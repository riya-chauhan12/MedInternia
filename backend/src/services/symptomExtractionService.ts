export interface SymptomMatch {
  symptom: string;
  confidence: number;
  source: 'lexicon' | 'modifier';
}

interface InternalSymptomMatch extends SymptomMatch {
  start: number;
  end: number;
}

const SYMPTOM_PHRASES = [
  'shortness of breath',
  'difficulty breathing',
  'loss of appetite',
  'loss of smell',
  'loss of taste',
  'chest tightness',
  'chest pain',
  'abdominal pain',
  'stomach pain',
  'lower back pain',
  'back pain',
  'sore throat',
  'runny nose',
  'stuffy nose',
  'nasal congestion',
  'persistent cough',
  'dry cough',
  'productive cough',
  'blood in stool',
  'blood in urine',
  'burning urination',
  'painful urination',
  'blurred vision',
  'double vision',
  'heart palpitations',
  'joint pain',
  'muscle pain',
  'body ache',
  'body aches',
  'night sweats',
  'skin rash',
  'high fever',
  'low grade fever',
  'fever',
  'cough',
  'headache',
  'migraine',
  'nausea',
  'vomiting',
  'diarrhea',
  'constipation',
  'fatigue',
  'weakness',
  'dizziness',
  'fainting',
  'chills',
  'sweating',
  'wheezing',
  'breathlessness',
  'swelling',
  'itching',
  'redness',
  'anxiety',
  'confusion',
  'seizure',
  'tremor',
  'numbness',
  'tingling',
  'dehydration'
];

const MODIFIERS = [
  'acute',
  'chronic',
  'constant',
  'dry',
  'high',
  'low',
  'mild',
  'persistent',
  'productive',
  'recurrent',
  'recurring',
  'severe',
  'worsening'
];

const BASE_SYMPTOMS = [
  'ache',
  'breathlessness',
  'congestion',
  'cough',
  'cramps',
  'diarrhea',
  'dizziness',
  'fatigue',
  'fever',
  'headache',
  'itching',
  'nausea',
  'pain',
  'rash',
  'swelling',
  'vomiting',
  'weakness',
  'wheezing'
];

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createPhraseRegex = (phrase: string): RegExp =>
  new RegExp(`(^|\\s)(${escapeRegExp(phrase).replace(/\\ /g, '\\s+')})(?=\\s|$)`, 'g');

const addMatch = (matches: InternalSymptomMatch[], match: InternalSymptomMatch) => {
  const overlapsLongerMatch = matches.some(existing =>
    existing.start <= match.start &&
    existing.end >= match.end &&
    existing.symptom.length >= match.symptom.length
  );

  if (!overlapsLongerMatch) {
    matches.push(match);
  }
};

const findLexiconMatches = (normalizedText: string): InternalSymptomMatch[] => {
  const matches: InternalSymptomMatch[] = [];

  [...SYMPTOM_PHRASES]
    .sort((a, b) => b.length - a.length)
    .forEach(symptom => {
      const regex = createPhraseRegex(symptom);
      let result = regex.exec(normalizedText);

      while (result) {
        const leadingWhitespace = result[1].length;
        const start = result.index + leadingWhitespace;
        const phrase = result[2];
        addMatch(matches, {
          symptom,
          start,
          end: start + phrase.length,
          confidence: 0.96,
          source: 'lexicon'
        });
        result = regex.exec(normalizedText);
      }
    });

  return matches;
};

const findModifierMatches = (normalizedText: string): InternalSymptomMatch[] => {
  const matches: InternalSymptomMatch[] = [];
  const modifierPattern = MODIFIERS.map(escapeRegExp).join('|');
  const symptomPattern = BASE_SYMPTOMS.map(escapeRegExp).join('|');
  const regex = new RegExp(`(^|\\s)((${modifierPattern})\\s+(${symptomPattern}))(?=\\s|$)`, 'g');
  let result = regex.exec(normalizedText);

  while (result) {
    const leadingWhitespace = result[1].length;
    const start = result.index + leadingWhitespace;
    const phrase = result[2];
    matches.push({
      symptom: phrase,
      start,
      end: start + phrase.length,
      confidence: 0.88,
      source: 'modifier'
    });
    result = regex.exec(normalizedText);
  }

  return matches;
};

export const extractSymptomMatches = (text: string): SymptomMatch[] => {
  const normalizedText = normalizeText(text);
  if (!normalizedText) return [];

  const combinedMatches: InternalSymptomMatch[] = [];

  [...findLexiconMatches(normalizedText), ...findModifierMatches(normalizedText)]
    .sort((a, b) => b.symptom.length - a.symptom.length)
    .forEach(match => addMatch(combinedMatches, match));

  const uniqueMatches = new Map<string, InternalSymptomMatch>();

  combinedMatches
    .sort((a, b) => a.start - b.start || b.symptom.length - a.symptom.length)
    .forEach(match => {
      if (!uniqueMatches.has(match.symptom)) {
        uniqueMatches.set(match.symptom, match);
      }
    });

  return [...uniqueMatches.values()]
    .sort((a, b) => a.start - b.start)
    .map(({ symptom, confidence, source }) => ({
      symptom,
      confidence,
      source
    }));
};

export const extractSymptoms = (text: string): string[] =>
  extractSymptomMatches(text).map(match => match.symptom);
