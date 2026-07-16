import { Request, Response } from 'express';
import ResearchPaper from '../models/ResearchPaper';
import path from 'path';
import fs from 'fs';

export const getResearchPaperById = async (req: Request, res: Response) => {
  try {
    const paper = await ResearchPaper.findById(req.params.id)
      .populate('comments.author', 'firstName lastName profilePicture userType');
    if (!paper) return res.status(404).json({ error: 'Research paper not found.' });
    res.json({ data: { paper } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch research paper.' });
  }
};
 

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
// ✅ NEW FUNCTION - Adding this for PDF downloads
export const downloadResearchPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
 
    // 1. Find the paper by ID
    const paper = await ResearchPaper.findById(id);
    
    if (!paper) {
      return res.status(404).json({ 
        error: 'Research paper not found.' 
      });
    }
 
    // 2. Check if fileUrl exists
    if (!paper.fileUrl) {
      return res.status(404).json({ 
        error: 'PDF file is not available for this paper.' 
      });
    }
 
    // 3. Build the file path
    // If fileUrl is just a filename, construct the full path
    // If fileUrl is a full path, use it as is
    let filePath: string;
    
    if (paper.fileUrl.startsWith('/') || paper.fileUrl.includes('\\')) {
      // Absolute path
      filePath = paper.fileUrl;
    } else {
      // Relative path - construct it
      filePath = path.join(__dirname, '../../uploads', paper.fileUrl);
    }
 
    // 4. Security check - prevent path traversal attacks
    const uploadsDir = path.join(__dirname, '../../uploads');
    const resolvedPath = path.resolve(filePath);
    
    if (!resolvedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ 
        error: 'Access denied.' 
      });
    }
 
    // 5. Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'PDF file not found on server. Please contact support.' 
      });
    }
 
    // 6. Download the file
    const filename = path.basename(filePath);
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        // Only send response if not already sent
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Failed to download PDF. Please try again.' 
          });
        }
      }
    });
 
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ 
      error: 'Failed to download PDF. Please try again.' 
    });
  }
};
 
