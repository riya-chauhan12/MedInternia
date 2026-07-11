import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Card, CardContent, Button, 
  LinearProgress, List, ListItem, ListItemIcon, ListItemText,
  Divider, Breadcrumbs, Link
} from '@mui/material';
import api from '../../utils/api';
import { useRouter } from 'next/router';
import { PlayCircle, CheckCircle, Lock, FileText, HelpCircle } from 'lucide-react';
import NextLink from 'next/link';

export default function LearningPathDetails() {
  const [path, setPath] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) fetchPathDetails();
  }, [id]);

  const fetchPathDetails = async () => {
    try {
      const response = await api.get(`/learning-paths/${id}`);
      setPath(response.data.data.learningPath);
      setProgress(response.data.data.progress);
    } catch (error) {
      console.error('Failed to fetch learning path details', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <><LinearProgress /></>;
  }

  if (!path) {
    return <><Typography variant="h5" align="center" sx={{ mt: 10 }}>Learning path not found</Typography></>;
  }

  const completedStepIndices = progress?.completedSteps || [];
  const totalSteps = path.steps.length;
  const progressPct = totalSteps > 0 ? (completedStepIndices.length / totalSteps) * 100 : 0;
  
  // Find next uncompleted step
  let nextStepIndex = 0;
  while (completedStepIndices.includes(nextStepIndex) && nextStepIndex < totalSteps) {
    nextStepIndex++;
  }
  const isFullyCompleted = nextStepIndex >= totalSteps;

  return (
    <>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Breadcrumbs sx={{ mb: 4 }}>
          <NextLink href="/learning-paths" passHref legacyBehavior>
            <Link color="inherit" underline="hover">Learning Paths</Link>
          </NextLink>
          <Typography color="text.primary">{path.title}</Typography>
        </Breadcrumbs>

        <Card sx={{ mb: 6, borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 5 }}>
            <Typography variant="h3" fontWeight={800} color="primary.dark" sx={{ mb: 2 }}>
              {path.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              {path.description}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>Your Progress</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  {completedStepIndices.length} / {totalSteps} Steps
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPct} 
                sx={{ height: 12, borderRadius: 6 }} 
              />
            </Box>

            {!isFullyCompleted && progress && (
              <Button 
                variant="contained" 
                size="large" 
                sx={{ mt: 3, borderRadius: 3, fontWeight: 700 }}
                startIcon={<PlayCircle />}
                onClick={() => router.push(`/learning-paths/${path._id}/step/${nextStepIndex}`)}
              >
                {completedStepIndices.length === 0 ? 'Start Learning' : 'Continue Next Step'}
              </Button>
            )}
            {isFullyCompleted && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2, display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="#4caf50" />
                <Typography variant="subtitle1" fontWeight={700} color="success.main">
                  Path Completed! You earned the {path.badge?.name} badge.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Curriculum</Typography>
        <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <List disablePadding>
            {path.steps.map((step: any, index: number) => {
              const isCompleted = completedStepIndices.includes(index);
              const isLocked = !progress || (!isCompleted && index > nextStepIndex);
              const isNext = index === nextStepIndex && progress;

              return (
                <React.Fragment key={index}>
                  <ListItem 
                    sx={{ 
                      p: 3, 
                      bgcolor: isNext ? 'rgba(0,114,255,0.03)' : 'transparent',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 50 }}>
                      {isCompleted ? (
                        <CheckCircle color="#4caf50" size={28} />
                      ) : isLocked ? (
                        <Lock color="#cbd5e1" size={28} />
                      ) : (
                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #0072ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="caption" fontWeight={700} color="primary.main">{index + 1}</Typography>
                        </Box>
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {step.type === 'case' ? <FileText size={16} /> : <HelpCircle size={16} />}
                          <Typography variant="h6" fontWeight={700} color={isLocked ? 'text.disabled' : 'text.primary'}>
                            {step.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color={isLocked ? 'text.disabled' : 'text.secondary'}>
                          {step.description || (step.type === 'case' ? 'Read the clinical case.' : 'Test your knowledge.')}
                        </Typography>
                      }
                    />
                    {!isLocked && !isCompleted && progress && (
                      <Button 
                        variant={isNext ? "contained" : "outlined"}
                        onClick={() => router.push(`/learning-paths/${path._id}/step/${index}`)}
                        sx={{ borderRadius: 2, ml: 2 }}
                      >
                        Start
                      </Button>
                    )}
                    {isCompleted && (
                      <Button 
                        variant="text"
                        onClick={() => router.push(`/learning-paths/${path._id}/step/${index}`)}
                        sx={{ ml: 2 }}
                      >
                        Review
                      </Button>
                    )}
                  </ListItem>
                  {index < path.steps.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        </Card>
      </Container>
    </>
  );
}
