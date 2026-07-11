import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, CircularProgress, Alert, Grid, Card, CardContent, Button, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, IconButton, Divider, Chip } from '@mui/material';
import api, { getAuthToken } from '../../../utils/api';
import { io, Socket } from 'socket.io-client';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export default function JoinWebinar() {
  const router = useRouter();
  const { id } = router.query;
  const [webinar, setWebinar] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Q&A State
  const [newQuestion, setNewQuestion] = useState('');

  // Host Poll Creation State
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        const [webinarRes, userRes] = await Promise.all([
          api.get(`/webinars/${id}`),
          api.get('/auth/profile')
        ]);
        
        setWebinar(webinarRes.data.data.webinar);
        setCurrentUserId(userRes.data?.data?.user?._id);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch webinar details');
        setLoading(false);
      }
    };
    
    fetchData();

    // Socket Connection
    const token = getAuthToken();
    if (token) {
      const newSocket = io(BACKEND_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        newSocket.emit('join_webinar', id);
      });

      newSocket.on('webinar_update', (updatedWebinar: any) => {
        setWebinar(updatedWebinar);
      });

      setSocket(newSocket);

      return () => {
        newSocket.emit('leave_webinar', id);
        newSocket.disconnect();
      };
    }
  }, [id]);

  const isHost = webinar?.host?._id === currentUserId || webinar?.host === currentUserId;

  // --------------------------------------------------------
  // Polling Functions
  // --------------------------------------------------------
  const handleCreatePoll = async () => {
    if (!newPollQuestion.trim() || newPollOptions.some(opt => !opt.trim())) return;
    try {
      await api.post(`/webinars/${id}/polls`, {
        question: newPollQuestion,
        options: newPollOptions.filter(opt => opt.trim())
      });
      setNewPollQuestion('');
      setNewPollOptions(['', '']);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVotePoll = async (pollId: string, optionIndex: number) => {
    try {
      await api.post(`/webinars/${id}/polls/${pollId}/vote`, { optionIndex });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      await api.patch(`/webinars/${id}/polls/${pollId}/close`);
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------
  // Q&A Functions
  // --------------------------------------------------------
  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return;
    try {
      await api.post(`/webinars/${id}/qna`, { question: newQuestion });
      setNewQuestion('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpvoteQuestion = async (qnaId: string) => {
    try {
      await api.post(`/webinars/${id}/qna/${qnaId}/upvote`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAnswered = async (qnaId: string) => {
    try {
      await api.patch(`/webinars/${id}/qna/${qnaId}/answer`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!webinar) return null;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f4f6f8' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/webinars/${id}`)} sx={{ mr: 2 }}>Back</Button>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>{webinar.title}</Typography>
        <Chip label={webinar.status.toUpperCase()} color={webinar.status === 'live' ? 'error' : 'default'} />
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        
        {/* Left Side: Video iframe */}
        <Box sx={{ height: '100%', p: 2, width: { xs: '100%', md: '66.666%' } }}>
          <Box sx={{ width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden', bgcolor: 'black', boxShadow: 3 }}>
            {webinar.meetingLink ? (
              <iframe
                src={webinar.meetingLink}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                title="Webinar Live Stream"
              />
            ) : (
              <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Typography>Meeting link not available.</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Side: Interactive Panel (Polls & Q&A) */}
        <Box sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', gap: 2, width: { xs: '100%', md: '33.333%' } }}>
          
          {/* Polls Section */}
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#f0f4f8', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight={700} color="primary">Live Polls</Typography>
            </Box>
            <CardContent sx={{ flex: 1, overflowY: 'auto' }}>
              {isHost && (
                <Box sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Create New Poll</Typography>
                  <TextField fullWidth size="small" placeholder="Poll Question" value={newPollQuestion} onChange={e => setNewPollQuestion(e.target.value)} sx={{ mb: 1 }} />
                  {newPollOptions.map((opt, i) => (
                    <TextField key={i} fullWidth size="small" placeholder={`Option ${i + 1}`} value={opt} onChange={e => {
                      const opts = [...newPollOptions];
                      opts[i] = e.target.value;
                      setNewPollOptions(opts);
                    }} sx={{ mb: 1 }} />
                  ))}
                  <Button size="small" onClick={() => setNewPollOptions([...newPollOptions, ''])}>+ Add Option</Button>
                  <Button variant="contained" size="small" fullWidth sx={{ mt: 1 }} onClick={handleCreatePoll}>Launch Poll</Button>
                </Box>
              )}

              {webinar.polls && webinar.polls.length > 0 ? webinar.polls.map((poll: any) => {
                const totalVotes = Object.keys(poll.votes || {}).length;
                const userVoted = poll.votes && typeof poll.votes === 'object' && currentUserId in poll.votes;
                const selectedOption = userVoted ? poll.votes[currentUserId] : null;

                return (
                  <Box key={poll._id} sx={{ mb: 3, p: 2, bgcolor: poll.active ? '#fff' : '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>{poll.question}</Typography>
                      {!poll.active && <Chip label="Closed" size="small" color="default" />}
                      {poll.active && <Chip label="Active" size="small" color="success" />}
                    </Box>

                    {poll.active && !userVoted && !isHost ? (
                      <FormControl component="fieldset">
                        <RadioGroup onChange={(e) => handleVotePoll(poll._id, Number(e.target.value))}>
                          {poll.options.map((opt: string, i: number) => (
                            <FormControlLabel key={i} value={i} control={<Radio />} label={opt} />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    ) : (
                      <Box sx={{ mt: 1 }}>
                        {poll.options.map((opt: string, i: number) => {
                          let votesForOpt = 0;
                          if (poll.votes) {
                            Object.values(poll.votes).forEach(val => {
                              if (val === i) votesForOpt++;
                            });
                          }
                          const percentage = totalVotes > 0 ? Math.round((votesForOpt / totalVotes) * 100) : 0;
                          return (
                            <Box key={i} sx={{ mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: selectedOption === i ? 700 : 400 }}>{opt}</Typography>
                                <Typography variant="body2">{percentage}%</Typography>
                              </Box>
                              <Box sx={{ width: '100%', height: 6, bgcolor: '#e0e0e0', borderRadius: 3, mt: 0.5, overflow: 'hidden' }}>
                                <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: 'primary.main' }} />
                              </Box>
                            </Box>
                          );
                        })}
                        <Typography variant="caption" color="text.secondary">{totalVotes} votes</Typography>
                      </Box>
                    )}

                    {isHost && poll.active && (
                      <Button size="small" color="error" sx={{ mt: 2 }} onClick={() => handleClosePoll(poll._id)}>Close Poll</Button>
                    )}
                  </Box>
                )
              }).reverse() : <Typography variant="body2" color="text.secondary">No polls yet.</Typography>}
            </CardContent>
          </Card>

          {/* Q&A Section */}
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#f0f4f8', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight={700} color="primary">Q&A</Typography>
            </Box>
            <CardContent sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              
              <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                {webinar.qna && webinar.qna.length > 0 ? [...webinar.qna]
                  .sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0))
                  .map((q: any) => {
                    const hasUpvoted = q.upvotes?.includes(currentUserId);
                    const authorName = q.author?.firstName ? `${q.author.firstName} ${q.author.lastName}` : 'Attendee';

                    return (
                      <Box key={q._id} sx={{ mb: 2, display: 'flex', gap: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <IconButton size="small" onClick={() => handleUpvoteQuestion(q._id)} color={hasUpvoted ? "primary" : "default"}>
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="caption" fontWeight={700}>{q.upvotes?.length || 0}</Typography>
                        </Box>
                        <Box sx={{ flex: 1, bgcolor: q.isAnswered ? '#f0fdf4' : '#fff', p: 1.5, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>{authorName}</Typography>
                            {q.isAnswered && <Chip size="small" icon={<CheckCircleIcon />} label="Answered" color="success" variant="outlined" sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.65rem' } }} />}
                          </Box>
                          <Typography variant="body2">{q.question}</Typography>
                          
                          {isHost && !q.isAnswered && (
                            <Button size="small" color="success" sx={{ mt: 1, p: 0, fontSize: '0.75rem' }} onClick={() => handleMarkAnswered(q._id)}>Mark Answered</Button>
                          )}
                        </Box>
                      </Box>
                    );
                }) : <Typography variant="body2" color="text.secondary">No questions yet.</Typography>}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="Ask a question..." 
                  value={newQuestion} 
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                />
                <Button variant="contained" onClick={handleAskQuestion}>Ask</Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
