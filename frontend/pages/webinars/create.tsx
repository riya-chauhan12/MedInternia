import { useState } from 'react';
import { Box, Typography, Card, TextField, Button, Alert } from '@mui/material';
import api from '../../utils/api';
import { useRouter } from 'next/router';

export default function CreateWebinar() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'webinar',
    specialization: 'general',
    scheduledAt: '',
    duration: 30
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      // Backend expects specialization as array and scheduledAt as ISO string
      const payload = {
        ...form,
        specialization: [form.specialization],
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        duration: Number(form.duration)
      };
      await api.post('/webinars', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Webinar created successfully!');
      setTimeout(() => {
        router.push('/webinars');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create webinar');
    }
  };

  return (
  <Box
    maxWidth={700}
    mx="auto"
    my={4}
    sx={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      mt: 10,
      pb: "30px", // padding-bottom 30px
      mb: "30px"  // margin-bottom 30px
    }}
  >
      <Card sx={{ p: 4, borderRadius: 4, boxShadow: "0 2px 12px #2193b022", background: "linear-gradient(120deg, #f8f9fa 0%, #e0eafc 100%)", width: "100%" }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" fontWeight={900} color="#1565c0" sx={{ letterSpacing: 1 }}>
            Create Webinar
          </Typography>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField label="Title" name="title" fullWidth margin="normal" value={form.title} onChange={handleChange} required 
            sx={{ background: '#fff', borderRadius: 2 }}
          />
          <TextField label="Description" name="description" fullWidth margin="normal" value={form.description} onChange={handleChange} required multiline rows={4}
            sx={{ background: '#fff', borderRadius: 2 }}
          />
          <TextField
            select
            label="Type"
            name="type"
            fullWidth
            margin="normal"
            value={form.type}
            onChange={handleChange}
            SelectProps={{ native: true }}
            required
            sx={{ background: '#fff', borderRadius: 2 }}
          >
            <option value="webinar">Webinar</option>
            <option value="ama">AMA</option>
            <option value="case-discussion">Case Discussion</option>
            <option value="live-conference">Live Conference</option>
          </TextField>
          <TextField
            select
            label="Specialization"
            name="specialization"
            fullWidth
            margin="normal"
            value={form.specialization}
            onChange={handleChange}
            SelectProps={{ native: true }}
            required
            sx={{ background: '#fff', borderRadius: 2 }}
          >
            <option value="general">General</option>
            <option value="cardiology">Cardiology</option>
            <option value="neurology">Neurology</option>
            <option value="oncology">Oncology</option>
            <option value="pediatrics">Pediatrics</option>
            <option value="surgery">Surgery</option>
            <option value="psychiatry">Psychiatry</option>
            <option value="radiology">Radiology</option>
            <option value="emergency">Emergency</option>
            <option value="internal-medicine">Internal Medicine</option>
          </TextField>
          <TextField
            label="Scheduled At"
            name="scheduledAt"
            type="datetime-local"
            fullWidth
            margin="normal"
            value={form.scheduledAt}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
            sx={{ background: '#fff', borderRadius: 2 }}
          />
          <TextField
              label="Duration (minutes)"
              name="duration"
              type="number"
              fullWidth
              margin="dense"
              value={form.duration}
              onChange={handleChange}
              required
              inputProps={{ min: 15, max: 480 }}
              sx={{ background: '#fff', borderRadius: 2, mt: 2, mb: 2 }}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, fontWeight: 700, borderRadius: 3 }}>
            CREATE WEBINAR
          </Button>
        </form>
      </Card>
    </Box>
  );
}
