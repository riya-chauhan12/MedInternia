import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, CircularProgress, Alert, Button, TextField, IconButton, Stack, Collapse, Tooltip } from '@mui/material';
import { MessageCircleReply, Pin } from 'lucide-react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { motion } from 'framer-motion';
import api from '../../utils/api';

export default function CaseDiscussion({ id: propId, modalMode, hideDescription }: { id?: string, modalMode?: boolean, hideDescription?: boolean }) {
  const router = useRouter();
  const id = propId || router.query.id;
  const [caseData, setCaseData] = useState<any>(null);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [pinned, setPinned] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [openReplies, setOpenReplies] = useState<{[key: string]: boolean}>({});
  // Like and rate logic
  const handleLike = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${id}/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh discussions
      const res = await api.get(`/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const all = res.data.data.case.comments || [];
      setPinned(all.filter((c: any) => c.pinned));
      setDiscussions(all.filter((c: any) => !c.pinned));
    } catch {
      setError('Failed to like discussion');
    }
  };

  const handleRate = async (commentId: string, rating: number) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${id}/comments/${commentId}/rate`, { rating }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh discussions
      const res = await api.get(`/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const all = res.data.data.case.comments || [];
      setPinned(all.filter((c: any) => c.pinned));
      setDiscussions(all.filter((c: any) => !c.pinned));
    } catch {
      setError('Failed to rate discussion');
    }
  };
  const [replyTo, setReplyTo] = useState<any>(null);
  const [replyContent, setReplyContent] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('token');
    api.get(`/cases/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setCaseData(res.data.data.case);
        const all = res.data.data.case.comments || [];
        setPinned(all.filter((c: any) => c.pinned));
        setDiscussions(all.filter((c: any) => !c.pinned));
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch case');
        setLoading(false);
      });
  }, [id]);

  const handleDiscussion = async () => {
    try {
      const token = localStorage.getItem('token');
      // If replying, post as a reply to the selected comment
      if (replyTo) {
        await api.post(`/cases/${id}/comments/${replyTo._id}/reply`, { content: replyContent }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post(`/cases/${id}/comments`, { content: comment }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setComment('');
      setReplyTo(null);
      setReplyContent('');
      // Refresh discussions
      const res = await api.get(`/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const all = res.data.data.case.comments || [];
      setPinned(all.filter((c: any) => c.pinned));
      setDiscussions(all.filter((c: any) => !c.pinned));
    } catch {
      setError('Failed to add discussion');
    }
  };

  function handleReply(comment: any) {
    setReplyTo(comment);
    setReplyContent('');
  }

  async function submitReply() {
    if (!replyContent.trim()) return;
    await handleDiscussion();
  }

  const handlePin = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${id}/comments/${commentId}/pin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh discussions
      const res = await api.get(`/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const all = res.data.data.case.comments || [];
      setPinned(all.filter((c: any) => c.pinned));
      setDiscussions(all.filter((c: any) => !c.pinned));
    } catch {
      setError('Failed to pin discussion');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!caseData) return null;

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const isAuthor = userId && caseData?.author?.id === userId;

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        {!hideDescription && <>
          <Typography variant="h4" gutterBottom>{caseData.title}</Typography>
          <Typography variant="body1">{caseData.description}</Typography>
        </>}
          <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 700 }}>Discussions</Typography>
          <Box sx={{ maxHeight: 400, overflowY: 'auto', px: 1 }}>
            {discussions.length === 0 && (
              <Typography variant="body2" sx={{ color: '#888', textAlign: 'center', py: 4 }}>
                No discussions yet. Be the first to discuss!
              </Typography>
            )}
            {discussions
              .filter((c) => !c.replyTo) // Only top-level comments
              .map((c, idx) => {
                const isMe = c.author?.id === userId;
                const authorName = c.author?.firstName || 'Unknown';
                const initial = authorName[0]?.toUpperCase() || 'U';
                return (
                  <motion.div
                    key={c._id || idx}
                    initial={{ opacity: 0, x: isMe ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <Box sx={{
                      display: 'flex',
                      flexDirection: isMe ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      mb: 2,
                    }}>
                      <Box sx={{
                        background: isMe ? 'linear-gradient(135deg, #1976d2 60%, #64b5f6 100%)' : 'linear-gradient(135deg, #90caf9 60%, #e3f2fd 100%)',
                        color: '#fff',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 20,
                        boxShadow: 1,
                        mr: isMe ? 0 : 2,
                        ml: isMe ? 2 : 0,
                      }}>{initial}</Box>
                      <Box sx={{
                        bgcolor: isMe ? '#1976d2' : '#fff',
                        color: isMe ? '#fff' : '#222',
                        borderRadius: 3,
                        px: 2.5,
                        py: 2,
                        minWidth: 180,
                        maxWidth: 420,
                        boxShadow: '0 2px 12px #1976d222',
                        position: 'relative',
                      }}>
                        <Typography sx={{ wordBreak: 'break-word', fontSize: '1.15rem', fontWeight: 500 }}>{c.content}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{authorName}</Typography>
                          <Typography variant="caption" sx={{ ml: 1, color: '#90caf9' }}>
                            {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </Typography>
                          {/* Reply icon (lucide, always visible) */}
                          <IconButton size="small" sx={{ ml: 1, p: 0.5, color: '#1976d2', '&:hover': { bgcolor: '#e3f2fd' }, borderRadius: 2 }} onClick={() => handleReply(c)}>
                            <MessageCircleReply size={20} strokeWidth={2.2} />
                          </IconButton>
                          {/* Three dots menu for pin/unpin */}
                          {isAuthor && (
                            <Tooltip title="More options">
                              <IconButton
                                size="small"
                                sx={{
                                  ml: 1,
                                  p: 0.5,
                                  color: '#2193b0',
                                  borderRadius: 2,
                                  transition: 'background 0.2s, color 0.2s',
                                  '&:hover': {
                                    background: '#e3f2fd',
                                    color: '#1976d2',
                                  },
                                  boxShadow: '0 2px 8px #2193b022',
                                }}
                                onClick={e => { setAnchorEl(e.currentTarget); setSelectedComment(c); }}
                              >
                                <MoreVertIcon sx={{ fontSize: 24 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {/* Pin/unpin option in menu */}
                          {anchorEl && selectedComment?._id === c._id && (
                            <Box sx={{ position: 'absolute', top: 32, right: 8, zIndex: 10, bgcolor: '#fff', borderRadius: 2, boxShadow: 2, minWidth: 120, p: 1 }}>
                              <Button size="small" sx={{ color: '#1976d2', textTransform: 'none', fontWeight: 700 }} onClick={() => { handlePin(c._id); setAnchorEl(null); setSelectedComment(null); }}>{c.pinned ? 'Unpin' : 'Pin'}</Button>
                            </Box>
                          )}
                          {/* Like button with active state */}
                          <IconButton size="small" sx={{ ml: 1, p: 0.5 }} onClick={() => handleLike(c._id)}>
                            <ThumbUpAltOutlinedIcon sx={{ fontSize: 18, color: c.likedBy?.includes(userId) ? '#1976d2' : '#2193b0' }} />
                          </IconButton>
                          {/* Dropdown for replies */}
                          {c.replies && c.replies.length > 0 && (
                            <Button size="small" sx={{ ml: 1, fontSize: 12, color: '#1976d2', textTransform: 'none' }} onClick={() => setOpenReplies(prev => ({ ...prev, [c._id]: !prev[c._id] }))}>
                              {openReplies[c._id] ? 'Hide Replies' : `Show Replies (${c.replies.length})`}
                            </Button>
                          )}
                        </Box>
                        {/* Collapsible replies with WhatsApp-style reply preview */}
                        {c.replies && c.replies.length > 0 && (
                          <Collapse in={!!openReplies[c._id]}>
                            <Box sx={{ mt: 1, ml: 4, pl: 2, borderLeft: '2px solid #90caf9', bgcolor: '#f5fafd', borderRadius: 2 }}>
                              {discussions
                                .filter((r: any) => r.replyTo === c._id)
                                .map((r: any, ridx: number) => {
                                  // Find parent comment content by _id in pinned or discussions
                                  const parentContent = (() => {
                                    if (!r.replyTo) return '';
                                    const allComments = [...pinned, ...discussions];
                                    const parent = allComments.find((cm: any) => cm._id === r.replyTo);
                                    return parent?.content || '';
                                  })();
                                  return (
                                    <Box key={r._id || ridx} sx={{ mb: 2, display: 'flex', alignItems: 'flex-end' }}>
                                      <Box sx={{
                                        background: 'linear-gradient(135deg, #1976d2 60%, #64b5f6 100%)',
                                        color: '#fff',
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: 16,
                                        mr: 1.5,
                                        boxShadow: '0 2px 8px #1976d222',
                                      }}>{r.author?.firstName?.[0]?.toUpperCase() || 'U'}</Box>
                                      <Box sx={{
                                        bgcolor: '#e3f2fd',
                                        color: '#1976d2',
                                        borderRadius: 3,
                                        px: 2.5,
                                        py: 1.5,
                                        boxShadow: '0 2px 12px #1976d222',
                                        border: '1.5px solid #90caf9',
                                        minWidth: 120,
                                        maxWidth: 340,
                                        ml: 0.5
                                      }}>
                                        <Typography sx={{ fontSize: '1.05rem', fontWeight: 500, mb: 0.5 }}>{r.content}</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.85rem', color: '#1976d2' }}>
                                          {r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  );
                                })}
                            </Box>
                          </Collapse>
                        )}
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
          </Box>
          {/* Removed MoreVert menu for main actions */}
          {/* Reply input bar */}
          {replyTo && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', bgcolor: '#e3f2fd', borderRadius: 3, boxShadow: 1, px: 2, py: 1 }}>
              <TextField
                placeholder={`Replying to ${replyTo.author?.firstName || 'user'}...`}
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                variant="standard"
                fullWidth
                InputProps={{ disableUnderline: true, sx: { fontSize: 16 } }}
                sx={{ mr: 2 }}
                onKeyDown={e => { if (e.key === 'Enter') submitReply(); }}
              />
              <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ borderRadius: '50%', minWidth: 44, minHeight: 44, boxShadow: 2, fontSize: 18 }}
                  onClick={submitReply}
                  disabled={!replyContent.trim()}
                >
                  &#9658;
                </Button>
              </motion.div>
              <Button onClick={() => setReplyTo(null)} sx={{ ml: 2, color: '#1976d2', fontWeight: 700 }}>Cancel</Button>
            </Box>
          )}
          {/* Modern input bar */}
          {!replyTo && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', bgcolor: '#fff', borderRadius: 3, boxShadow: 1, px: 2, py: 1 }}>
              <TextField
                placeholder="Type your discussion..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                variant="standard"
                fullWidth
                InputProps={{ disableUnderline: true, sx: { fontSize: 16 } }}
                sx={{ mr: 2 }}
                onKeyDown={e => { if (e.key === 'Enter') handleDiscussion(); }}
              />
              <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ borderRadius: '50%', minWidth: 44, minHeight: 44, boxShadow: 2, fontSize: 18 }}
                  onClick={handleDiscussion}
                  disabled={!comment.trim()}
                >
                  &#9658;
                </Button>
              </motion.div>
            </Box>
          )}
        </Box>
    </Container>
  );
}
