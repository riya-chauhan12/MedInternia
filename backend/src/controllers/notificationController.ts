import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Notification, { INotification } from '../models/Notification';
import User from '../models/User';
import { emitToUser } from '../utils/socket';

// ─────────────────────────────────────────────
// CORE HELPER — used by ALL other controllers
// ─────────────────────────────────────────────
interface CreateNotificationOptions {
  recipientId: string;
  type: INotification['type'];
  message: string;
  link?: string;
  payload?: Record<string, any>;
}

export const createAndEmitNotification = async (
  opts: CreateNotificationOptions
): Promise<void> => {
  try {
    const notification = await Notification.create({
      recipient: opts.recipientId,
      type:      opts.type,
      message:   opts.message,
      link:      opts.link,
      payload:   opts.payload,
    });

    // Emit real-time event to the recipient's private socket room
    emitToUser(opts.recipientId.toString(), 'new_notification', {
      _id:       notification._id,
      type:      notification.type,
      message:   notification.message,
      link:      notification.link,
      payload:   notification.payload,
      isRead:    notification.isRead,
      createdAt: notification.createdAt,
    });
  } catch (error) {
    // Never crash the parent operation if notification fails
    console.error('Failed to create/emit notification:', error);
  }
};

// ─────────────────────────────────────────────
// GET /api/notifications
// Fetch last 30 notifications for logged-in user
// ─────────────────────────────────────────────
export const getNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// Mark a single notification as read
// ─────────────────────────────────────────────
export const markRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params; // ← Fixed: was req.body.id

    await Notification.updateOne(
      { _id: id, recipient: req.user._id },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking notification as read' });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/notifications/read-all
// Mark ALL notifications as read
// ─────────────────────────────────────────────
export const markAllRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking all as read' });
  }
};

// ─────────────────────────────────────────────
// WEBINAR HELPER — notify all interns of new webinar
// ─────────────────────────────────────────────
export const notifyInternsWebinar = async (webinar: any): Promise<void> => {
  try {
    const interns = await User.find({ userType: 'intern' }).select('_id').lean();

    await Promise.all(
      interns.map((intern) =>
        createAndEmitNotification({
          recipientId: String(intern._id),
          type:    'webinar',
          message: `New webinar: "${webinar.title}" — join now`,
          link:    webinar.meetingLink,
          payload: { webinarId: webinar._id },
        })
      )
    );
  } catch (error) {
    console.error('Failed to notify interns about webinar:', error);
  }
};