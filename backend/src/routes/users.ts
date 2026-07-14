import { Router, Request } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import {
  getUserProfile,
  getPublicProfile,
  updateUserProfile,
  getInternScorecard,
  getDoctorMentorSummary,
  getLeaderboard,
  verifyDoctor,
  grantContributorBadge,
  upgradeProfile,
  awardPointsToIntern,
  followUser,
  unfollowUser,
  getConnections,
  parseResume
} from '../controllers/userController';
import { toggleBookmark, getSavedItems } from '../controllers/userBookmarksController';
import multer from 'multer';
import { isAllowedResumeUpload } from '../utils/uploadValidation';

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedResumeUpload(file.originalname, file.mimetype)) {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed for resume upload'));
      return;
    }
    cb(null, true);
  }
});

const router = Router();

// Parse resume and auto-populate profile
router.post('/profile/parse-resume', authenticate, resumeUpload.single('resume'), parseResume);

// Get user profile by ID
router.get('/:userId/profile', authenticate, getUserProfile);

// Get basic public info of any user
router.get('/:userId/public', authenticate, getPublicProfile);

// Update user profile
router.put('/:userId/profile', authenticate, updateUserProfile);

// Get intern scorecard
router.get('/:userId/scorecard', authenticate, getInternScorecard);

// Get doctor mentorship score and resume-style summary
router.get('/:userId/mentor-summary', getDoctorMentorSummary);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

// Verify doctor (admin/verified doctor only)
router.patch('/:userId/verify', authenticate, requirePermission('profile:verify'), verifyDoctor);

// Grant contributor badge
router.post('/:userId/grant-contributor', authenticate, requirePermission('badge:manage'), grantContributorBadge);

// Upgrade intern profile to doctor
router.patch('/upgrade-profile', authenticate, upgradeProfile);

// Doctor awards points to intern as recommendation
router.post('/:internId/award-points', authenticate, requirePermission('user:award_points'), awardPointsToIntern);

// Follow a user
router.post('/follow', authenticate, followUser);

// Unfollow a user
router.delete('/:userId/following/:followId', authenticate, unfollowUser);

// Get user connections (followers/following)
router.get('/:userId/connections', getConnections);

// Get saved items for user profile
router.get('/:userId/saved', authenticate, getSavedItems);

// Toggle bookmark for case, job, or webinar
router.post('/:userId/save/:itemType/:itemId', authenticate, toggleBookmark);

export default router;
