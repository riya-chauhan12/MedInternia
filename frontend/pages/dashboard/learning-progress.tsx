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
  Grid,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import api from '../../utils/api';
import Link from 'next/link';
import { useRequireAuth } from '../../hooks/useRequireAuth';

export default function LearningProgress() {
  const router = useRouter();
  const { isReady, userId } = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [webinars, setWebinars] = useState<any[]>([]);
  const [savedCases, setSavedCases] = useState<any[]>([]);

  useEffect(() => {
    // Wait until AuthContext has confirmed the user is authenticated
    // before firing off any requests.
    if (!isReady || !userId) return;

    const fetchLearningData = async () => {
      try {
        // Fetch User profile
        const userRes = await api.get(`/users/${userId}/profile`);
        const userData = userRes.data?.data?.user || userRes.data?.user || userRes.data;
        setUser(userData);

        // Fetch Webinars
        try {
          const webinarsRes = await api.get('/webinars/my?type=registered');
          setWebinars(webinarsRes.data?.data?.webinars || webinarsRes.data?.webinars || []);
        } catch (e) {
          console.error('Error fetching webinars', e);
        }

        // Fetch and Filter Saved Cases (Starred) from localStorage
        try {
          const starredIds = JSON.parse(localStorage.getItem('starredCases') || '[]');
          if (starredIds.length > 0) {
            const casesRes = await api.get('/cases');
            const allCases = casesRes.data?.data?.cases || casesRes.data?.cases || [];
            const filtered = allCases.filter((c: any) => starredIds.includes(c._id));
            setSavedCases(filtered);
          }
        } catch (e) {
          console.error('Error fetching saved cases', e);
        }

      } catch (err: any) {
        console.error('Learning Progress load error:', err);
        // No manual redirect needed here anymore — the global axios
        // response interceptor already handles 401s consistently.
        setError('Failed to load learning progress data.');
      } finally {
        setLoading(false);
      }
    };

    fetchLearningData();
  }, [isReady, userId]);

  if (!isReady || loading) {
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

  if (!user) return null;

  // Level progress calculation
  const nextLevelPoints = 500;
  const currentPoints = user.points || 0;
  const progressPercent = Math.min((currentPoints / nextLevelPoints) * 100, 100);

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
          <Button 
            variant="outlined" 
            onClick={() => router.push('/dashboard')}
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 3 }}
          >
            Dashboard
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#1565c0">
              Learning Progress
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Track your educational milestones, streak, and saved materials.
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={4}>
          {/* Left Column: Streak & Level Summary */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={4}>
              {/* Streak Card */}
              <Card sx={{
                borderRadius: 4, 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#fff'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 700 }}>ACTIVE STREAK</Typography>
                      <Typography variant="h2" fontWeight={900} sx={{ mt: 1 }}>
                        {user.streak || 0} Days
                      </Typography>
                    </Box>
                    <LocalFireDepartmentIcon sx={{ fontSize: 64, color: '#fef08a' }} />
                  </Stack>
                  <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Longest Streak: <strong>{user.longestStreak || 0} days</strong>. Keep studying daily to maintain your knowledge base!
                  </Typography>
                </CardContent>
              </Card>

              {/* Level & Points Progress */}
              <Card sx={{ borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Points & Tier Level
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress 
                        variant="determinate" 
                        value={progressPercent} 
                        size={120} 
                        thickness={5}
                        sx={{ color: '#10b981' }}
                      />
                      <Box sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Typography variant="h5" component="div" fontWeight={800} color="text.primary">
                          {currentPoints}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      {currentPoints} / {nextLevelPoints} Points to Next Tier
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercent} 
                    sx={{ height: 8, borderRadius: 4, mb: 1, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
                  />
                  <Typography variant="body2" color="text.secondary" align="center">
                    Current Rank: <Chip label={user.userType?.toUpperCase()} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </Typography>
                </CardContent>
              </Card>

              {/* Achievements Summary */}
              <Card sx={{ borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    Achievements
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
                        <EmojiEventsIcon sx={{ color: '#d97706' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>Badges Earned</Typography>
                        <Typography variant="caption" color="text.secondary">{(user.badges || []).length} Badges total</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                        <EmojiEventsIcon sx={{ color: '#059669' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>Certificates Earned</Typography>
                        <Typography variant="caption" color="text.secondary">{user.certificatesEarned || 0} Certificates total</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Right Column: Case Progress, Saved Cases & Webinars */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={4}>
              {/* Completed Learning Grid */}
              <Card sx={{ borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Active & Completed Learning
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <LibraryBooksIcon color="primary" sx={{ fontSize: 32 }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Cases Analyzed</Typography>
                            <Typography variant="h5" fontWeight={800}>{user.casesAnalyzed || 0}</Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <VideoLibraryIcon color="success" sx={{ fontSize: 32 }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Registered Webinars</Typography>
                            <Typography variant="h5" fontWeight={800}>{webinars.length}</Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  </Grid>

                  {webinars.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>My Registered Webinars</Typography>
                      <Stack spacing={1}>
                        {webinars.slice(0, 3).map((w: any) => (
                          <Box key={w._id} sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight={600} color="#15803d">{w.title}</Typography>
                            <Chip label="Registered" size="small" color="success" sx={{ fontWeight: 700 }} />
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Saved Cases Grid */}
              <Card sx={{ borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Saved Cases for Later Study
                  </Typography>
                  {savedCases.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 3 }}>
                      No saved cases. Go to the cases list and click the star icon to save cases here for study later!
                    </Alert>
                  ) : (
                    <Grid container spacing={3}>
                      {savedCases.map((c) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={c._id}>
                          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                            <CardContent>
                              <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {c.title}
                                </Typography>
                                <StarIcon sx={{ color: '#fbbf24' }} />
                              </Stack>
                              <Typography variant="caption" color="text.secondary" sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: 2
                              }}>
                                {c.description}
                              </Typography>
                              <Button 
                                size="small" 
                                variant="contained" 
                                component={Link} 
                                href={`/cases/${c._id}`}
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                              >
                                Study Case
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}