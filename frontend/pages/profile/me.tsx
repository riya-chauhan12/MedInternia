import React, { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  Stack
} from "@mui/material";
import VerifiedIcon from '@mui/icons-material/Verified';
import EditIcon from '@mui/icons-material/Edit';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import Link from 'next/link';
import api from '../../utils/api';
import ResumeExportButton from '../../components/ResumeExportButton';

export default function MeProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          router.replace('/auth/login');
          return;
        }

        const res = await api.get(`/users/${userId}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = res.data?.data || res.data;
        setUser(profileData?.user || profileData);
        setBadges(profileData?.badges || []);
      } catch (err: any) {
        console.error('Profile fetch error:', err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box maxWidth={700} mx="auto" my={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!user) return null;

  // Specialties list
  const specialties = user.specialization ? [user.specialization] : (user.interests || []);

  return (
    <Box maxWidth={800} mx="auto" my={4} px={2}>
      {/* Profile Header Card */}
      <Card sx={{ p: 4, borderRadius: 4, mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e3eafc' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, sm: 'auto' }}>
            <Avatar 
              src={user.profilePicture} 
              sx={{ 
                width: 100, 
                height: 100, 
                fontSize: 40, 
                fontWeight: 700,
                bgcolor: 'primary.main',
                mx: { xs: 'auto', sm: 'left' } 
              }} 
            >
              {user.firstName?.[0]}{user.lastName?.[0]}
            </Avatar>
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} flexWrap="wrap">
              <Typography variant="h4" fontWeight={800} color="#1565c0">
                {user.userType === 'doctor' ? 'Dr.' : ''} {user.firstName} {user.lastName}
              </Typography>
              {(user.isVerified || user.isVerifiedDoctor) && (
                <VerifiedIcon color="success" sx={{ fontSize: 28 }} />
              )}
            </Stack>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5 }}>
              {user.specialization || user.medicalSchool || 'Medical Professional'}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'center', sm: 'flex-start' }} sx={{ mt: 1.5 }}>
              <Chip
                label={user.userType?.toUpperCase()}
                color="primary"
                size="small"
                sx={{ fontWeight: 700 }}
              />
              {(user.isVerified || user.isVerifiedDoctor) && (
                <Chip
                  label="Verified Practitioner"
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 'auto' }} sx={{ textAlign: 'center' }}>
            <Stack spacing={2} direction={{ xs: 'row', sm: 'column' }} justifyContent="center">
              <ResumeExportButton user={user} badges={badges} />
              <Button 
                variant="outlined" 
                component={Link}
                href="/profile/edit"
                startIcon={<EditIcon />}
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
              >
                Edit Profile
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Bio / Summary */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={700} color="#333" sx={{ mb: 1 }}>
            Professional Summary
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
            {user.bio || "No professional summary added yet. Update your profile to write a summary."}
          </Typography>
        </Box>
      </Card>
      {/* Achievements Card */}
      <Card sx={{ p: 4, borderRadius: 4, background: "#f8f9fa", mb: 4 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Recent Achievements
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip
            icon={
              <span className="material-icons" style={{ color: "#FFD700" }}>
                emoji_events
              </span>
            }
            label="Champion"
            color="warning"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            icon={
              <span className="material-icons" style={{ color: "#0072ff" }}>
                star
              </span>
            }
            label="Expert Reviewer"
            color="primary"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            icon={
              <span className="material-icons" style={{ color: "#6dd5ed" }}>
                trending_up
              </span>
            }
            label="Growth Master"
            sx={{ fontWeight: 600, bgcolor: "#e0eafc" }}
          />
        </Box>
      </Card>

      {/* Grid for details and metrics */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Stats Overview */}
          <Card sx={{ p: 3, borderRadius: 4, mb: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Activity Stats
            </Typography>
            <Stack spacing={2.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Points Balance</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="primary">{user.points || 0}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Cases Analyzed</Typography>
                <Typography variant="subtitle1" fontWeight={800}>{user.casesAnalyzed || 0}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Peer Reviews Given</Typography>
                <Typography variant="subtitle1" fontWeight={800}>{user.peerReviewsGiven || 0}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Certificates Earned</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="success.main">{user.certificatesEarned || 0}</Typography>
              </Stack>
            </Stack>
          </Card>

          {/* Quick Links */}
          <Card sx={{ p: 3, borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Quick Navigation
            </Typography>
            <Stack spacing={1}>
              <Button fullWidth variant="outlined" component={Link} href="/profile/achievements" sx={{ borderRadius: 2, justifyContent: 'flex-start', textTransform: 'none' }} startIcon={<EmojiEventsIcon />}>
                My Achievements
              </Button>
              <Button fullWidth variant="outlined" component={Link} href="/profile/cases" sx={{ borderRadius: 2, justifyContent: 'flex-start', textTransform: 'none' }} startIcon={<LibraryBooksIcon />}>
                My Cases
              </Button>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          {/* Specialties / Clinical Focus */}
          <Card sx={{ p: 3, borderRadius: 4, mb: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Clinical Specialties & Focus
            </Typography>
            {specialties.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No clinical specialties listed.</Typography>
            ) : (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {specialties.map((spec: string) => (
                  <Chip key={spec} label={spec} color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                ))}
              </Stack>
            )}
          </Card>

          {/* Academic & Background Info */}
          <Card sx={{ p: 3, borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Background Details
            </Typography>
            <Stack spacing={2}>
              {user.medicalSchool && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <SchoolIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Medical School</Typography>
                    <Typography variant="body2" fontWeight={600}>{user.medicalSchool}</Typography>
                  </Box>
                </Stack>
              )}
              {user.licenseNumber && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <VerifiedIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">License Number</Typography>
                    <Typography variant="body2" fontWeight={600}>{user.licenseNumber}</Typography>
                  </Box>
                </Stack>
              )}
              {user.experience !== undefined && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <VerifiedIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Years of Experience</Typography>
                    <Typography variant="body2" fontWeight={600}>{user.experience} Years</Typography>
                  </Box>
                </Stack>
              )}
              <Stack direction="row" spacing={2} alignItems="center">
                <SchoolIcon color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Academic Year / Year of Study</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {user.yearOfStudy ? `Year ${user.yearOfStudy}` : 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Card>

          {/* Publications */}
          {user.publications && user.publications.length > 0 && (
            <Card sx={{ p: 3, borderRadius: 4, mt: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
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
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
