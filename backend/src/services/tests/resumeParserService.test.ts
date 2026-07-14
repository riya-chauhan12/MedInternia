import { parseResumeText, extractTextFromBuffer } from '../resumeParserService';

// Mock pdf-parse
jest.mock('pdf-parse', () => {
  return jest.fn().mockImplementation((buffer) => {
    if (buffer.toString() === 'mock-pdf-buffer') {
      return Promise.resolve({ text: 'Cardiology resident with 3 years of experience at Delhi Medical School. Skills: Surgery, Suturing, Python.' });
    }
    return Promise.resolve({ text: '' });
  });
});

// Mock mammoth
jest.mock('mammoth', () => {
  return {
    extractRawText: jest.fn().mockImplementation((options) => {
      if (options.buffer.toString() === 'mock-docx-buffer') {
        return Promise.resolve({ value: 'Pediatrics specialist with 5 years experience. Medical school: Harvard School of Medicine. Skills: Patient Care, CPR.' });
      }
      return Promise.resolve({ value: '' });
    })
  };
});

describe('Resume Parser Service', () => {
  describe('extractTextFromBuffer', () => {
    it('extracts text from PDF buffers', async () => {
      const buf = Buffer.from('mock-pdf-buffer');
      const text = await extractTextFromBuffer(buf, 'application/pdf', 'resume.pdf');
      expect(text).toContain('Delhi Medical School');
    });

    it('extracts text from DOCX buffers', async () => {
      const buf = Buffer.from('mock-docx-buffer');
      const text = await extractTextFromBuffer(buf, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'resume.docx');
      expect(text).toContain('Harvard School of Medicine');
    });

    it('extracts text from TXT buffers', async () => {
      const buf = Buffer.from('Plain text resume content. 2 years experience.');
      const text = await extractTextFromBuffer(buf, 'text/plain', 'resume.txt');
      expect(text).toContain('Plain text resume content');
    });

    it('throws error for unsupported file types', async () => {
      const buf = Buffer.from('some-data');
      await expect(extractTextFromBuffer(buf, 'image/png', 'resume.png'))
        .rejects.toThrow('Unsupported file type');
    });
  });

  describe('parseResumeText', () => {
    it('correctly parses skills, school, experience and summary from text', () => {
      const text = `
        PROFESSIONAL SUMMARY
        Enthusiastic medical intern focused on cardiology and patient care.
        
        EDUCATION
        Delhi Medical School - MD, 2024
        
        EXPERIENCE
        Clinical Intern - 3 years of experience in emergency care.
        
        SKILLS
        Surgery, Suturing, Intubation, Python, Data Entry.
      `;

      const result = parseResumeText(text);

      expect(result.skills).toContain('Surgery');
      expect(result.skills).toContain('Suturing');
      expect(result.skills).toContain('Intubation');
      expect(result.skills).toContain('Python');
      expect(result.skills).toContain('Data Entry');
      expect(result.medicalSchool).toBe('Delhi Medical School - MD, 2024');
      expect(result.experience).toBe(3);
      expect(result.bio).toContain('Enthusiastic medical intern focused on cardiology and patient care.');
    });

    it('handles fallback bio construction when no summary is found', () => {
      const text = `
        Delhi School of Medicine
        Experience: 2 years.
        Skills: Suturing, Research.
      `;

      const result = parseResumeText(text);

      expect(result.medicalSchool).toBe('Delhi School of Medicine');
      expect(result.experience).toBe(2);
      expect(result.skills).toContain('Suturing');
      expect(result.skills).toContain('Research');
      expect(result.bio).toBe('I am studied at Delhi School of Medicine with 2 years of clinical experience. Key areas of focus include Suturing, Research.');
    });

    it('returns default values for empty or irrelevant resume text', () => {
      const text = 'Random words without school or experience keywords.';
      const result = parseResumeText(text);

      expect(result.skills).toEqual([]);
      expect(result.medicalSchool).toBe('');
      expect(result.experience).toBe(0);
      expect(result.bio).toBe('I am a medical student.');
    });
  });
});
