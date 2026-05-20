import { Request, Response } from 'express';
import { extractSymptomMatches } from '../services/symptomExtractionService';

const MAX_TEXT_LENGTH = 10000;

export const extractSymptomsFromText = (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text must be provided as a string'
      });
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return res.status(400).json({
        success: false,
        message: 'Text cannot be empty'
      });
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return res.status(413).json({
        success: false,
        message: `Text cannot exceed ${MAX_TEXT_LENGTH} characters`
      });
    }

    const matches = extractSymptomMatches(trimmedText);
    const symptoms = matches.map(match => match.symptom);

    return res.status(200).json({
      success: true,
      message: 'Symptoms extracted successfully',
      data: {
        symptoms,
        matches,
        count: symptoms.length
      }
    });
  } catch (error) {
    console.error('Symptom extraction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
