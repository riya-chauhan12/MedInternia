import path from 'path';

// Using require for pdf-parse and mammoth to avoid type issues during compile
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const COMMON_SKILLS = [
  "Surgery", "Pediatrics", "Cardiology", "Neurology", "Oncology", "Psychiatry", 
  "Radiology", "Emergency", "Internal Medicine", "Suturing", "Intubation", "CPR", 
  "ECG", "EKG", "Phlebotomy", "Anatomy", "Pathology", "Patient Care", "Diagnostics", 
  "Clinical Rotation", "Immunology", "Pharmacology", "Vital Signs", "Wound Care", 
  "Anesthesiology", "Gastroenterology", "Dermatology", "Obstetrics", "Gynecology", 
  "Orthopedics", "Python", "Data Entry", "Statistics", "Machine Learning", 
  "Data Analysis", "SQL", "R", "Excel", "Research", "Scientific Writing", 
  "EMR", "EHR", "Healthcare IT", "Communication", "Leadership", "Teamwork"
];

export interface ExtractedResumeData {
  skills: string[];
  medicalSchool: string;
  experience: number; // in years
  bio: string;
}

/**
 * Extract raw text from the uploaded file buffer.
 */
export async function extractTextFromBuffer(buffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  const ext = path.extname(originalname).toLowerCase();
  
  if (mimetype === 'application/pdf' || ext === '.pdf') {
    const data = await pdfParse(buffer);
    return data.text || '';
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    ext === '.docx'
  ) {
    const data = await mammoth.extractRawText({ buffer });
    return data.value || '';
  } else if (mimetype === 'text/plain' || ext === '.txt') {
    return buffer.toString('utf8');
  }
  
  throw new Error(`Unsupported file type: ${mimetype} (${ext})`);
}

/**
 * Run a lightweight algorithm to parse skills, school, experience and bio.
 */
export function parseResumeText(text: string): ExtractedResumeData {
  // 1. Extract Skills
  const skills: string[] = [];
  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(text)) {
      skills.push(skill);
    }
  }

  // 2. Extract Medical School / Education
  let medicalSchool = "";
  const lines = text.split('\n');
  const schoolKeywords = [
    'medical school', 'school of medicine', 'university', 'college', 'institute', 
    'school of health', 'faculty of medicine', 'health sciences'
  ];
  
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    if (schoolKeywords.some(keyword => lineLower.includes(keyword))) {
      const cleaned = line.replace(/^[\s\-\*•\d\.\,\(\)]+/, '').trim();
      if (cleaned.length > 5 && cleaned.length < 150) {
        medicalSchool = cleaned;
        break;
      }
    }
  }

  if (!medicalSchool) {
    const fallbackRegex = /([A-Za-z0-9\s,.-]+(?:University|College|School of Medicine|Medical School|Institute)[A-Za-z0-9\s,.-]*)/i;
    const match = text.match(fallbackRegex);
    if (match) {
      medicalSchool = match[1].trim();
    }
  }

  // 3. Extract Experience
  let experience = 0;
  const expPatterns = [
    /(\d+)\+?\s*years?\s*of\s*experience/i,
    /(\d+)\+?\s*years?\s*working/i,
    /(\d+)\+?\s*years?\s*in\s*clinical/i,
    /(\d+)\+?\s*years?\s*experience/i,
    /experience:\s*(\d+)\s*years?/i
  ];
  
  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > 0 && val < 50) {
        experience = val;
        break;
      }
    }
  }

  if (experience === 0) {
    const genericPattern = /\b(\d+)\s+years?\b/i;
    const match = text.match(genericPattern);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > 0 && val < 50) {
        experience = val;
      }
    }
  }

  // 4. Extract / Generate Bio
  let bio = "";
  let summaryStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    if (line === 'summary' || line === 'professional summary' || line === 'objective' || line === 'about me') {
      summaryStartIndex = i + 1;
      break;
    }
  }
  
  if (summaryStartIndex !== -1) {
    let summaryText = "";
    for (let i = summaryStartIndex; i < Math.min(summaryStartIndex + 4, lines.length); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (['experience', 'education', 'skills', 'projects', 'certifications'].includes(line.toLowerCase())) {
        break;
      }
      summaryText += line + " ";
    }
    if (summaryText.trim().length > 20) {
      bio = summaryText.trim();
    }
  }
  
  if (!bio) {
    const schoolPart = medicalSchool ? `studied at ${medicalSchool}` : 'a medical student';
    const expPart = experience > 0 ? ` with ${experience} years of clinical experience` : '';
    const skillsPart = skills.length > 0 ? `. Key areas of focus include ${skills.slice(0, 4).join(', ')}` : '';
    bio = `I am ${schoolPart}${expPart}${skillsPart}.`;
  }

  // Ensure bio is capped at 500 characters
  bio = bio.slice(0, 500);

  return {
    skills,
    medicalSchool,
    experience,
    bio
  };
}
