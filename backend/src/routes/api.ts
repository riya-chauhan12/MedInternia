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
      badges: '/api/badges',
      peerReviews: '/api/peer-reviews',
      jobs: '/api/jobs',
      certificates: '/api/certificates',
      webinars: '/api/webinars',
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

// Auth routes
router.use('/auth', authRoutes);

// Video conferencing routes
router.use('/video', videoRoutes);

// User routes
router.use('/users', userRoutes);

// Patient routes
router.use('/patients', patientRoutes);

// Doctor routes
router.use('/doctors', doctorRoutes);

// Case routes
router.use('/cases', caseRoutes);

// Badge routes
router.use('/badges', badgeRoutes);

// Peer review routes
router.use('/peer-reviews', peerReviewRoutes);

// Job opportunity routes
router.use('/jobs', jobRoutes);

// Certificate routes
router.use('/certificates', certificateRoutes);

// Webinar routes
router.use('/webinars', webinarRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Integration routes (LinkedIn, GitHub)
router.use('/integration', integrationRoutes);

// Enhanced features routes (leaderboard, search, etc.)
router.use('/', enhancedRoutes);

// Research paper routes
router.use('/research-papers', researchPaperRoutes);

export default router;
