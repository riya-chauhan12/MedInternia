import { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import api from '../../utils/api';
import PatientCard from '../../components/PatientCard';

export default function Patients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    api.get('/patients', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setPatients(res.data.data.patients || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch patients');
        setLoading(false);
      });
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>Patients</Typography>
        {patients.length === 0 ? (
          <Typography>No patients found.</Typography>
        ) : (
          patients.map(p => (
            <PatientCard key={p._id} patient={p} />
          ))
        )}
      </Box>
    </Container>
  );
}
