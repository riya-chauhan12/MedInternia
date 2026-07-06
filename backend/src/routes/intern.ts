import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getInternProfile, getInternCredits } from '../controllers/internController';

const router = Router();

router.get('/profile', authenticate, getInternProfile);
router.get('/credits', authenticate, getInternCredits);

export default router;
