import React, { useState, useRef, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Tooltip,
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  ClickAwayListener,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import WorkIcon from '@mui/icons-material/Work';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useRouter } from 'next/router';
import { useNotifications, Notification } from '../hooks/useNotifications';

// Icon per notification type
const typeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'comment':     return <ChatBubbleIcon fontSize="small" color="primary" />;
    case 'peer_review': return <StarIcon fontSize="small" color="warning" />;
    case 'job_status':  return <WorkIcon fontSize="small" color="success" />;
    case 'badge':       return <EmojiEventsIcon fontSize="small" color="secondary" />;
    case 'webinar':     return <VideocamIcon fontSize="small" color="info" />;
    default:            return <NotificationsIcon fontSize="small" />;
  }
};

// Human-readable relative time
const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleToggle = () => setOpen((prev) => !prev);
  const handleClose  = () => setOpen(false);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) await markAsRead(n._id);
    handleClose();
    if (n.link) router.push(n.link);
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        {/* Bell Icon with Badge */}
        <Tooltip title="Notifications" placement="bottom" arrow>
          <IconButton
            ref={anchorRef}
            color="inherit"
            onClick={handleToggle}
            sx={{ mx: 0.5, p: 1.2, borderRadius: 2 }}
            aria-label="Notifications"
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  minWidth: 16,
                  height: 16,
                },
              }}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Dropdown Panel */}
        {open && (
          <Paper
            elevation={6}
            sx={{
              position: 'absolute',
              top: 48,
              right: 0,
              width: 340,
              maxHeight: 480,
              overflowY: 'auto',
              borderRadius: 3,
              zIndex: 1400,
              boxShadow: '0 8px 32px rgba(33,147,176,0.18)',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                px: 2, py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(90deg, #1d8299 0%, #5ac0d8 100%)',
                borderRadius: '12px 12px 0 0',
              }}
            >
              <Typography fontWeight={700} color="white">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Typography>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={markAllAsRead}
                  sx={{ color: 'white', textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Mark all read
                </Button>
              )}
            </Box>

            <Divider />

            {/* Notification List */}
            {notifications.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  No notifications yet
                </Typography>
              </Box>
            ) : (
              notifications.slice(0, 30).map((n) => (
                <Box
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  sx={{
                    px: 2, py: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    cursor: 'pointer',
                    background: n.isRead ? 'transparent' : '#e3f2fd',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background 0.2s',
                    '&:hover': { background: '#f5f5f5' },
                  }}
                >
                  {/* Type Icon */}
                  <Box sx={{ mt: 0.3, flexShrink: 0 }}>
                    {typeIcon(n.type)}
                  </Box>

                  {/* Message + Time */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={n.isRead ? 400 : 700}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {n.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {relativeTime(n.createdAt)}
                    </Typography>
                  </Box>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <Box
                      sx={{
                        width: 8, height: 8,
                        borderRadius: '50%',
                        bgcolor: '#1d8299',
                        flexShrink: 0,
                        mt: 0.8,
                      }}
                    />
                  )}
                </Box>
              ))
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <>
                <Divider />
                <Box sx={{ py: 1, textAlign: 'center' }}>
                  <Button
                    size="small"
                    onClick={() => { handleClose(); router.push('/notifications'); }}
                    sx={{ color: '#1d8299', textTransform: 'none', fontWeight: 600 }}
                  >
                    View all notifications →
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}