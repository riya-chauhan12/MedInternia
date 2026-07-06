import express from 'express';
import {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  deleteCase,
  addComment,
  toggleLike,
  getMyCases,
  addFollowUp,
  getCaseFollowUps,
  getCaseModerationQueue,
  getMyAICaseSchedules,
  generateAISuggestions,
  getCaseAISuggestions,
  moderateCase,
  publishDueAICasePosts,
  pinComment,
  unpinComment,
  getPinnedComments,
  reviewAICasePost,
  scheduleAICasePost,
  toggleRepostPermission,
  repostCase,
  replyToComment,
  likeComment,
  rateComment,
  solveCase,
  getRecommendedCases,
  getFlaggedComments,
  moderateComment
} from '../controllers/caseController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

// Authenticated case browsing routes
router.get('/recommended', authenticate, getRecommendedCases);
router.get('/', optionalAuthenticate, getCases);
router.get('/my/cases', authenticate, getMyCases);
router.post('/:id/solve', authenticate, solveCase);
router.get('/moderation/queue', authenticate, requirePermission('comment:moderate'), getCaseModerationQueue);
router.get('/comments/moderation/queue', authenticate, requirePermission('comment:moderate'), getFlaggedComments);
router.get('/ai-posts/my', authenticate, getMyAICaseSchedules);

// Permission-guarded case management routes
router.post('/', authenticate, requirePermission('case:create'), createCase);
router.post('/ai-posts/schedule', authenticate, requirePermission('case:create'), scheduleAICasePost);
router.patch('/ai-posts/:scheduleId/review', authenticate, requirePermission('comment:moderate'), reviewAICasePost);
router.post('/ai-posts/publish-due', authenticate, requirePermission('comment:moderate'), publishDueAICasePosts);
router.get('/:id', optionalAuthenticate, getCaseById);
router.put('/:id', authenticate, requirePermission('case:update'), updateCase);
router.delete('/:id', authenticate, requirePermission('case:delete'), deleteCase);
router.patch('/:id/moderation', authenticate, requirePermission('comment:moderate'), moderateCase);
router.patch('/:caseId/comments/:commentId/moderation', authenticate, requirePermission('comment:moderate'), moderateComment);

// Permission-guarded interactive routes
router.post('/:id/comments', authenticate, requirePermission('comment:create'), addComment);
router.post('/:caseId/comments/:commentId/reply', authenticate, requirePermission('comment:create'), replyToComment);
router.post('/:caseId/comments/:commentId/like', authenticate, likeComment);
router.post('/:caseId/comments/:commentId/rate', authenticate, requirePermission('rating:create'), rateComment);
router.post('/:id/like', authenticate, toggleLike);

// Follow-up routes
router.post('/:id/follow-ups', authenticate, requirePermission('case:follow_up'), addFollowUp);
router.get('/:id/follow-ups', authenticate, getCaseFollowUps);

// AI suggestion routes
router.post('/:id/ai-suggestions', authenticate, generateAISuggestions);
router.get('/:id/ai-suggestions', authenticate, getCaseAISuggestions);

// Comment moderation routes
router.post('/:caseId/comments/:commentId/pin', authenticate, requirePermission('comment:moderate'), pinComment);
router.post('/:caseId/comments/:commentId/unpin', authenticate, requirePermission('comment:moderate'), unpinComment);
// Get all pinned comments for a case
router.get('/:caseId/pinned-comments', authenticate, getPinnedComments);
// Toggle repost permission (case owner only)
router.patch('/:id/repost-permission', authenticate, requirePermission('case:update'), toggleRepostPermission);
// Repost a case (if allowed)
router.post('/:id/repost', authenticate, requirePermission('case:repost'), repostCase);
export default router;
