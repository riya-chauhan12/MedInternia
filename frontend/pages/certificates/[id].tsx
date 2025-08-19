import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, CircularProgress, Alert, Card, CardContent } from '@mui/material';
import api from '../../utils/api';

export default function CertificateDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [certificate, setCertificate] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('token');
    api.get(`/certificates/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setCertificate(res.data.data.certificate);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch certificate');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!certificate) return null;

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>{certificate.title}</Typography>
            <Typography variant="body1">{certificate.description}</Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
