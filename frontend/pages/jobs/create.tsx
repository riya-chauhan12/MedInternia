import { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box, Alert, MenuItem, Grid, Switch, FormControlLabel } from '@mui/material';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import { canUser, getCurrentUserRole } from '../../utils/permissions';

export default function CreateJob() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    company: '',
    locationCity: '',
    locationState: '',
    locationCountry: '',
    isRemote: false,
    type: 'full-time',
    specialization: 'general',
    description: '',
    education: '',
    experience: '',
    yearsOfExperience: 0,
    applicationDeadline: '',
    contactEmail: '',
    visaSponsorship: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Page guard: check if user has permission
    const checkAccess = () => {
      const role = getCurrentUserRole();
      if (!role) {
        router.push('/auth/login');
        return;
      }
      if (!canUser(role, 'job:manage')) {
        router.push('/404');
      }
    };
    checkAccess();
  }, [router]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        title: form.title,
        company: form.company,
        location: {
          city: form.locationCity,
          state: form.locationState,
          country: form.locationCountry,
          isRemote: form.isRemote
        },
        type: form.type,
        specialization: [form.specialization],
        description: form.description,
        requirements: {
          education: form.education,
          experience: form.experience,
          yearsOfExperience: Number(form.yearsOfExperience)
        },
        applicationDeadline: form.applicationDeadline,
        contactEmail: form.contactEmail,
        visaSponsorship: form.visaSponsorship
      };

      await api.post('/jobs', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Job created successfully!');
      setTimeout(() => router.push('/jobs'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>Create Job Opportunity</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Title" name="title" fullWidth value={form.title} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Company" name="company" fullWidth value={form.company} onChange={handleChange} required />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="City" name="locationCity" fullWidth value={form.locationCity} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="State" name="locationState" fullWidth value={form.locationState} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Country" name="locationCountry" fullWidth value={form.locationCountry} onChange={handleChange} required />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Job Type" name="type" fullWidth value={form.type} onChange={handleChange} required>
                <MenuItem value="full-time">Full-time</MenuItem>
                <MenuItem value="part-time">Part-time</MenuItem>
                <MenuItem value="internship">Internship</MenuItem>
                <MenuItem value="fellowship">Fellowship</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Specialization" name="specialization" fullWidth value={form.specialization} onChange={handleChange} required>
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="cardiology">Cardiology</MenuItem>
                <MenuItem value="neurology">Neurology</MenuItem>
                <MenuItem value="oncology">Oncology</MenuItem>
                <MenuItem value="pediatrics">Pediatrics</MenuItem>
                <MenuItem value="surgery">Surgery</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField label="Description" name="description" fullWidth value={form.description} onChange={handleChange} required multiline rows={4} />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Education Requirement" name="education" fullWidth value={form.education} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Experience Description" name="experience" placeholder="e.g. 2 years in ICU" fullWidth value={form.experience} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Years of Experience (Numeric)" name="yearsOfExperience" type="number" fullWidth value={form.yearsOfExperience} onChange={handleChange} required />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Application Deadline" name="applicationDeadline" type="date" InputLabelProps={{ shrink: true }} fullWidth value={form.applicationDeadline} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Contact Email" name="contactEmail" type="email" fullWidth value={form.contactEmail} onChange={handleChange} required />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={<Switch checked={form.isRemote} onChange={handleChange} name="isRemote" />}
                label="Is Remote?"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={<Switch checked={form.visaSponsorship} onChange={handleChange} name="visaSponsorship" />}
                label="Offers Visa Sponsorship?"
              />
            </Grid>
          </Grid>
          
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, mb: 5, py: 1.5 }}>
            Create Job
          </Button>
        </form>
      </Box>
    </Container>
  );
}
