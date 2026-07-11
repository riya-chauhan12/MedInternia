import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import {
  createWebinar,
  getWebinars,
  getWebinarById,
  registerForWebinar,
  unregisterFromWebinar,
  updateWebinar,
  markAttendance,
  submitFeedback,
  getUserWebinars,
  generateMeetingLink,
  createPoll,
  votePoll,
  closePoll,
  askQuestion,
  upvoteQuestion,
  markQuestionAnswered
} from '../controllers/webinarController';

const router = Router();

// Create webinar
router.post('/', authenticate, requirePermission('webinar:manage'), createWebinar);

// Get all webinars
router.get('/', getWebinars);

// Get user's webinars
router.get('/my', authenticate, getUserWebinars);

// Get webinar by ID
router.get('/:id', getWebinarById);

// Register for webinar
router.post('/:id/register', authenticate, requirePermission('webinar:attend'), registerForWebinar);

// Unregister from webinar
router.delete('/:id/register', authenticate, requirePermission('webinar:attend'), unregisterFromWebinar);

// Update webinar
router.put('/:id', authenticate, requirePermission('webinar:manage'), updateWebinar);

// Mark attendance
router.patch('/:id/attendance', authenticate, requirePermission('webinar:manage'), markAttendance);

// Submit feedback
router.post('/:id/feedback', authenticate, requirePermission('webinar:feedback'), submitFeedback);

// Generate meeting link
router.post('/:id/meeting-link', authenticate, requirePermission('webinar:manage'), generateMeetingLink);

// ------------------------------------------------------------------
// POLLING ROUTES
// ------------------------------------------------------------------

// Create a new poll
router.post('/:id/polls', authenticate, requirePermission('webinar:manage'), createPoll);

// Vote on a poll
router.post('/:id/polls/:pollId/vote', authenticate, votePoll);

// Close a poll
router.patch('/:id/polls/:pollId/close', authenticate, requirePermission('webinar:manage'), closePoll);

// ------------------------------------------------------------------
// Q&A ROUTES
// ------------------------------------------------------------------

// Ask a question
router.post('/:id/qna', authenticate, askQuestion);

// Upvote a question
router.post('/:id/qna/:qnaId/upvote', authenticate, upvoteQuestion);

// Mark a question as answered
router.patch('/:id/qna/:qnaId/answer', authenticate, requirePermission('webinar:manage'), markQuestionAnswered);

export default router;
