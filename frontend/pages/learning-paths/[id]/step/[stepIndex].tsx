import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Card, CardContent, Button, 
  LinearProgress, Radio, RadioGroup, FormControlLabel, FormControl,
  Breadcrumbs, Link, Alert, Divider
} from '@mui/material';
import api from '../../../../utils/api';
import { useRouter } from 'next/router';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import NextLink from 'next/link';

export default function LearningPathStep() {
  const [path, setPath] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect?: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const router = useRouter();
  const { id, stepIndex: stepIndexStr } = router.query;
  const stepIndex = parseInt(stepIndexStr as string, 10);

  useEffect(() => {
    if (id && !isNaN(stepIndex)) {
      fetchPathDetails();
    }
  }, [id, stepIndex]);

  const fetchPathDetails = async () => {
    try {
      const response = await api.get(`/learning-paths/${id}`);
      setPath(response.data.data.learningPath);
      setProgress(response.data.data.progress);
    } catch (error) {
      console.error('Failed to fetch step details', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <><LinearProgress /></>;
  }

  if (!path || !path.steps[stepIndex]) {
    return <><Typography variant="h5" align="center" sx={{ mt: 10 }}>Step not found</Typography></>;
  }

  const step = path.steps[stepIndex];
  const isCompleted = progress?.completedSteps.includes(stepIndex);
  
  const handleComplete = async () => {
    if (isCompleted) {
      goToNext();
      return;
    }

    if (step.type === 'quiz' && selectedAnswer === null) {
      setFeedback({ message: 'Please select an answer first.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await api.post(`/learning-paths/${id}/progress`, {
        stepIndex,
        answerIndex: selectedAnswer
      });
      
      const { isCorrect, badgeAwarded, pathCompleted } = response.data;
      
      if (isCorrect !== false) {
        setFeedback({ 
          isCorrect: true, 
          message: pathCompleted 
            ? `Congratulations! You've completed the learning path! ${badgeAwarded ? 'Badge awarded!' : ''}`
            : 'Correct! Step completed successfully.' 
        });
        
        // Refresh progress
        fetchPathDetails();
        
        if (pathCompleted) {
          setTimeout(() => router.push(`/learning-paths/${id}`), 3000);
        }
      }
    } catch (error: any) {
      setFeedback({ 
        isCorrect: false, 
        message: error.response?.data?.message || 'Incorrect answer. Try again!' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const goToNext = () => {
    if (stepIndex < path.steps.length - 1) {
      router.push(`/learning-paths/${id}/step/${stepIndex + 1}`);
      setFeedback(null);
      setSelectedAnswer(null);
    } else {
      router.push(`/learning-paths/${id}`);
    }
  };

  const goToPrev = () => {
    if (stepIndex > 0) {
      router.push(`/learning-paths/${id}/step/${stepIndex - 1}`);
      setFeedback(null);
      setSelectedAnswer(null);
    }
  };

  return (
    <>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Breadcrumbs sx={{ mb: 4 }}>
          <NextLink href="/learning-paths" passHref legacyBehavior>
            <Link color="inherit" underline="hover">Learning Paths</Link>
          </NextLink>
          <NextLink href={`/learning-paths/${id}`} passHref legacyBehavior>
            <Link color="inherit" underline="hover">{path.title}</Link>
          </NextLink>
          <Typography color="text.primary">Step {stepIndex + 1}</Typography>
        </Breadcrumbs>

        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main">
            Step {stepIndex + 1} of {path.steps.length}
          </Typography>
          {isCompleted && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
              <CheckCircle size={20} />
              <Typography variant="subtitle2" fontWeight={700}>Completed</Typography>
            </Box>
          )}
        </Box>

        <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>{step.title}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>{step.description}</Typography>
            <Divider sx={{ mb: 4 }} />

            {step.type === 'case' && (
              <Box>
                {step.caseRef ? (
                  <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, mb: 4 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{step.caseRef.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{step.caseRef.description}</Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => window.open(`/cases/${step.caseRef._id}`, '_blank')}
                    >
                      Read Full Case Document
                    </Button>
                  </Box>
                ) : (
                  <Alert severity="warning" sx={{ mb: 4 }}>Case reference not found.</Alert>
                )}
              </Box>
            )}

            {step.type === 'quiz' && step.quiz && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  {step.quiz.question}
                </Typography>
                
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup
                    value={selectedAnswer !== null ? selectedAnswer : ''}
                    onChange={(e) => setSelectedAnswer(parseInt(e.target.value, 10))}
                  >
                    {step.quiz.options.map((option: string, i: number) => (
                      <Box 
                        key={i}
                        sx={{ 
                          mb: 2, 
                          border: '1px solid',
                          borderColor: selectedAnswer === i ? 'primary.main' : '#e2e8f0',
                          bgcolor: selectedAnswer === i ? 'rgba(0,114,255,0.05)' : 'transparent',
                          borderRadius: 2,
                          p: 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <FormControlLabel 
                          value={i} 
                          control={<Radio />} 
                          label={<Typography variant="body1">{option}</Typography>} 
                          disabled={isCompleted}
                          sx={{ width: '100%', m: 0 }}
                        />
                      </Box>
                    ))}
                  </RadioGroup>
                </FormControl>
                
                {isCompleted && step.quiz.explanation && (
                  <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                    <strong>Explanation:</strong> {step.quiz.explanation}
                  </Alert>
                )}
              </Box>
            )}

            {feedback && (
              <Alert 
                severity={feedback.isCorrect ? "success" : feedback.isCorrect === false ? "error" : "info"} 
                sx={{ mb: 4, borderRadius: 2 }}
              >
                {feedback.message}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button 
                startIcon={<ArrowLeft />} 
                onClick={goToPrev}
                disabled={stepIndex === 0}
              >
                Previous
              </Button>
              
              {!isCompleted ? (
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handleComplete}
                  disabled={submitting || (step.type === 'quiz' && selectedAnswer === null)}
                  sx={{ borderRadius: 3, px: 4 }}
                >
                  {submitting ? 'Checking...' : step.type === 'quiz' ? 'Submit Answer' : 'Mark as Complete'}
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="success"
                  size="large" 
                  endIcon={<ArrowRight />}
                  onClick={goToNext}
                  sx={{ borderRadius: 3, px: 4 }}
                >
                  {stepIndex === path.steps.length - 1 ? 'Finish Path' : 'Next Step'}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
