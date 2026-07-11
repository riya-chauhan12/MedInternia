import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, CircularProgress, Alert, Card, CardContent, Button } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import api from '../../utils/api';

export default function UserProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/users/${id}/profile`)
      .then(res => {
        setUser(res.data.data.user);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch user profile');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!user) return null;

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>{user.firstName} {user.lastName}</Typography>
            <Typography variant="body1">Email: {user.email}</Typography>
            <Typography variant="body1">User Type: {user.userType}</Typography>
            {/* Add more user details here */}
            <Box mt={3}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<MessageIcon />}
                onClick={() => router.push(`/messages?userId=${user._id}`)}
              >
                Message
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
