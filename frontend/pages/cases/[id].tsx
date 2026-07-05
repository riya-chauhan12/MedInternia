import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, CircularProgress, Alert, Button, TextField, IconButton, Stack, Collapse, Tooltip, Tabs, Tab, Card, CardContent, Divider, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { MessageCircleReply, Pin, Stethoscope, Activity, Award, CheckCircle2 } from 'lucide-react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import PdfExportButton from '../../components/PdfExportButton';
import ClinicalTimeline from '../../components/ClinicalTimeline';

export default function CaseDiscussion({ id: propId, modalMode, hideDescription }: { id?: string, modalMode?: boolean, hideDescription?: boolean }) {
  const router = useRouter();
  const id = propId || router.query.id;
  const [caseData, setCaseData] = useState<any>(null);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [pinned, setPinned] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
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
  setDiscussions(all); // Show all comments in discussions, including pinned
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

  // Clinical Sandbox State
  const [sandboxAttempt, setSandboxAttempt] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState('');
  const [testType, setTestType] = useState('ECG');
  const [proposedDiagnosis, setProposedDiagnosis] = useState('');

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

    // Start / Load Clinical Sandbox Session
    api.post(`/cases/${id}/sandbox/start`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setSandboxAttempt(res.data.data.attempt);
      })
      .catch(err => {
        console.warn('Failed to load sandbox:', err);
      });
  }, [id]);

  const handleOrderTest = async () => {
    if (!testType) return;
    setSandboxLoading(true);
    setSandboxError('');
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/cases/${id}/sandbox/order-test`, { testType }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSandboxAttempt(res.data.data.attempt);
      setSandboxLoading(false);
    } catch (err: any) {
      setSandboxError(err.response?.data?.message || 'Failed to order test');
      setSandboxLoading(false);
    }
  };

  const handleSubmitDiagnosis = async () => {
    if (!proposedDiagnosis.trim()) return;
    setSandboxLoading(true);
    setSandboxError('');
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/cases/${id}/sandbox/submit`, { proposedDiagnosis }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSandboxAttempt(res.data.data.attempt);
      // Re-fetch the case to get revealed diagnosis & treatment!
      const caseRes = await api.get(`/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCaseData(caseRes.data.data.case);
      setSandboxLoading(false);
    } catch (err: any) {
      setSandboxError(err.response?.data?.message || 'Failed to submit diagnosis');
      setSandboxLoading(false);
    }
  };

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

  const handleUnpin = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${id}/comments/${commentId}/unpin`, {}, {
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
      setError('Failed to unpin discussion');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!caseData) return null;

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const isAuthor = userId && caseData?.author?.id === userId;

  // Merge pinned and regular discussions for PDF export
  const allDiscussions = [...pinned, ...discussions];

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        {!hideDescription && <>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h4" gutterBottom sx={{ flex: 1 }}>{caseData.title}</Typography>
            <PdfExportButton caseData={caseData} discussions={allDiscussions} />
          </Box>
          <Typography variant="body1">{caseData.description}</Typography>
        </>}

        <Tabs 
          value={activeTab} 
          onChange={(e, val) => setActiveTab(val)} 
          centered 
          sx={{ my: 3, borderBottom: '1px solid #e2e8f0' }}
        >
          <Tab label="Clinical Timeline" sx={{ fontWeight: 600 }} />
          <Tab label={`Discussions (${allDiscussions.length})`} sx={{ fontWeight: 600 }} />
          <Tab label="Clinical Sandbox" sx={{ fontWeight: 600 }} />
        </Tabs>

        {activeTab === 0 && (
          <ClinicalTimeline caseData={caseData} discussions={allDiscussions} />
        )}

        {activeTab === 1 && (
          <>
          {pinned.length > 0 && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#fffbe6', borderRadius: 3, boxShadow: '0 2px 12px #ffd70022', border: '1.5px solid #ffe066' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#FFD700', fontWeight: 700 }}>Keypoints</Typography>
              {pinned
                .filter((c) => !c.replyTo)
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
                      <Box sx={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', mb: 2 }}>
                        <Box sx={{ background: isMe ? 'linear-gradient(135deg, #FFD700 60%, #ffe066 100%)' : 'linear-gradient(135deg, #ffe066 60%, #fffbe6 100%)', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, boxShadow: 1, mr: isMe ? 0 : 2, ml: isMe ? 2 : 0 }}>{initial}</Box>
                        <Box sx={{ bgcolor: '#fffbe6', color: '#222', borderRadius: 3, px: 2.5, py: 2, minWidth: 180, maxWidth: 420, boxShadow: '0 2px 12px #ffd70022', position: 'relative', border: '1.5px solid #ffe066' }}>
                          <Typography sx={{ wordBreak: 'break-word', fontSize: '1.15rem', fontWeight: 500 }}>{c.content}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{authorName}</Typography>
                            <Typography variant="caption" sx={{ ml: 1, color: '#FFD700' }}>{c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Typography>
                            {/* Reply icon (lucide, always visible) */}
                            <IconButton size="small" sx={{ ml: 1, p: 0.5, color: '#FFD700', '&:hover': { bgcolor: '#ffe066' }, borderRadius: 2 }} onClick={() => handleReply(c)}>
                              <MessageCircleReply size={20} strokeWidth={2.2} />
                            </IconButton>
                            {/* Unpin icon/button for pinned comments */}
                            <Tooltip title="Unpin">
                              <IconButton
                                size="small"
                                sx={{ ml: 1, p: 0.5, color: '#FFD700', borderRadius: 2, '&:hover': { bgcolor: '#ffe066', color: '#222' }, boxShadow: '0 2px 8px #ffd70088' }}
                                onClick={() => handleUnpin(c._id)}
                              >
                                <PushPinIcon sx={{ fontSize: 22 }} />
                              </IconButton>
                            </Tooltip>
                            {/* Like button with active state */}
                            <IconButton size="small" sx={{ ml: 1, p: 0.5 }} onClick={() => handleLike(c._id)}>
                              <ThumbUpAltOutlinedIcon sx={{ fontSize: 18, color: c.likedBy?.includes(userId) ? '#FFD700' : '#2193b0' }} />
                            </IconButton>
                          </Box> {/* end inner Box (actions) */}
                        </Box>
                      </Box> {/* end Box (content + avatar) */}
                    </motion.div>
                  );
                })}
            </Box>
          )}
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
                          {/* Pin button visible to all users */}
                          <Tooltip title={c.pinned ? 'Unpin' : 'Pin'}>
                            <IconButton
                              size="small"
                              sx={{ ml: 1, p: 0.5, color: c.pinned ? '#FFD700' : '#2193b0', borderRadius: 2, '&:hover': { bgcolor: '#e3f2fd', color: '#1976d2' }, boxShadow: c.pinned ? '0 2px 8px #ffd70088' : 'none' }}
                              onClick={() => handlePin(c._id)}
                            >
                              <PushPinIcon sx={{ fontSize: 22 }} />
                            </IconButton>
                          </Tooltip>
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
          </>
        )}

        {activeTab === 2 && (
          <Box sx={{ mt: 2 }}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
              color: '#fff', 
              borderRadius: 4, 
              boxShadow: '0 8px 32px rgba(30, 60, 114, 0.2)',
              mb: 3
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
                  <Stethoscope size={28} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>Clinical Reasoning Sandbox</Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Train your diagnostic skills. Analyze patient presentation, order virtual tests, and propose a diagnosis to compare against the expert decision.
                </Typography>
              </CardContent>
            </Card>

            {/* Patient Presentation Overview */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3c72', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Activity size={20} /> Patient Presentation
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>AGE</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#334155' }}>
                      {caseData.patientInfo?.age ? `${caseData.patientInfo.age} years` : 'Not specified'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>GENDER</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#334155', textTransform: 'capitalize' }}>
                      {caseData.patientInfo?.gender || 'Not specified'}
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>CHIEF COMPLAINT & SYMPTOMS</Typography>
                <Typography variant="body1" sx={{ color: '#334155', mb: 2 }}>
                  {caseData.symptoms && caseData.symptoms.length > 0 
                    ? caseData.symptoms.join(', ') 
                    : 'No symptoms listed'}
                </Typography>
              </CardContent>
            </Card>

            {sandboxError && <Alert severity="error" sx={{ mb: 3 }}>{sandboxError}</Alert>}

            {/* Sandbox State */}
            {sandboxAttempt && !sandboxAttempt.isCompleted ? (
              <>
                {/* Ordered Tests Section */}
                <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3c72', mb: 2 }}>
                      1. Order Virtual Diagnostic Tests
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                      Choose tests carefully to maintain high diagnostic efficiency. Each test ordered deducts points from the efficiency bonus.
                    </Typography>
                    
                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="test-type-label">Select Test</InputLabel>
                        <Select
                          labelId="test-type-label"
                          value={testType}
                          label="Select Test"
                          onChange={(e) => setTestType(e.target.value)}
                        >
                          <MenuItem value="ECG">ECG / Electrocardiogram</MenuItem>
                          <MenuItem value="Blood Work">Blood Work / Labs</MenuItem>
                          <MenuItem value="X-Ray">Chest X-Ray</MenuItem>
                          <MenuItem value="CT Scan">CT Scan</MenuItem>
                          <MenuItem value="MRI">MRI</MenuItem>
                          <MenuItem value="Urinalysis">Urinalysis</MenuItem>
                        </Select>
                      </FormControl>
                      <Button 
                        variant="contained" 
                        onClick={handleOrderTest} 
                        disabled={sandboxLoading}
                        sx={{ 
                          bgcolor: '#1e3c72', 
                          '&:hover': { bgcolor: '#2a5298' }, 
                          whiteSpace: 'nowrap',
                          borderRadius: 2,
                          px: 3
                        }}
                      >
                        {sandboxLoading ? <CircularProgress size={20} color="inherit" /> : 'Order Test'}
                      </Button>
                    </Stack>

                    {/* Display ordered tests list */}
                    {sandboxAttempt.orderedTests && sandboxAttempt.orderedTests.length > 0 ? (
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                          Diagnostic Results Log ({sandboxAttempt.orderedTests.length})
                        </Typography>
                        {sandboxAttempt.orderedTests.map((test: any, idx: number) => (
                          <Box key={idx} sx={{ 
                            p: 2, 
                            bgcolor: '#f8fafc', 
                            borderRadius: 2.5, 
                            borderLeft: '4px solid #3b82f6',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {test.testType}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {test.orderedAt ? new Date(test.orderedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.875rem', mt: 1 }}>
                              {test.result}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px dashed #cbd5e1' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          No tests ordered yet. Select a test from the menu above.
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Submit Diagnosis Section */}
                <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3c72', mb: 2 }}>
                      2. Submit Proposed Diagnosis
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                      Once you have reviewed the presentation and test findings, type your diagnosis below. We will evaluate its semantic match against the expert diagnosis.
                    </Typography>

                    <TextField
                      fullWidth
                      label="Proposed Diagnosis"
                      placeholder="e.g. Acute Inferior Wall Myocardial Infarction (STEMI)"
                      value={proposedDiagnosis}
                      onChange={(e) => setProposedDiagnosis(e.target.value)}
                      sx={{ mb: 3, mt: 1 }}
                      size="medium"
                    />

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSubmitDiagnosis}
                      disabled={sandboxLoading || !proposedDiagnosis.trim()}
                      sx={{ 
                        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
                        py: 1.5,
                        borderRadius: 2.5,
                        fontWeight: 700,
                        fontSize: '1rem',
                        boxShadow: '0 4px 12px rgba(30, 60, 114, 0.2)'
                      }}
                    >
                      {sandboxLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit Diagnosis'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : sandboxAttempt && sandboxAttempt.isCompleted ? (
              <Box>
                {/* Results Dashboard Card */}
                <Card sx={{ 
                  borderRadius: 4, 
                  border: '1.5px solid #22c55e', 
                  mb: 3, 
                  boxShadow: '0 4px 20px rgba(34, 197, 94, 0.08)',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ bgcolor: '#f0fdf4', p: 3, borderBottom: '1px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckCircle2 size={28} color="#22c55e" />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#166534' }}>Sandbox Completed!</Typography>
                        <Typography variant="caption" sx={{ color: '#15803d' }}>Diagnosis evaluated successfully</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600, display: 'block' }}>TOTAL SCORE</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#166534' }}>
                        +{sandboxAttempt.pointsAwarded || 0} pts
                      </Typography>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, textAlign: 'center' }}>
                          <Award size={24} color="#3b82f6" style={{ margin: '0 auto 8px' }} />
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>SIMILARITY MATCH</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mt: 0.5 }}>
                            {sandboxAttempt.similarityScore ? `${(sandboxAttempt.similarityScore * 100).toFixed(1)}%` : '0%'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, textAlign: 'center' }}>
                          <Activity size={24} color="#ef4444" style={{ display: 'block', margin: '0 auto 8px' }} />
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>TESTS ORDERED</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mt: 0.5 }}>
                            {sandboxAttempt.orderedTests?.length || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, textAlign: 'center' }}>
                          <Award size={24} color="#eab308" style={{ margin: '0 auto 8px' }} />
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>EFFICIENCY BONUS</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mt: 0.5 }}>
                            +{Math.max(0, 10 - 2 * (sandboxAttempt.orderedTests?.length || 0))} pts
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2.5 }} />

                    {/* Comparison */}
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>YOUR PROPOSED DIAGNOSIS</Typography>
                        <Box sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 2, mt: 0.5, borderLeft: '3px solid #64748b' }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#334155' }}>
                            {sandboxAttempt.proposedDiagnosis}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>EXPERT DIAGNOSIS</Typography>
                        <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, mt: 0.5, borderLeft: '3px solid #22c55e' }}>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#166534' }}>
                            {caseData.diagnosis || "No diagnosis details revealed."}
                          </Typography>
                        </Box>
                      </Box>

                      {caseData.treatment && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#1e3c72', fontWeight: 700 }}>RECOMMENDED TREATMENT PLAN</Typography>
                          <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, mt: 0.5, borderLeft: '3px solid #1e3c72' }}>
                            <Typography variant="body2" sx={{ color: '#334155' }}>
                              {caseData.treatment}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Ordered Tests Log History */}
                {sandboxAttempt.orderedTests && sandboxAttempt.orderedTests.length > 0 && (
                  <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 2 }}>
                        Diagnostic Log History
                      </Typography>
                      <Stack spacing={2}>
                        {sandboxAttempt.orderedTests.map((test: any, idx: number) => (
                          <Box key={idx} sx={{ 
                            p: 2, 
                            bgcolor: '#f8fafc', 
                            borderRadius: 2.5, 
                            borderLeft: '4px solid #cbd5e1'
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mb: 0.5 }}>
                              {test.testType}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {test.result}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Box>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}
