import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, CircularProgress, Alert, Card, CardContent, Button, Stack } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import MenuBookIcon from '@mui/icons-material/MenuBook';
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
            
            {user.publications && user.publications.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Publications ({user.publications.length})
                </Typography>
                <Stack spacing={2}>
                  {user.publications.map((pub: any, index: number) => (
                    <Box key={index} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary">
                        {pub.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pub.journal} • {pub.year}
                      </Typography>
                      {pub.url && (
                        <Button
                          variant="text"
                          color="secondary"
                          size="small"
                          component="a"
                          href={pub.url}
                          target="_blank"
                          startIcon={<MenuBookIcon />}
                          sx={{ mt: 1, textTransform: 'none' }}
                        >
                          View Paper
                        </Button>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

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
