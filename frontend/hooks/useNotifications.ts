import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken } from '../utils/api';

export interface Notification {
  _id: string;
  type: 'comment' | 'peer_review' | 'job_status' | 'webinar' | 'badge';
  message: string;
  link?: string;
  payload?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [newToast, setNewToast]           = useState<Notification | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ── Recalculate unread count whenever notifications change ──
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.isRead).length);
  }, [notifications]);

  // ── Connect socket + fetch initial notifications ────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = getAuthToken();
    if (!token) return; // Not logged in — do nothing

    // 1. Fetch existing notifications from REST API
    fetch(`${BACKEND_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setNotifications(data.notifications);
      })
      .catch(() => {}); // Silently fail — non-critical

    // 2. Connect Socket.io with JWT auth
    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // 3. Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 4. Listen for real-time notifications
    socket.on('new_notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setNewToast(notification); // Triggers toast popup
      
      // Trigger native browser push notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new window.Notification('MedInternia Alert', {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ── Mark single notification as read ────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );

    await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, []);

  // ── Mark all notifications as read ──────────────────────────
  const markAllAsRead = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    await fetch(`${BACKEND_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, []);

  // ── Clear toast after it's been shown ───────────────────────
  const clearToast = useCallback(() => setNewToast(null), []);

  return {
    notifications,
    unreadCount,
    newToast,
    markAsRead,
    markAllAsRead,
    clearToast,
  };
}