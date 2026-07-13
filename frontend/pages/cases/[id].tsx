import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  TextField,
  IconButton,
  Stack,
  Collapse,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Avatar,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { MessageCircleReply, Pin, CheckCircle2, Sparkles } from 'lucide-react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import PdfExportButton from '../../components/PdfExportButton';
import ClinicalTimeline from '../../components/ClinicalTimeline';

export default function CaseDiscussion({ id: propId, modalMode, hideDescription }: { id?: string, modalMode?: boolean, hideDescription?: boolean }) {
  const router = useRouter();
  const id = propId || router.query.id;
  const [caseData, setCaseData] = useState<any>(null);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [pinned, setPinned] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [solving, setSolving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<any>(null);

  const [replyTo, setReplyTo] = useState<any>(null);
  const [replyContent, setReplyContent] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [openReplies, setOpenReplies] = useState<{[key: string]: boolean}>({});

  // NEW: case-level like state
  const [isLiked, setIsLiked] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [liking, setLiking] = useState(false);

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const canModerate = currentUser && ['admin', 'doctor', 'moderator'].includes(currentUser.userType);

  // Fetch Case Data & Profile details
  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('token');
    
    // Fetch profile to check solved list
    if (token) {
      api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const user = res.data.data.user;
        setCurrentUser(user);
        if (user.solvedCases) {
          setIsSolved(user.solvedCases.some((scId: string) => scId.toString() === id.toString()));
        }
      })
      .catch(err => console.warn('Failed to fetch profile', err));
    }

    api.get(`/cases/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setCaseData(res.data.data.case);
        const all = res.data.data.case.comments || [];
        setPinned(all.filter((c: any) => c.pinned));
        setDiscussions(all.filter((c: any) => !c.pinned));
        // NEW: initialize case-level like state
        const likes = res.data.data.case.likes || [];
        setTotalLikes(likes.length);
        setIsLiked(userId ? likes.some((likeId: any) => likeId.toString() === userId) : false);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch case');
        setLoading(false);
      });
  }, [id]);

  // NEW: toggle case-level like
  const handleToggleCaseLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/cases/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLiked(res.data.data.isLiked);
      setTotalLikes(res.data.data.totalLikes);
    } catch {
      setError('Failed to like case');
    } finally {
      setLiking(false);
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${id}/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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

  const handleDiscussion = async () => {
    try {
      const token = localStorage.getItem('token');
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

  const handleReply = (comment: any) => {
    setReplyTo(comment);
    setReplyContent('');
  };

  const submitReply = async () => {
    if (!replyContent.trim()) return;
    await handleDiscussion();
  };

  const handlePin = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${id}/comments/${commentId}/pin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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

  const handleUnpin = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${id}/comments/${commentId}/unpin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const res = await api.get(`/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const all = res.data.data.case.comments || [];
      setPinned(all.filter((c: any) => c.pinned));
      setDiscussions(all.filter((c: any) => !c.pinned));
    } catch {
      setError('Failed to unpin discussion');
    }
  };

  const handleSolveCase = async () => {
    setSolving(true);
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${id}/solve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSolved(true);
      setSolving(false);
      setSuccess('Case marked as solved successfully! You earned +5 points.');
      setError('');
    } catch (err) {
      setSolving(false);
      setError('Failed to mark case as solved');
      setSuccess('');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Container maxWidth="md" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
  if (!caseData) return null;

  const caseAuthorName = caseData.doctor
    ? `${caseData.doctor.firstName || ''} ${caseData.doctor.lastName || ''}`.trim()
    : 'Unknown Clinician';
  const caseAuthorAvatar = caseData.doctor?.profilePicture || undefined;

  // Merge pinned and regular discussions for PDF export
  const allDiscussions = [...pinned, ...discussions];

  // Comments / Peer reviews sub-panel JSX
  const discussionPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2, color: 'text.primary' }}>
        Peer Discussions
      </Typography>

      {/* Pinned keypoints */}
      {pinned.length > 0 && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#fffbe6', borderRadius: 3, border: '1.5px solid #ffe066' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#b7860b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Pin size={16} /> Key Pinned Insights
          </Typography>
          {pinned.map((c, idx) => {
            const authorName = c.author ? `${c.author.firstName || ''} ${c.author.lastName || ''}`.trim() : 'Unknown';
            return (
              <Box key={c._id || idx} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  "{c.content}"
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    — {authorName} ({c.author?.userType})
                  </Typography>
                  {canModerate && (
                    <Button size="small" onClick={() => handleUnpin(c._id)} sx={{ p: 0, minWidth: 0, fontSize: 11, color: 'error.main' }}>
                      Unpin
                    </Button>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Main comments feed */}
      <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: '500px', pr: 1, mb: 2 }}>
        {discussions.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>
            No peer reviews yet. Share your diagnosis and feedback!
          </Typography>
        ) : (
          discussions
            .filter((c) => !c.replyTo)
            .map((c, idx) => {
              const isMe = c.author?._id === userId;
              const authorName = c.author ? `${c.author.firstName || ''} ${c.author.lastName || ''}`.trim() : 'Unknown';
              const initial = authorName[0]?.toUpperCase() || 'U';

              return (
                <Box key={c._id || idx} sx={{ mb: 3 }}>
                  <Stack direction={isMe ? 'row-reverse' : 'row'} gap={1.5} alignItems="flex-start">
                    <Avatar sx={{ bgcolor: isMe ? 'primary.main' : 'secondary.main', width: 36, height: 36, fontWeight: 700 }}>
                      {initial}
                    </Avatar>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: isMe ? 'primary.light' : '#f1f5f9',
                        color: 'text.primary',
                        maxWidth: '85%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} sx={{ color: 'primary.dark', mb: 0.5 }}>
                        {authorName} <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.8 }}>({c.author?.userType})</span>
                      </Typography>
                      <Typography variant="body1" fontSize={15} sx={{ whiteSpace: 'pre-line' }}>
                        {c.content}
                      </Typography>

                      <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 1 }}>
                        <Typography fontSize={11} color="text.disabled">
                          {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Typography>

                        <Tooltip title="Like comment">
                          <IconButton size="small" onClick={() => handleLike(c._id)} sx={{ p: 0.5 }}>
                            <ThumbUpAltOutlinedIcon sx={{ fontSize: 16, color: c.likes?.includes(userId) ? 'primary.main' : 'text.disabled' }} />
                          </IconButton>
                        </Tooltip>

                        {canModerate && (
                          <Tooltip title="Pin insight">
                            <IconButton size="small" onClick={() => handlePin(c._id)} sx={{ p: 0.5, color: 'text.disabled' }}>
                              <Pin size={16} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Button size="small" onClick={() => handleReply(c)} sx={{ fontSize: 11, minWidth: 0, p: 0 }}>
                          Reply
                        </Button>

                        {c.replies && c.replies.length > 0 && (
                          <Button size="small" sx={{ fontSize: 11, minWidth: 0, p: 0 }} onClick={() => setOpenReplies(prev => ({ ...prev, [c._id]: !prev[c._id] }))}>
                            {openReplies[c._id] ? 'Hide Replies' : `Replies (${c.replies.length})`}
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Stack>

                  {/* Replies nesting */}
                  {c.replies && c.replies.length > 0 && openReplies[c._id] && (
                    <Box sx={{ mt: 1, ml: 6, pl: 2, borderLeft: '2px solid #cbd5e1' }}>
                      {discussions
                        .filter((r: any) => r.replyTo === c._id)
                        .map((r: any, rIdx: number) => {
                          const replyAuthorName = r.author ? `${r.author.firstName || ''} ${r.author.lastName || ''}`.trim() : 'Unknown';
                          return (
                            <Box key={r._id || rIdx} sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: 'divider', fontSize: 13, fontWeight: 700 }}>
                                {replyAuthorName[0]?.toUpperCase()}
                              </Avatar>
                              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 3, width: '100%' }}>
                                <Typography variant="body2" fontWeight={600} color="text.primary">
                                  {replyAuthorName} <span style={{ fontSize: '10px', opacity: 0.7 }}>({r.author?.userType})</span>
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>{r.content}</Typography>
                              </Box>
                            </Box>
                          );
                        })}
                    </Box>
                  )}
                </Box>
              );
            })
        )}
      </Box>

      {/* Input controls */}
      {replyTo ? (
        <Box sx={{ p: 2, bgcolor: '#e0f2fe', borderRadius: 3, border: '1px solid #bae6fd' }}>
          <Typography variant="caption" color="primary.dark" fontWeight={700}>
            Replying to {replyTo.author?.firstName || 'user'}
          </Typography>
          <TextField
            placeholder="Type your reply..."
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 1, bgcolor: 'white', borderRadius: 2 }}
          />
          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1.5 }}>
            <Button size="small" variant="text" onClick={() => setReplyTo(null)}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={submitReply} disabled={!replyContent.trim()}>
              Send Reply
            </Button>
          </Stack>
        </Box>
      ) : (
        <Stack direction="row" gap={1} alignItems="flex-end" sx={{ mt: 'auto', pt: 1 }}>
          <TextField
            placeholder="Write comments, peer advice, or ask questions..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            fullWidth
            multiline
            maxRows={4}
            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f8fbff' } }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleDiscussion}
            disabled={!comment.trim()}
            sx={{ height: 48, borderRadius: '12px', px: 3 }}
          >
            Post
          </Button>
        </Stack>
      )}
    </Box>
  );

  // If in Modal Mode, just display discussions
  if (modalMode) {
    return discussionPanel;
  }

  // Full detail page layout
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        component={Link}
        href="/cases"
        sx={{ mb: 3, color: 'text.secondary', fontWeight: 600, '&:hover': { color: 'primary.main' } }}
      >
        Back to Cases
      </Button>

      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Left Column: Case details or Timeline (depending on active tab) */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h3" fontWeight={900} color="text.primary" sx={{ flex: 1, letterSpacing: -0.5, mb: 0 }}>
                {caseData.title}
              </Typography>
              <PdfExportButton caseData={caseData} discussions={allDiscussions} />
            </Box>

            {/* AI Prominent Badges */}
            <Stack direction="row" gap={1.5} flexWrap="wrap" sx={{ mb: 3, mt: 1 }}>
              {caseData.specialization && (
                <Chip
                  label={`🩺 specialty: ${caseData.specialization}`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, borderRadius: '8px', fontSize: '13px', px: 0.5 }}
                />
              )}
              {caseData.difficulty && (
                <Chip
                  label={`⚡ Difficulty: ${caseData.difficulty}`}
                  sx={{
                    fontWeight: 700,
                    borderRadius: '8px',
                    fontSize: '13px',
                    px: 0.5,
                    textTransform: 'capitalize',
                    ...(() => {
                      switch (caseData.difficulty.toLowerCase()) {
                        case 'beginner':
                          return { bgcolor: '#e6fffa', color: '#00a389', border: '1px solid #b2f5ea' };
                        case 'advanced':
                        case 'complex':
                          return { bgcolor: '#fff5f5', color: '#e53e3e', border: '1px solid #feb2b2' };
                        default:
                          return { bgcolor: '#fffaf0', color: '#dd6b20', border: '1px solid #fbd38d' };
                      }
                    })()
                  }}
                />
              )}
              {isSolved && (
                <Chip
                  icon={<CheckCircle2 size={16} />}
                  label="Solved"
                  color="success"
                  sx={{ fontWeight: 700, borderRadius: '8px', fontSize: '13px', px: 0.5 }}
                />
              )}
              {caseData.tags && caseData.tags.map((tag: string) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  sx={{ fontWeight: 700, borderRadius: '8px', fontSize: '13px', px: 0.5, bgcolor: '#f1f5f9', color: '#475569' }}
                />
              ))}
            </Stack>

            {/* Author and Date Meta Row */}
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
              <Avatar src={caseAuthorAvatar} sx={{ width: 44, height: 44, bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 700 }}>
                {caseAuthorName[0]}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight={700} color="text.primary">
                  {caseAuthorName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Published {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </Typography>
              </Box>

              {/* NEW: Case-level Like button */}
              <Tooltip title={isLiked ? 'Unlike this case' : 'Like this case'}>
                <IconButton
                  onClick={handleToggleCaseLike}
                  disabled={liking}
                  sx={{ color: isLiked ? 'primary.main' : 'text.disabled' }}
                >
                  <ThumbUpAltOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mr: userId && !isSolved ? 0 : 'auto' }}>
                {totalLikes}
              </Typography>

              {/* Mark as Solved Button */}
              {userId && !isSolved && (
                <Button
                  variant="contained"
                  color="success"
                  disabled={solving}
                  startIcon={solving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={18} />}
                  onClick={handleSolveCase}
                  sx={{
                    ml: 'auto',
                    borderRadius: '10px',
                    fontWeight: 700,
                    bgcolor: '#10b981',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                    '&:hover': {
                      bgcolor: '#059669',
                      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)',
                    }
                  }}
                >
                  Mark as Solved
                </Button>
              )}
            </Stack>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{ mb: 3, borderBottom: '1px solid #e2e8f0' }}
          >
            <Tab label="Case Details" sx={{ fontWeight: 600 }} />
            <Tab label="Clinical Timeline" sx={{ fontWeight: 600 }} />
          </Tabs>

          {activeTab === 0 && (
            <>
              <Divider sx={{ mb: 4 }} />

              {/* Patient Info Card */}
              {caseData.patientInfo && (caseData.patientInfo.age || caseData.patientInfo.gender || (caseData.patientInfo.medicalHistory && caseData.patientInfo.medicalHistory.length > 0) || (caseData.patientInfo.currentMedications && caseData.patientInfo.currentMedications.length > 0)) && (
                <Card sx={{ p: 2.5, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fafcff' }}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📋 Patient Information
                  </Typography>
                  <Grid container spacing={2}>
                    {caseData.patientInfo.age && (
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Age</Typography>
                        <Typography variant="body2" fontWeight={600} color="text.primary">{caseData.patientInfo.age} years</Typography>
                      </Grid>
                    )}
                    {caseData.patientInfo.gender && (
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Gender</Typography>
                        <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ textTransform: 'capitalize' }}>{caseData.patientInfo.gender}</Typography>
                      </Grid>
                    )}
                    {caseData.patientInfo.medicalHistory && caseData.patientInfo.medicalHistory.length > 0 && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Medical History</Typography>
                        <Typography variant="body2" fontWeight={600} color="text.primary">{caseData.patientInfo.medicalHistory.join(', ')}</Typography>
                      </Grid>
                    )}
                    {caseData.patientInfo.currentMedications && caseData.patientInfo.currentMedications.length > 0 && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Current Medications</Typography>
                        <Typography variant="body2" fontWeight={600} color="text.primary">{caseData.patientInfo.currentMedications.join(', ')}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Card>
              )}

              {/* Description */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2, color: 'primary.dark' }}>
                  Clinical History & Details
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', fontSize: '1.05rem', lineHeight: 1.7 }}>
                  {caseData.description}
                </Typography>
              </Box>

              {/* Supporting materials */}
              {caseData.images && caseData.images.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 2, color: 'primary.dark' }}>
                    Supporting Medical Media (Images)
                  </Typography>
                  <Grid container spacing={2}>
                    {caseData.images.map((img: string, idx: number) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.01)', overflow: 'hidden' }}>
                          <CardMedia
                            component="img"
                            image={img}
                            alt={`Clinical supporting photo ${idx + 1}`}
                            sx={{ height: 260, objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
                            onClick={() => window.open(img, '_blank')}
                          />
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* AI Clinical Insights card */}
              <Card
                sx={{
                  borderRadius: 4,
                  border: '1.5px solid rgba(0, 114, 255, 0.15)',
                  background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
                  boxShadow: '0 4px 20px rgba(0, 114, 255, 0.05)',
                  mb: 4,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" gap={1.2} sx={{ mb: 2 }}>
                    <Box sx={{ bgcolor: 'primary.light', p: 0.8, borderRadius: '8px', color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                      <Sparkles size={20} />
                    </Box>
                    <Typography variant="h6" fontWeight={800} color="primary.dark">
                      AI Clinical Insights
                    </Typography>
                  </Stack>

                  {caseData.symptoms && caseData.symptoms.length > 0 && (
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                        Extracted symptoms:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {caseData.symptoms.map((s: string) => (
                          <Chip key={s} label={s} size="small" sx={{ bgcolor: '#ebf4ff', color: 'primary.dark', fontWeight: 600 }} />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {caseData.diagnosis && (
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                        Likely Diagnosis:
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary" sx={{ mt: 0.5, bgcolor: '#f1f5f9', p: 1.5, borderRadius: 2 }}>
                        💡 {caseData.diagnosis}
                      </Typography>
                    </Box>
                  )}

                  {caseData.treatment && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                        Recommended Treatment / Management:
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ mt: 0.7, whiteSpace: 'pre-line', bgcolor: '#fdfdfd', border: '1px solid #e2e8f0', p: 2, borderRadius: 2 }}>
                        {caseData.treatment}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 1 && (
            <ClinicalTimeline caseData={caseData} discussions={allDiscussions} />
          )}

          {/* Pinned insight placeholder container */}
          <Box sx={{ mb: 1 }} />
        </Grid>

        {/* Right Column: Peer review discussion comments */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Card
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 4,
              height: '100%',
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              position: 'sticky',
              top: '84px', // account for navbar
            }}
          >
            {discussionPanel}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}