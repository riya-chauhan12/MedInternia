import express from 'express';
import {
  getLearningPaths,
  getLearningPathById,
  enrollInPath,
  completeStep
} from '../controllers/learningPathController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = express.Router();

// Get all learning paths (optional auth to see user progress if logged in)
router.get('/', optionalAuthenticate, getLearningPaths);

// Get specific learning path details
router.get('/:id', optionalAuthenticate, getLearningPathById);

// Enroll in a learning path
router.post('/:id/enroll', authenticate, enrollInPath);

// Complete a step in a learning path
router.post('/:id/progress', authenticate, completeStep);

export default router;
