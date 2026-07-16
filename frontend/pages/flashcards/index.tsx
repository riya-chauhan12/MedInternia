import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container, Typography, Box, Grid, Card, CardContent, CircularProgress,
  Alert, Button, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Divider, LinearProgress, Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import api from '../../utils/api';
import PageHeader from '../../components/layout/PageHeader';

export default function FlashcardsPage() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [newCard, setNewCard] = useState({ question: '', answer: '', tags: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/auth/login'); return; }

      const [allRes, dueRes] = await Promise.all([
        api.get('/flashcards/me', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/flashcards/due', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const fetchedCards = allRes.data.data || [];
      setFlashcards(fetchedCards);
      setDueCount(dueRes.data.count || 0);
    } catch {
      setFlashcards([]);
      setDueCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/flashcards/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setFlashcards(prev => prev.filter(f => f._id !== id));
    } catch { setError('Failed to delete flashcard'); }
  };

  const handleCreate = async () => {
    if (!newCard.question.trim() || !newCard.answer.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/flashcards', {
        question: newCard.question,
        answer: newCard.answer,
        tags: newCard.tags.split(',').map(t => t.trim()).filter(Boolean)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setFlashcards(prev => [res.data.data, ...prev]);
      setAddModal(false);
      setNewCard({ question: '', answer: '', tags: '' });
    } catch { setError('Failed to create flashcard'); }
    finally { setSaving(false); }
  };

  const daysUntilReview = (nextReview: string) => {
    const diff = Math.ceil((new Date(nextReview).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Due now';
    if (diff === 1) return 'Due tomorrow';
    return `Due in ${diff} days`;
  };

  const masteryPercent = flashcards.length > 0
    ? Math.round((flashcards.filter(f => f.repetitions >= 3).length / flashcards.length) * 100)
    : 0;

  if (loading) return <Box display="flex" justifyContent="center" py={10}><CircularProgress size={48} /></Box>;

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f4ff 100%)', py: 6 }}>
      <Container maxWidth="lg">
        <PageHeader
          title="My Flashcard Deck"
          subtitle="Spaced repetition learning from your clinical cases"
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Flashcards' }]}
        />

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Stats Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ borderRadius: 4, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52 }}>
                  <SchoolIcon sx={{ color: 'white', fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" fontWeight={900}>{flashcards.length}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Cards</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ borderRadius: 4, p: 3, background: dueCount > 0 ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52 }}>
                  <QuizIcon sx={{ color: 'white', fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" fontWeight={900}>{dueCount}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Due for Review</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ borderRadius: 4, p: 3, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52 }}>
                  <Typography variant="h5" fontWeight={900} sx={{ color: 'white' }}>{masteryPercent}%</Typography>
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Mastery</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Cards with 3+ reviews</Typography>
                </Box>
              </Box>
              <LinearProgress variant="determinate" value={masteryPercent} sx={{ borderRadius: 99, bgcolor: 'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          {dueCount > 0 && (
            <Button variant="contained" color="secondary" size="large" endIcon={<ArrowForwardIcon />}
              onClick={() => router.push('/flashcards/review')}
              sx={{ borderRadius: 3, fontWeight: 700, px: 4, background: 'linear-gradient(135deg, #f5576c, #f093fb)' }}>
              Start Review ({dueCount} due)
            </Button>
          )}
          <Button variant="outlined" startIcon={<AddIcon />} size="large" onClick={() => setAddModal(true)}
            sx={{ borderRadius: 3, fontWeight: 700, px: 4 }}>
            Create Card
          </Button>
        </Box>

        {/* Cards Grid */}
        {flashcards.length === 0 ? (
          <Card sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(255,255,255,0.8)' }}>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No flashcards yet!</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Click "Create Flashcard" on any case, or create one manually below.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddModal(true)}>
              Create your first card
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {flashcards.map(card => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card._id}>
                <Card sx={{
                  borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                }}>
                  <CardContent sx={{ flex: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip
                        label={daysUntilReview(card.nextReview)}
                        size="small"
                        color={new Date(card.nextReview) <= new Date() ? 'error' : 'default'}
                        sx={{ fontWeight: 700, borderRadius: 2, fontSize: '11px' }}
                      />
                      <IconButton size="small" color="error" onClick={() => handleDelete(card._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 0.5 }}>QUESTION</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mb: 2, lineHeight: 1.4 }}>
                      {card.question.length > 80 ? card.question.slice(0, 80) + '…' : card.question}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography variant="subtitle2" color="success.main" fontWeight={700} sx={{ mb: 0.5 }}>ANSWER</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.answer.length > 60 ? card.answer.slice(0, 60) + '…' : card.answer}
                    </Typography>

                    {card.tags?.length > 0 && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {card.tags.slice(0, 3).map((tag: string) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '11px' }} />
                        ))}
                      </Box>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.disabled">
                        {card.repetitions} review{card.repetitions !== 1 ? 's' : ''} · Interval: {card.interval}d
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add Card Modal */}
        <Dialog open={addModal} onClose={() => setAddModal(false)} fullWidth maxWidth="sm">
          <DialogTitle fontWeight={700}>Create New Flashcard</DialogTitle>
          <DialogContent dividers>
            <TextField fullWidth label="Question (Front)" multiline rows={3} value={newCard.question}
              onChange={e => setNewCard(p => ({ ...p, question: e.target.value }))}
              placeholder="e.g., What is the classic triad of Cushing's syndrome?" sx={{ mb: 3 }} />
            <TextField fullWidth label="Answer (Back)" multiline rows={3} value={newCard.answer}
              onChange={e => setNewCard(p => ({ ...p, answer: e.target.value }))}
              placeholder="e.g., Hypertension, Hyperglycemia, Central obesity" sx={{ mb: 3 }} />
            <TextField fullWidth label="Tags (comma-separated)" value={newCard.tags}
              onChange={e => setNewCard(p => ({ ...p, tags: e.target.value }))}
              placeholder="e.g., Endocrinology, Adrenal, Board Prep" />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAddModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreate} disabled={saving || !newCard.question || !newCard.answer}>
              {saving ? 'Saving…' : 'Create Card'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
