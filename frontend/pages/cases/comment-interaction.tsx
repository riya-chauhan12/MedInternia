import { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import api from '../../utils/api';

export default function CommentInteraction() {
  const [caseId, setCaseId] = useState('');
  const [commentId, setCommentId] = useState('');
  const [reply, setReply] = useState('');
  const [rating, setRating] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReply = async () => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${caseId}/comments/${commentId}/reply`, { content: reply }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Reply added successfully!');
      setReply('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reply');
    }
  };

  const handleRate = async () => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${caseId}/comments/${commentId}/rate`, { rating }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Comment rated successfully!');
      setRating('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to rate comment');
    }
  };

  const handleLike = async () => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${caseId}/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Comment liked successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to like comment');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>Comment Interaction</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField label="Case ID" value={caseId} onChange={e => setCaseId(e.target.value)} fullWidth margin="normal" required />
        <TextField label="Comment ID" value={commentId} onChange={e => setCommentId(e.target.value)} fullWidth margin="normal" required />
        <TextField label="Reply" value={reply} onChange={e => setReply(e.target.value)} fullWidth margin="normal" />
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleReply}>Reply to Comment</Button>
        <TextField label="Rating" value={rating} onChange={e => setRating(e.target.value)} fullWidth margin="normal" />
        <Button variant="contained" color="secondary" sx={{ mt: 2 }} onClick={handleRate}>Rate Comment</Button>
        <Button variant="outlined" color="primary" sx={{ mt: 2 }} onClick={handleLike}>Like Comment</Button>
      </Box>
    </Container>
  );
}
