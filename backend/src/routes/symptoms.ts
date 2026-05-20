import { Router } from 'express';
import { extractSymptomsFromText } from '../controllers/symptomExtractionController';

const router = Router();

router.post('/extract', extractSymptomsFromText);

export default router;
