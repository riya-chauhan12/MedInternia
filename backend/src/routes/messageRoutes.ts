import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getConversations,
  getMessages,
  sendMessage
} from '../controllers/messageController';

const router = express.Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/:conversationId', getMessages);
router.post('/', sendMessage);

export default router;
