import videoRoutes from './video';
import researchPaperRoutes from './researchPapers';
import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import patientRoutes from './patients';
import doctorRoutes from './doctors';
import caseRoutes from './cases';
import enhancedRoutes from './enhanced';
import badgeRoutes from './badges';
import peerReviewRoutes from './peerReviews';
import jobRoutes from './jobs';
import certificateRoutes from './certificates';
import webinarRoutes from './webinars';
import userRoutes from './users';
import integrationRoutes from './integration';
import notificationRoutes from './notifications';
import diseaseInsightRoutes from './diseaseInsights';
import symptomRoutes from './symptoms';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Doctor-Intern Collaboration Platform API',
    version: '3.0.0',
    description: 'Comprehensive medical education platform connecting doctors, interns, and patients',
    features: [
      'Case-based learning',
      'Peer review system',
      'Badge & certification system',
      'Job opportunities board',
      'Webinars & AMAs',
      'AI-powered suggestions',
      'Live video conferencing'
    ],
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      patients: '/api/patients',
      doctors: '/api/doctors',
      cases: '/api/cases',
      aiCasePosts: '/api/cases/ai-posts',
      diseaseInsights: '/api/ai-disease-insights',
      badges: '/api/badges',
      peerReviews: '/api/peer-reviews',
      jobs: '/api/jobs',
      certificates: '/api/certificates',
      webinars: '/api/webinars',
      symptoms: '/api/symptoms/extract',
      leaderboard: '/api/leaderboard',
      search: '/api/search'
    }
  });
});

router.get('/test', (req: Request, res: Response) => {
  res.json({
    message: 'Test route is working!',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/video', videoRoutes);
router.use('/users', userRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/cases', caseRoutes);
router.use('/ai-disease-insights', diseaseInsightRoutes);
router.use('/badges', badgeRoutes);
router.use('/peer-reviews', peerReviewRoutes);
router.use('/jobs', jobRoutes);
router.use('/certificates', certificateRoutes);
router.use('/webinars', webinarRoutes);
router.use('/notifications', notificationRoutes);
router.use('/integration', integrationRoutes);
router.use('/symptoms', symptomRoutes);
router.use('/', enhancedRoutes);
router.use('/research-papers', researchPaperRoutes);

export default router;
