import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, CircularProgress, Alert, Card, CardContent, Button, Chip } from '@mui/material';
import api from '../../../utils/api';

const getWebinarEndTime = (webinar: any) => {
  const duration = Number(webinar.duration || 0);
  return new Date(new Date(webinar.scheduledAt).getTime() + duration * 60 * 1000);
};

const isWebinarExpired = (webinar: any) => {
  const now = new Date();

  if (webinar.status === 'completed' || webinar.status === 'cancelled') {
    return true;
  }

  if (webinar.status === 'live') {
    return getWebinarEndTime(webinar) <= now;
  }

  return new Date(webinar.scheduledAt) <= now;
};

export default function WebinarDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [webinar, setWebinar] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        const [webinarRes, userRes] = await Promise.all([
          api.get(`/webinars/${id}`),
          api.get('/auth/profile')
        ]);
        
        const fetchedWebinar = webinarRes.data.data.webinar;
        const userId = userRes.data?.data?.user?._id;
        
        setWebinar(fetchedWebinar);
        setCurrentUserId(userId);
        
        // Check if user is registered
        const registered = fetchedWebinar.participants?.some(
          (p: any) => (p.user?._id === userId || p.user === userId)
        );
        setIsRegistered(registered);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch webinar details');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleRegister = async () => {
    if (!webinar || isWebinarExpired(webinar) || webinar.status !== 'scheduled') {
      setError('This webinar has completed and registration is closed.');
      return;
    }

    try {
      await api.post(`/webinars/${id}/register`, {});
      setIsRegistered(true);
      // Refresh webinar data
      const res = await api.get(`/webinars/${id}`);
      setWebinar(res.data.data.webinar);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  const handleUnregister = async () => {
    try {
      await api.delete(`/webinars/${id}/register`);
      setIsRegistered(false);
      // Refresh webinar data
      const res = await api.get(`/webinars/${id}`);
      setWebinar(res.data.data.webinar);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unregister');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!webinar) return null;

  const expired = isWebinarExpired(webinar);
  const statusLabel = expired ? (webinar.status === 'cancelled' ? 'Cancelled' : 'Completed') : webinar.status;
  const canJoin = !expired && webinar.status === 'live';
  const canRegister = !expired && webinar.status === 'scheduled' && !isRegistered;
  const canUnregister = !expired && webinar.status === 'scheduled' && isRegistered;

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Typography variant="h4">{webinar.title}</Typography>
              <Chip
                label={statusLabel}
                color={expired ? 'default' : webinar.status === 'live' ? 'success' : 'primary'}
              />
              {isRegistered && (
                <Chip
                  label="Registered"
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {new Date(webinar.scheduledAt).toLocaleString()}
            </Typography>
            {webinar.host && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Host: {webinar.host.firstName} {webinar.host.lastName}
              </Typography>
            )}
            <Typography variant="body1" sx={{ mt: 2 }}>{webinar.description}</Typography>
            
            {webinar.registrationDeadline && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Registration deadline: {new Date(webinar.registrationDeadline).toLocaleString()}
              </Typography>
            )}
            
            {webinar.maxParticipants && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Participants: {webinar.participants?.length || 0} / {webinar.maxParticipants}
              </Typography>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            {expired && (
              <Alert severity="info" sx={{ mt: 2 }}>
                This webinar has {webinar.status === 'cancelled' ? 'been cancelled' : 'completed'}. Registration is no longer available.
              </Alert>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              {canJoin && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => router.push(`/webinars/${id}/join`)}
                  sx={{ flex: 1 }}
                >
                  Join Now
                </Button>
              )}
              {canRegister && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRegister}
                  sx={{ flex: 1 }}
                >
                  Register for Webinar
                </Button>
              )}
              {canUnregister && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ flex: 1 }}
                    disabled
                  >
                    Already Registered
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleUnregister}
                  >
                    Unregister
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
