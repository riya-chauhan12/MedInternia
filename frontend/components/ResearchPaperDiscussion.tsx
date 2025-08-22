import { useEffect, useState } from 'react';
import { Box, Typography, IconButton, TextField, Button, Stack, Tooltip, Collapse } from '@mui/material';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import { MessageCircleReply } from 'lucide-react';
// Update the import path below if your api utility is located elsewhere, e.g. '../utils/api' or './api'
import api from '../utils/api';

export default function ResearchPaperDiscussion({ id, modalMode }: { id: string, modalMode?: boolean }) {
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [replyContent, setReplyContent] = useState('');
  const [openReplies, setOpenReplies] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('token');
    api.get(`/research-papers/${id}`)
      .then(res => {
        setDiscussions(res.data.data.paper.comments || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch discussions');
        setLoading(false);
      });
  }, [id]);

  const handleLike = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/research-papers/${id}/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await api.get(`/research-papers/${id}`);
      setDiscussions(res.data.data.paper.comments || []);
    } catch {
      setError('Failed to like discussion');
    }
  };

  const handleDiscussion = async () => {
    try {
      const token = localStorage.getItem('token');
      if (replyTo) {
        await api.post(`/research-papers/${id}/comments/${replyTo._id}/reply`, { content: replyContent }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post(`/research-papers/${id}/comments`, { content: comment }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setComment('');
      setReplyTo(null);
      setReplyContent('');
      const res = await api.get(`/research-papers/${id}`);
      setDiscussions(res.data.data.paper.comments || []);
    } catch {
      setError('Failed to add discussion');
    }
  };

  function handleReply(comment: any) {
    setReplyTo(comment);
    setReplyContent('');
  }

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 700 }}>Discussions</Typography>
      <Box sx={{ maxHeight: 400, overflowY: 'auto', px: 1 }}>
        {discussions.length === 0 && (
          <Typography variant="body2" sx={{ color: '#888', textAlign: 'center', py: 4 }}>
            No discussions yet. Be the first to discuss!
          </Typography>
        )}
        {discussions.filter((c) => !c.replyTo).map((c, idx) => {
          const isMe = c.author?.id === userId;
          const authorName = c.author?.firstName || 'Unknown';
          const initial = authorName[0]?.toUpperCase() || 'U';
          return (
            <Box key={c._id || idx} sx={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', mb: 2 }}>
              <Box sx={{ background: isMe ? 'linear-gradient(135deg, #1976d2 60%, #64b5f6 100%)' : 'linear-gradient(135deg, #90caf9 60%, #e3f2fd 100%)', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, boxShadow: 1, mr: isMe ? 0 : 2, ml: isMe ? 2 : 0 }}>{initial}</Box>
              <Box sx={{ bgcolor: isMe ? '#1976d2' : '#fff', color: isMe ? '#fff' : '#222', borderRadius: 3, px: 2.5, py: 2, minWidth: 180, maxWidth: 420, boxShadow: '0 2px 12px #1976d222', position: 'relative' }}>
                <Typography sx={{ wordBreak: 'break-word', fontSize: '1.15rem', fontWeight: 500 }}>{c.content}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{authorName}</Typography>
                  <Typography variant="caption" sx={{ ml: 1, color: '#90caf9' }}>{c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Typography>
                  <IconButton size="small" sx={{ ml: 1, p: 0.5, color: '#1976d2', '&:hover': { bgcolor: '#e3f2fd' }, borderRadius: 2 }} onClick={() => handleReply(c)}>
                    <MessageCircleReply size={20} strokeWidth={2.2} />
                  </IconButton>
                  <IconButton size="small" sx={{ ml: 1, p: 0.5 }} onClick={() => handleLike(c._id)}>
                    <ThumbUpAltOutlinedIcon sx={{ fontSize: 18, color: c.likedBy?.includes(userId) ? '#1976d2' : '#2193b0' }} />
                  </IconButton>
                  {c.replies && c.replies.length > 0 && (
                    <Button size="small" sx={{ ml: 1, fontSize: 12, color: '#1976d2', textTransform: 'none' }} onClick={() => setOpenReplies(prev => ({ ...prev, [c._id]: !prev[c._id] }))}>
                      {openReplies[c._id] ? 'Hide Replies' : `Show Replies (${c.replies.length})`}
                    </Button>
                  )}
                </Box>
                {c.replies && c.replies.length > 0 && (
                  <Collapse in={!!openReplies[c._id]}>
                    <Box sx={{ mt: 1, ml: 4, pl: 2, borderLeft: '2px solid #90caf9', bgcolor: '#f5fafd', borderRadius: 2 }}>
                      {discussions.filter((r: any) => r.replyTo === c._id).map((r: any, ridx: number) => {
                        const parentContent = (() => {
                          if (!r.replyTo) return '';
                          const allComments = [...discussions];
                          const parent = allComments.find((cm: any) => cm._id === r.replyTo);
                          return parent?.content || '';
                        })();
                        return (
                          <Box key={r._id || ridx} sx={{ mb: 2, display: 'flex', alignItems: 'flex-end' }}>
                            <Box sx={{ background: 'linear-gradient(135deg, #1976d2 60%, #64b5f6 100%)', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, mr: 1.5, boxShadow: '0 2px 8px #1976d222' }}>{r.author?.firstName?.[0]?.toUpperCase() || 'U'}</Box>
                            <Box sx={{ bgcolor: '#e3f2fd', color: '#1976d2', borderRadius: 3, px: 2.5, py: 1.5, boxShadow: '0 2px 12px #1976d222', border: '1.5px solid #90caf9', minWidth: 120, maxWidth: 340, ml: 0.5 }}>
                              <Typography sx={{ fontSize: '1.05rem', fontWeight: 500, mb: 0.5 }}>{r.content}</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.85rem', color: '#1976d2' }}>{r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Collapse>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ mt: 2 }}>
        {replyTo ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder={`Reply to ${replyTo.author?.firstName || 'user'}...`}
              size="small"
              fullWidth
              sx={{ bgcolor: '#f8fafd', borderRadius: 2 }}
            />
            <Button variant="contained" onClick={handleDiscussion} sx={{ borderRadius: 2, fontWeight: 700 }}>Send</Button>
            <Button variant="text" onClick={() => setReplyTo(null)} sx={{ color: '#888' }}>Cancel</Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Type your discussion..."
              size="small"
              fullWidth
              sx={{ bgcolor: '#f8fafd', borderRadius: 2 }}
            />
            <Button variant="contained" onClick={handleDiscussion} sx={{ borderRadius: 2, fontWeight: 700 }}>Send</Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
