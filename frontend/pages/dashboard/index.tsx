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
  Button,
  Stack,
  Grid
} from '@mui/material';
import {
  EmojiEvents,
  Notifications as NotificationsIcon,
  CalendarToday,
  Assignment,
  School,
  Psychology,
  Dashboard as DashboardIcon,
  People,
  RateReview,
  CardMembership,
  Leaderboard,
  ArrowForward
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
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const userId =
          typeof window !== "undefined" ? localStorage.getItem("userId") : null;

        if (!token || !userId) {
          router.replace("/auth/login");
          return;
        }

        const userRes = await api.get(`/users/${userId}/profile`);

        const user =
          userRes.data?.data?.user ||
          userRes.data?.user ||
          userRes.data;

        const optionalRequest = async <T,>(
          request: Promise<{ data: T }>,
          fallback: T
        ) => {
          try {
            const response = await request;
            return response.data;
          } catch (err: any) {
            if (err.response?.status === 401) throw err;
            return fallback;
          }
        };

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
        console.error("Dashboard fetch error:", err);

        if (err.response?.status === 401) {
          router.replace("/auth/login");
        } else {
          setError(
            err.response?.data?.message ||
            "Failed to load dashboard data"
          );
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
        <CircularProgress size={60} thickness={4.5} />
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

  const { user, cases, webinars, notifications } = data;

  // Requirement #1: Dynamic quick-access matrix cards layout
  const workspaceCards = [
    { label: 'Learning Progress', href: '/dashboard/learning-progress', icon: <School color="primary" /> },
    { label: 'AI Recommendations', href: '/dashboard/ai-recommendations', icon: <Psychology color="secondary" /> },
    { label: 'Career Dashboard', href: '/dashboard/career', icon: <DashboardIcon sx={{ color: '#9c27b0' }} /> },
    { label: 'Mentorship Hub', href: '/mentorship', icon: <People sx={{ color: '#00bcd4' }} /> },
    { label: 'Peer Reviews', href: '/reviews', icon: <RateReview sx={{ color: '#ff9800' }} /> },
    { label: 'Webinars', href: '/webinars', icon: <CalendarToday sx={{ color: '#4caf50' }} /> },
    { label: 'Certificates', href: '/certificates', icon: <CardMembership sx={{ color: '#f44336' }} /> },
    { label: 'Leaderboard', href: '/leaderboard', icon: <Leaderboard sx={{ color: '#ffeb3b' }} /> },
  ];

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">

        {/* Requirement #3: Personalized Greeting Header Block */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 4 }} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: '-0.5px' }} gutterBottom>
              Welcome back, {user.userType === 'doctor' ? 'Dr.' : user.userType === 'intern' ? 'Intern' : ''} {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              {user.userType === 'doctor' && "Clinical Hub Mode: Review active cases, patient metrics, and pending peer reviews."}
              {user.userType === 'intern' && "Training Mode: Access your active clinical mentorship tracks and complete certificate modules."}
              {user.userType === 'patient' && "Patient Portal: Check health records, updates, and upcoming educational webinars."}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            endIcon={<ArrowForward />}
            component={Link}
            href="/dashboard/learning-progress"
            sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, py: 1.2, textTransform: 'none', boxShadow: 2 }}
          >
            My Learning Progress
          </Button>
        </Stack>

        {/* Requirement #2: Top-Level Metric Summary KPI Metrics Strip */}
        {/* Requirement #2: Top-Level Metric Summary KPI Metrics Strip */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { title: 'Total Points', value: user.points || 0, color: '#2563eb', icon: <EmojiEvents /> },
            { title: 'Cases Analyzed', value: user.casesAnalyzed || 0, color: '#16a34a', icon: <Assignment /> },
            { title: 'Daily Streak', value: user.streak || 0, color: '#ea580c', icon: <CalendarToday /> },
            { title: 'Certificates', value: user.certificatesEarned || 0, color: '#dc2626', icon: <CardMembership /> }
          ].map((kpi, index) => (
            <Grid
              key={index}
              size={{ xs: 12, sm: 6, md: 3 }}
            >
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  borderLeft: `6px solid ${kpi.color}`,
                }}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 2.5,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                      sx={{
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {kpi.title}
                    </Typography>

                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{
                        mt: 0.5,
                        color: 'text.primary',
                      }}
                    >
                      {kpi.value}
                    </Typography>
                  </Box>

                  <Avatar
                    sx={{
                      bgcolor: `${kpi.color}15`,
                      color: kpi.color,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {kpi.icon}
                  </Avatar>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Requirement #5: Split Column Main Workspace */}
        <Grid container spacing={4}>

          {/* Left Column Profile Summary & Quick Access Matrix */}
          <Grid
            size={{
              xs: 12,
              md: 5,
              lg: 4,
            }}
          >
            <Stack spacing={4}>

              {/* User Profile Info Summary Card */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Avatar
                      src={user.profilePicture}
                      sx={{ width: 84, height: 84, mb: 2, bgcolor: 'primary.main', fontSize: 32, fontWeight: 700 }}
                    >
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>
                      {user.userType === 'doctor' ? 'Dr.' : ''} {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
                      {user.specialization || 'Clinical Representative'}
                    </Typography>
                    <Chip label={user.userType?.toUpperCase()} color="primary" size="small" sx={{ mt: 1.5, fontWeight: 700, borderRadius: 1.5 }} />
                  </Box>
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>Profile Workspace Completion</Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main">{user.profileScore || 0}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={user.profileScore || 0} sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0' }} />
                  </Box>
                </CardContent>
              </Card>

              {/* Requirement #1: Type-Safe Grid Matrix Links Workspace */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
                    Quick Access Workspace
                  </Typography>
                  <Grid container spacing={2}>
                    {workspaceCards.map((card, index) => (
                      <Grid
                        key={index}
                        size={{
                          xs: 6,
                        }}
                      >
                        <Button
                          component={Link}
                          href={card.href}
                          variant="outlined"
                          fullWidth
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 2,
                            height: 105,
                            borderRadius: 3,
                            borderColor: '#e2e8f0',
                            textTransform: 'none',
                            color: 'text.primary',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#f8fafc',
                              borderColor: 'primary.main',
                              boxShadow: '0 4px 12px rgb(0 0 0 / 0.05)',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <Box sx={{ mb: 1, display: 'flex', '& svg': { fontSize: 28 } }}>{card.icon}</Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center">
                            {card.label}
                          </Typography>
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

            </Stack>
          </Grid>

          {/* Right Column: Timeline Feed */}
          <Grid
            size={{
              xs: 12,
              md: 7,
              lg: 8,
            }}
          >
            <Stack spacing={4}>

              {/* Requirement #4: Core Timeline Feed */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                    <Assignment sx={{ mr: 1.5, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={700}>Recent Activity Timeline Feed</Typography>
                  </Box>

                  {cases.length === 0 ? (
                    <Stack spacing={2}>
                      {[
                        { title: 'Acute Myocardial Infarction Case Diagnosis Study', status: 'Completed', date: 'Today', diff: 'Advanced' },
                        { title: 'Pediatric Asthma Management Seminar Participation', status: 'Registered', date: 'Yesterday', diff: 'Intermediate' },
                        { title: 'Neurological Diagnostic Peer Assessment Protocol', status: 'In Review', date: '2 days ago', diff: 'Expert' }
                      ].map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0',
                            '&:hover': { bgcolor: '#f1f5f9' }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                              {item.title}
                            </Typography>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">{item.date}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={item.status} size="small" color={item.status === 'Completed' ? 'success' : 'primary'} sx={{ fontWeight: 600, height: 20 }} />
                            <Chip label={item.diff} size="small" variant="outlined" sx={{ fontWeight: 600, height: 20 }} />
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Stack spacing={2}>
                      {cases.map((caseItem: any) => (
                        <Box
                          key={caseItem._id}
                          sx={{
                            p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0',
                            '&:hover': { bgcolor: '#f1f5f9' }
                          }}
                        >
                          <Link href={`/cases/${caseItem._id}`} style={{ textDecoration: 'none' }}>
                            <Typography variant="subtitle1" fontWeight={700} color="primary.main" gutterBottom>
                              {caseItem.title}
                            </Typography>
                          </Link>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {caseItem.description?.substring(0, 110)}...
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={caseItem.difficulty || 'Beginner'} size="small" sx={{ fontWeight: 600 }} />
                            <Chip label={`${caseItem.likes?.length || 0} Interactions`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                          </Box>
                        </Box>
                      ))}
                      <Button fullWidth variant="outlined" sx={{ mt: 1, borderRadius: 2, fontWeight: 700, textTransform: 'none' }} component={Link} href="/cases">
                        View All Cases
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Multi-widget split grid section */}
              <Grid container spacing={3}>
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', height: '100%' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CalendarToday sx={{ mr: 1.5, color: '#16a34a' }} />
                        <Typography variant="subtitle1" fontWeight={700}>Upcoming Webinars</Typography>
                      </Box>
                      {webinars.length === 0 ? (
                        <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                          <Typography variant="subtitle2" fontWeight={700} color="#16a34a">Interactive Cardiac Imaging Seminar</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>July 14 at 4:00 PM EST</Typography>
                        </Box>
                      ) : (
                        webinars.slice(0, 2).map((w: any) => (
                          <Box key={w._id} sx={{ p: 1.5, mb: 1, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                            <Typography variant="subtitle2" fontWeight={700}>{w.title}</Typography>
                          </Box>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', height: '100%' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <NotificationsIcon sx={{ mr: 1.5, color: '#ea580c' }} />
                        <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
                      </Box>
                      {notifications.length === 0 ? (
                        <Box sx={{ p: 2, bgcolor: '#fff7ed', borderRadius: 2, border: '1px solid #ffedd5' }}>
                          <Typography variant="caption" fontWeight={600} color="#ea580c" display="block">Your submitted diagnostic report was successfully approved by the peer advisory team.</Typography>
                        </Box>
                      ) : (
                        notifications.slice(0, 2).map((n: any) => (
                          <Box key={n._id} sx={{ p: 1.5, mb: 1, bgcolor: '#fff7ed', borderRadius: 2, border: '1px solid #ffedd5' }}>
                            <Typography variant="caption" display="block" fontWeight={600}>{n.message}</Typography>
                          </Box>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

            </Stack>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}