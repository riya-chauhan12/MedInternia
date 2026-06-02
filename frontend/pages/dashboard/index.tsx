import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Divider,
  Button,
  Stack
} from '@mui/material';
import {
  EmojiEvents,
  Notifications as NotificationsIcon,
  CalendarToday,
  Assignment
} from '@mui/icons-material';
import api from '../../utils/api';
import Link from 'next/link';

interface DashboardData {
  user: any;
  cases: any[];
  webinars: any[];
  notifications: any[];
  badges: any[];
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check authentication
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

        if (!token || !userId) {
          router.replace('/auth/login');
          return;
        }

        const userRes = await api.get(`/users/${userId}/profile`);
        const user = userRes.data?.data?.user || userRes.data?.user || userRes.data;

        const optionalRequest = async <T,>(request: Promise<{ data: T }>, fallback: T) => {
          try {
            const response = await request;
            return response.data;
          } catch (err: any) {
            if (err.response?.status === 401) throw err;
            return fallback;
          }
        };

        // Fetch optional dashboard widgets independently so one role-restricted
        // endpoint cannot prevent the rest of the dashboard from loading.
        const [casesRes, webinarsRes, notificationsRes, badgesRes] = await Promise.all([
          user.userType === 'doctor'
            ? optionalRequest(api.get('/cases/my/cases?limit=5'), { data: { cases: [] } })
            : Promise.resolve({ data: { cases: [] } }),
          optionalRequest(api.get('/webinars/my?type=registered'), { data: { webinars: [] } }),
          optionalRequest(api.get('/notifications'), { notifications: [] }),
          optionalRequest(api.get(`/badges/user/${userId}`), { data: { badges: [] } })
        ]);
        const getList = (payload: any, key: string) => payload?.data?.[key] || payload?.[key] || [];

        setData({
          user,
          cases: getList(casesRes, 'cases'),
          webinars: getList(webinarsRes, 'webinars'),
          notifications: getList(notificationsRes, 'notifications').slice(0, 5),
          badges: getList(badgesRes, 'badges')
        });
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        if (err.response?.status === 401) {
          router.replace('/auth/login');
        } else {
          setError(err.response?.data?.message || 'Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!data) return null;

  const { user, cases, webinars, notifications, badges } = data;

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
            Welcome back, {user.userType === 'doctor' ? 'Dr.' : ''} {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your account today.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* User Profile Summary */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 33.333%' } }}>
            <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    src={user.profilePicture}
                    sx={{
                      width: 100,
                      height: 100,
                      mb: 2,
                      bgcolor: 'primary.main',
                      fontSize: 40,
                      fontWeight: 700
                    }}
                  >
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} textAlign="center">
                    {user.userType === 'doctor' ? 'Dr.' : ''} {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {user.specialization || user.medicalSchool || 'Medical Professional'}
                  </Typography>
                  <Chip
                    label={user.userType?.toUpperCase()}
                    color="primary"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Stats */}
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      {user.points || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Points
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      {user.casesAnalyzed || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cases
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={700} color="warning.main">
                      {user.streak || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Streak
                    </Typography>
                  </Box>
                </Box>

                {/* Progress to next level */}
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Profile Score
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {user.profileScore || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={user.profileScore || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                {/* Badges Preview */}
                {badges.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Recent Badges
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {badges.slice(0, 4).map((badge: any, idx: number) => (
                        <Chip
                          key={idx}
                          icon={<EmojiEvents />}
                          label={badge.badge?.name || badge.name || 'Badge'}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    {badges.length > 4 && (
                      <Button size="small" sx={{ mt: 1 }} component={Link} href="/profile/achievements">
                        View All ({badges.length})
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Right Column */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 66.666%' } }}>
            <Stack spacing={3}>
              {/* Medical Case Tracker */}
              <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Recent Cases
                    </Typography>
                  </Box>
                  {cases.length === 0 ? (
                    <Alert severity="info">No cases yet. Create your first case to get started!</Alert>
                  ) : (
                    <Box>
                      {cases.map((caseItem: any) => (
                        <Box
                          key={caseItem._id}
                          sx={{
                            p: 2,
                            mb: 1,
                            bgcolor: '#f8fafc',
                            borderRadius: 2,
                            border: '1px solid #e2e8f0',
                            '&:hover': { bgcolor: '#f1f5f9' }
                          }}
                        >
                          <Link href={`/cases/${caseItem._id}`} style={{ textDecoration: 'none' }}>
                            <Typography variant="subtitle1" fontWeight={600} color="primary.main" gutterBottom>
                              {caseItem.title}
                            </Typography>
                          </Link>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {caseItem.description?.substring(0, 100)}...
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip label={caseItem.difficulty || 'Beginner'} size="small" />
                            <Chip label={`${caseItem.likes?.length || 0} likes`} size="small" variant="outlined" />
                            <Chip label={`${caseItem.comments?.length || 0} comments`} size="small" variant="outlined" />
                          </Box>
                        </Box>
                      ))}
                      <Button fullWidth variant="outlined" sx={{ mt: 2 }} component={Link} href="/cases">
                        View All Cases
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Webinars and Notifications Row */}
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Upcoming Webinars */}
                <Box sx={{ flex: 1 }}>
                  <Card sx={{ boxShadow: 3, borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CalendarToday sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="h6" fontWeight={600}>
                          Upcoming Events
                        </Typography>
                      </Box>
                      {webinars.length === 0 ? (
                        <Alert severity="info">No upcoming webinars.</Alert>
                      ) : (
                        <Box>
                          {webinars.slice(0, 3).map((webinar: any) => (
                            <Box
                              key={webinar._id}
                              sx={{
                                p: 2,
                                mb: 1,
                                bgcolor: '#f0fdf4',
                                borderRadius: 2,
                                border: '1px solid #bbf7d0'
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                {webinar.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(webinar.date).toLocaleDateString()} at {webinar.time}
                              </Typography>
                            </Box>
                          ))}
                          <Button fullWidth variant="outlined" color="success" sx={{ mt: 2 }} component={Link} href="/webinars">
                            View All Webinars
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>

                {/* Recent Notifications */}
                <Box sx={{ flex: 1 }}>
                  <Card sx={{ boxShadow: 3, borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <NotificationsIcon sx={{ mr: 1, color: 'warning.main' }} />
                        <Typography variant="h6" fontWeight={600}>
                          Notifications
                        </Typography>
                      </Box>
                      {notifications.length === 0 ? (
                        <Alert severity="info">No new notifications.</Alert>
                      ) : (
                        <Box>
                          {notifications.map((notification: any) => (
                            <Box
                              key={notification._id}
                              sx={{
                                p: 2,
                                mb: 1,
                                bgcolor: notification.read ? '#f8fafc' : '#fef3c7',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: notification.read ? '#e2e8f0' : '#fbbf24'
                              }}
                            >
                              <Typography variant="body2" gutterBottom>
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          ))}
                          <Button fullWidth variant="outlined" color="warning" sx={{ mt: 2 }} component={Link} href="/notifications">
                            View All Notifications
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
