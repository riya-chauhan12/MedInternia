import { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import api from '../../utils/api';
export default function LikeCase() {
  const [caseId, setCaseId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const handleLike = async () => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await api.post(`/cases/${caseId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Case liked successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to like case');
    }
  };
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>Like Case</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField label="Case ID" value={caseId} onChange={e => setCaseId(e.target.value)} fullWidth margin="normal" required />
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleLike}>
          Like Case
        </Button>
      </Box>
    </Container>
  );
}