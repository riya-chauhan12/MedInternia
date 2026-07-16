import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, 
  LinearProgress, Chip, Container, Alert
} from '@mui/material';
import api from '../../utils/api';
import { BookOpen, Award, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { withAuth } from '../../components/withAuth';

function LearningPathsDashboard() {
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPaths();
  }, []);

  const fetchPaths = async () => {
    try {
      const response = await api.get('/learning-paths');
      const fetchedPaths = response.data.data.learningPaths || [];
      setPaths(fetchedPaths);
    } catch (error) {
      console.error('Failed to fetch learning paths', error);
      setPaths([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (pathId: string) => {
    try {
      await api.post(`/learning-paths/${pathId}/enroll`);
      router.push(`/learning-paths/${pathId}`);
    } catch (error) {
      console.error('Failed to enroll', error);
      // Fallback: just go to the path page anyway, maybe they are already enrolled
      router.push(`/learning-paths/${pathId}`);
    }
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 3 }}>
            <BookOpen size={32} color="#0072ff" />
          </Box>
          <Box>
            <Typography variant="h3" fontWeight={800} color="primary.dark">
              Learning Paths
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Master core clinical concepts step-by-step and earn badges.
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <LinearProgress />
        ) : (
          <Grid container spacing={4}>
            {paths.map(path => {
              const totalSteps = path.steps.length;
              const completedSteps = path.progress?.completedSteps.length || 0;
              const progressPct = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
              const isEnrolled = !!path.progress;
              const isCompleted = path.progress?.isCompleted;

              return (
                <Grid size={{ xs: 12, md: 6 }} key={path._id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: 4,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' }
                    }}
                  >
                    <CardContent sx={{ p: 4, flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Chip 
                          label={path.category} 
                          size="small" 
                          sx={{ bgcolor: 'rgba(0,114,255,0.1)', color: 'primary.main', fontWeight: 600 }} 
                        />
                        {isCompleted && (
                          <Chip 
                            icon={<CheckCircle size={16} />} 
                            label="Completed" 
                            color="success" 
                            size="small" 
                          />
                        )}
                      </Box>

                      <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5, color: 'text.primary' }}>
                        {path.title}
                      </Typography>
                      
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, minHeight: 48 }}>
                        {path.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Award size={24} color="#f59e0b" />
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Reward</Typography>
                          <Typography variant="body2" fontWeight={700}>{path.badge?.name || 'Special Badge'}</Typography>
                        </Box>
                      </Box>

                      {isEnrolled ? (
                        <Box sx={{ mt: 'auto' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">Progress</Typography>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                              {completedSteps} / {totalSteps} Steps
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={progressPct} 
                            sx={{ height: 10, borderRadius: 5, mb: 3 }} 
                          />
                          <Button 
                            variant="contained" 
                            fullWidth 
                            size="large"
                            onClick={() => router.push(`/learning-paths/${path._id}`)}
                            sx={{ borderRadius: 3, fontWeight: 700 }}
                          >
                            {isCompleted ? 'Review Path' : 'Continue Learning'}
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ mt: 'auto' }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            {totalSteps} Steps to Complete
                          </Typography>
                          <Button 
                            variant="outlined" 
                            fullWidth 
                            size="large"
                            onClick={() => handleEnroll(path._id)}
                            sx={{ borderRadius: 3, fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                          >
                            Enroll Now
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
            
            {paths.length === 0 && !loading && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info">No learning paths available at the moment. Check back soon!</Alert>
              </Grid>
            )}
          </Grid>
        )}
      </Container>
    </>
  );
}
export default withAuth(LearningPathsDashboard);
