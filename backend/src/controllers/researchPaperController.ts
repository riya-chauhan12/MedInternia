import { Request, Response } from 'express';
import ResearchPaper from '../models/ResearchPaper';

export const createResearchPaper = async (req: Request, res: Response) => {
  try {
    const { title, description, field, difficulty, fileUrl } = req.body;
    const paper = new ResearchPaper({
      title,
      description,
      field,
      difficulty,
      fileUrl,
    });
    await paper.save();
    res.status(201).json(paper);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create research paper.' });
  }
};

export const getAllResearchPapers = async (req: Request, res: Response) => {
  try {
    const papers = await ResearchPaper.find().sort({ createdAt: -1 });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch research papers.' });
  }
};
