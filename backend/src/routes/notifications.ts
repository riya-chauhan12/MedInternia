import express from 'express';
import {
  getNotifications,
  markAllRead,
  markRead,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// GET  /api/notifications          — fetch last 30 for logged-in user
router.get('/', authenticate, getNotifications);

// PATCH /api/notifications/read-all    — mark ALL as read
router.patch('/read-all', authenticate, markAllRead);

// PATCH /api/notifications/:id/read   — mark ONE as read
router.patch('/:id/read', authenticate, markRead);

export default router;