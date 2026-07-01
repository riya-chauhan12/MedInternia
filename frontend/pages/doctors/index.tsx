import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Rating
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GroupIcon from '@mui/icons-material/Group';
import VerifiedIcon from '@mui/icons-material/Verified';
import api from '../../utils/api';

interface DoctorMentorshipCardProps {
  doctor: any;
  currentUserId: string;
  currentMentorId: string;
  onApplyMentorship: (id: string) => void;
  userRole: string;
}

function DoctorMentorshipCard({ doctor, currentUserId, currentMentorId, onApplyMentorship, userRole }: DoctorMentorshipCardProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${doctor._id}/mentor-summary`)
      .then(res => {
        setSummary(res.data?.data?.mentorStats || res.data?.mentorStats || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doctor._id]);

  const isCurrentMentor = currentMentorId === doctor._id;
  const isIntern = userRole === 'intern';

  return (
    <Card sx={{
      borderRadius: 4,
      border: isCurrentMentor ? '2px solid #2e7d32' : '1px solid #e3eafc',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      bgcolor: isCurrentMentor ? '#f1f8e9' : '#fff'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="h6" fontWeight={800} color="#333">
                Dr. {doctor.firstName} {doctor.lastName}
              </Typography>
              {doctor.isVerifiedDoctor && (
                <VerifiedIcon color="primary" sx={{ fontSize: 18 }} />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Specialization: <strong>{doctor.specialization || 'General'}</strong>
            </Typography>
          </Box>

          {isCurrentMentor && (
            <Chip label="Your Mentor" color="success" size="small" sx={{ fontWeight: 700 }} />
          )}
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>
        ) : summary ? (
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">Mentor Score:</Typography>
              <Chip
                icon={<AutoAwesomeIcon style={{ fontSize: 14 }} />}
                label={summary.mentorScore}
                color="warning"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">Mentees Mentored:</Typography>
              <Typography variant="caption" fontWeight={700}>{summary.internsMentored}</Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">Cases Reviewed:</Typography>
              <Typography variant="caption" fontWeight={700}>{summary.casesReviewed}</Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">Certificates Issued:</Typography>
              <Typography variant="caption" fontWeight={700}>{summary.certificatesIssued}</Typography>
            </Stack>
          </Stack>
        ) : (
          <Alert severity="info" sx={{ py: 0.5, px: 1, mb: 3 }}>No mentor summary stats found.</Alert>
        )}

        {isIntern && (
          <Box sx={{ mt: 'auto' }}>
            <Button
              variant={isCurrentMentor ? "contained" : "outlined"}
              color={isCurrentMentor ? "success" : "primary"}
              disabled={isCurrentMentor}
              fullWidth
              onClick={() => onApplyMentorship(doctor._id)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              {isCurrentMentor ? "Assigned Mentor" : "Apply for Mentorship"}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function Doctors() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [mentees, setMentees] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentMentorId, setCurrentMentorId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const fetchInitData = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUserId = localStorage.getItem('userId');

      if (!token || !storedUserId) {
        router.replace('/auth/login');
        return;
      }

      setCurrentUserId(storedUserId);

      // Fetch user profile to see if they are a doctor or intern
      const userRes = await api.get(`/users/${storedUserId}/profile`);
      const user = userRes.data?.data?.user || userRes.data?.user || userRes.data;
      setUserRole(user.userType || '');
      if (user.mentorDoctor) {
        setCurrentMentorId(user.mentorDoctor._id || user.mentorDoctor);
      }

      // Fetch doctors list
      const docsRes = await api.get('/doctors');
      setDoctors(docsRes.data.data.doctors || []);

      // If doctor, fetch mentees list
      if (user.userType === 'doctor') {
        const menteesRes = await api.get(`/doctors/${storedUserId}/mentees`);
        setMentees(menteesRes.data.data.mentees || []);
      }

    } catch (err) {
      console.error(err);
      setError('Failed to fetch mentorship directories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitData();
  }, [router]);

  const handleApplyMentorship = async (doctorId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/users/${currentUserId}/profile`, {
        mentorDoctor: doctorId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentMentorId(doctorId);
      alert('Selected doctor as your mentor successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to apply for mentorship.';
      alert(msg);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
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

  const isDoctor = userRole === 'doctor';

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={900} color="#1565c0" gutterBottom>
            Mentorship & Connection Hub
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Find clinical mentors, track mentoring achievements, and manage guidance credentials.
          </Typography>
        </Box>

        {isDoctor && (
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            centered
            sx={{ mb: 4, borderBottom: '1px solid #e3eafc' }}
          >
            <Tab label="Explore Mentors / Doctors" sx={{ fontWeight: 600 }} />
            <Tab label={`My Mentees (${mentees.length})`} sx={{ fontWeight: 600 }} />
          </Tabs>
        )}

        {/* Tab 0: Explore Mentors */}
        {(!isDoctor || activeTab === 0) && (
          <Grid container spacing={3}>
            {doctors.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <Typography align="center" color="text.secondary">No doctors found.</Typography>
              </Grid>
            ) : (
              doctors.map(d => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={d._id}>
                  <DoctorMentorshipCard
                    doctor={d}
                    currentUserId={currentUserId}
                    currentMentorId={currentMentorId}
                    onApplyMentorship={handleApplyMentorship}
                    userRole={userRole}
                  />
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Tab 1: My Mentees (Doctors Only) */}
        {isDoctor && activeTab === 1 && (
          <Card sx={{ borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Interns Under Your Guidance
              </Typography>

              {mentees.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 3 }}>
                  No interns have chosen you as their mentor yet. Let interns know they can apply for mentorship on their doctors directory tab!
                </Alert>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                  <Table aria-label="mentees table">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell><strong>Intern Name</strong></TableCell>
                        <TableCell><strong>Medical School / Year</strong></TableCell>
                        <TableCell><strong>Points</strong></TableCell>
                        <TableCell><strong>Streak</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mentees.map((m) => (
                        <TableRow key={m._id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{m.firstName} {m.lastName}</Typography>
                            <Typography variant="caption" color="text.secondary">{m.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{m.medicalSchool || 'Unspecified'}</Typography>
                            <Typography variant="caption" color="text.secondary">Year {m.yearOfStudy || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={`${m.points} Points`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={`${m.streak || 0} Days`} size="small" color="warning" sx={{ fontWeight: 700 }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
