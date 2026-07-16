import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, Variants } from 'framer-motion';
import {
  Box,
  Button,
  Alert,
  Typography,
  Paper,
  Stack,
  Container,
  Grid,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Skeleton,
  Chip,
  TextField,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import {
  FolderOpen,
  Briefcase,
  Video,
  Award,
  ChevronRight,
  CheckCircle2,
  HeadphonesIcon,
  Mail,
  UserPlus,
  Users,
} from 'lucide-react';
import { getLoginHref, protectedLandingPaths } from '../utils/authRedirect';
import HeroProductPreview from '../components/landing/HeroProductPreview';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [waitlistEmail, setWaitlistEmail] = React.useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = React.useState(false);

  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsLoggedIn(!!token);
  }, []);

  const getAuthAwareHref = (path: string) =>
    !isLoggedIn && protectedLandingPaths.includes(path) ? getLoginHref(path) : path;

  const handleWaitlistSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWaitlistSubmitted(true);
    setWaitlistEmail('');
  };

  const navItems = isLoggedIn
    ? ['Cases', 'Jobs', 'Webinars', 'Leaderboard', 'About']
    : ['Jobs', 'Webinars', 'Leaderboard', 'About'];

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const featureCardSx = {
    p: 4,
    borderRadius: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    bgcolor: isDarkMode ? '#0f172a' : '#fff',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      borderColor: '#0072ff',
      boxShadow: isDarkMode ? '0 12px 32px rgba(15, 23, 42, 0.3)' : '0 12px 32px rgba(0, 114, 255, 0.1)',
      '& .explore-underline': { width: '100%' },
    },
  };

  const pageBg = isDarkMode ? '#07111f' : '#f8fbff';
  const surfaceBg = isDarkMode ? '#0f172a' : '#fff';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const textPrimary = isDarkMode ? '#f8fafc' : '#1a202c';
  const textSecondary = isDarkMode ? '#cbd5e1' : '#4a5568';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: pageBg, color: textPrimary, overflowX: 'hidden', maxWidth: '100%' }}>
      <Head>
        <title>MedInternia - Your Gateway to Medical Learning</title>
      </Head>

      {/* Landing header */}
      <Box
        component="header"
        sx={{
          px: { xs: 2, md: 6 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: surfaceBg,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => router.push('/')}
          role="button"
          tabIndex={0}
          aria-label="Go to MedInternia home"
          onKeyDown={(e) => e.key === 'Enter' && router.push('/')}
        >
          <Image src="/med-internia-logo.jpg" alt="MedInternia Logo" width={36} height={36} style={{ borderRadius: '50%' }} />
          <Typography variant="h6" fontWeight={800} color={textPrimary} ml={1}>
            MedInternia
          </Typography>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
          {navItems.map((item) => (
            <Link key={item} href={getAuthAwareHref(`/${item.toLowerCase()}`)} passHref legacyBehavior>
              <Typography
                component="a"
                fontWeight={600}
                color={textSecondary}
                sx={{
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  '&:hover': { color: '#0072ff', borderBottom: 'none !important' },
                }}
              >
                {item}
              </Typography>
            </Link>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <IconButton
            sx={{ display: { xs: 'inline-flex', md: 'none' }, color: textPrimary }}
            aria-label="Open navigation menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Button
            variant="text"
            sx={{
              color: '#0072ff',
              fontWeight: 700,
              display: { xs: 'none', sm: 'inline-flex' },
              '&:hover': { bgcolor: 'rgba(0,114,255,0.08)' },
            }}
            onClick={() => router.push('/auth/login')}
          >
            Log in
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#0072ff',
              color: '#fff',
              borderRadius: '24px',
              px: { xs: 2, sm: 3 },
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(0,114,255,0.2)',
              '&:hover': { bgcolor: '#005bb5', transform: 'translateY(-1px)' },
              transition: 'all 0.2s',
            }}
            onClick={() => router.push('/auth/register')}
          >
            Sign Up
          </Button>
          <IconButton
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => setIsDarkMode((prev) => !prev)}
            sx={{
              color: '#0072ff',
              border: '1px solid rgba(0,114,255,0.2)',
              bgcolor: isDarkMode ? 'rgba(0,114,255,0.08)' : 'transparent',
              borderRadius: '999px',
              '&:hover': { bgcolor: 'rgba(0,114,255,0.12)' },
            }}
          >
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Box>

      {/* Mobile nav drawer */}
      <Drawer
        anchor="right"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <Typography fontWeight={700} color="#1a202c">
            Menu
          </Typography>
          <IconButton aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {navItems.map((item) => (
            <ListItem key={item} disablePadding>
              <ListItemButton
                component={Link}
                href={getAuthAwareHref(`/${item.toLowerCase()}`)}
                onClick={() => setMobileNavOpen(false)}
              >
                <ListItemText primary={item} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemButton component={Link} href="/auth/login" onClick={() => setMobileNavOpen(false)}>
              <ListItemText primary="Log in" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Hero */}
      <Container maxWidth="xl" sx={{ pt: { xs: 6, md: 12 }, pb: { xs: 8, md: 12 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Typography
                variant="h1"
                fontWeight={800}
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                  color: '#1a202c',
                  lineHeight: 1.15,
                  mb: 3,
                }}
              >
                Your Gateway to{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(45deg, #0072ff, #00c6ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Medical Learning, Jobs & Opportunities
                </Box>
              </Typography>
              <Typography variant="body1" sx={{ color: '#4a5568', fontSize: '1.15rem', mb: 4, maxWidth: 500, lineHeight: 1.6 }}>
                Join a community of learners and professionals collaborating to shape the future of healthcare.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 5 }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: '#0072ff',
                    px: 5,
                    py: 1.5,
                    borderRadius: '30px',
                    fontWeight: 800,
                    boxShadow: '0 8px 25px rgba(0,114,255,0.3)',
                    '&:hover': { bgcolor: '#005bb5', transform: 'translateY(-2px)' },
                    transition: 'all 0.3s',
                  }}
                  onClick={() => router.push('/auth/register')}
                >
                  Join Now
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    color: '#0072ff',
                    borderColor: '#0072ff',
                    borderWidth: 2,
                    px: 5,
                    py: 1.5,
                    borderRadius: '30px',
                    fontWeight: 800,
                    '&:hover': { borderWidth: 2, bgcolor: '#eff6ff', transform: 'translateY(-2px)' },
                    transition: 'all 0.3s',
                  }}
                  onClick={() => router.push('/auth/login')}
                >
                  Log In
                </Button>
              </Box>

              {/* Community social proof — skeleton, no fake data */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex' }}>
                  {['A', 'B', 'C', 'D'].map((initial, i) => (
                    <Box
                      key={initial}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: '2px solid #fff',
                        ml: i === 0 ? 0 : -1.5,
                        bgcolor: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 4 - i,
                        position: 'relative',
                      }}
                      aria-hidden
                    >
                      <Typography variant="caption" fontWeight={700} color="#94a3b8" fontSize="0.7rem">
                        {initial}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Users size={16} color="#0072ff" aria-hidden />
                    <Typography fontWeight={700} color="#1a202c" fontSize="0.95rem">
                      Growing community
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="#718096">
                    Doctors, interns & students
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            >
              <Box sx={{ position: 'relative', px: { xs: 1, sm: 2 }, py: 2 }}>
                {/* Decorative blob */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: '100%',
                    height: '100%',
                    bgcolor: '#e0f2fe',
                    borderRadius: '50%',
                    zIndex: 0,
                    filter: 'blur(60px)',
                    opacity: 0.8,
                    pointerEvents: 'none',
                  }}
                />

                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    borderRadius: '32px',
                    overflow: 'hidden',
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
                    border: '8px solid #fff',
                    width: '100%',
                    maxWidth: 540,
                    mx: 'auto',
                    bgcolor: '#000',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': { transform: 'scale(1.01)' },
                  }}
                >
                  <video width="100%" autoPlay loop muted playsInline style={{ display: 'block' }}>
                    <source src="/anushka_video.mp4" type="video/mp4" />
                  </video>
                </Box>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
                  <Paper
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: { xs: 8, md: 12 },
                      p: 2,
                      borderRadius: '16px',
                      zIndex: 2,
                      boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                      display: { xs: 'none', sm: 'flex' },
                      alignItems: 'center',
                      gap: 1.5,
                      bgcolor: '#fff',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#48bb78', boxShadow: '0 0 0 3px #c6f6d5' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Live Webinars
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="#1a202c">
                        Expert AMA sessions
                      </Typography>
                    </Box>
                  </Paper>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.5 }}>
                  <Paper
                    sx={{
                      position: 'absolute',
                      bottom: { xs: 8, md: 12 },
                      left: { xs: 8, md: 12 },
                      p: 2,
                      borderRadius: '16px',
                      zIndex: 2,
                      boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      bgcolor: '#fff',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Box sx={{ bgcolor: '#eff6ff', p: 1, borderRadius: '12px' }}>
                      <FolderOpen size={22} color="#0072ff" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Case Library
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="#1a202c">
                        Peer-reviewed cases
                      </Typography>
                    </Box>
                  </Paper>
                </motion.div>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Feature cards */}
      <Container maxWidth="xl" sx={{ mb: 12 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer}>
          <Grid container spacing={3}>
            {[
              { title: 'Cases', desc: 'Explore and analyze real medical cases.', icon: <FolderOpen size={28} color="#0072ff" />, color: '#eff6ff', link: '/cases', authRequired: true },
              { title: 'Jobs', desc: 'Find internships and career opportunities.', icon: <Briefcase size={28} color="#38a169" />, color: '#f0fdf4', link: '/jobs' },
              { title: 'Webinars', desc: 'Join live AMAs and sessions.', icon: <Video size={28} color="#8b5cf6" />, color: '#f5f3ff', link: '/webinars' },
              { title: 'Leaderboard', desc: 'Track contributors and ranks.', icon: <Award size={28} color="#d97706" />, color: '#fffbeb', link: '/leaderboard' },
            ]
              .filter((item) => !item.authRequired || isLoggedIn)
              .map((item, i) => (
                <Grid size={{ xs: 12, sm: 6, md: isLoggedIn ? 3 : 4 }} key={i}>
                  <motion.div variants={fadeInUp} style={{ height: '100%' }}>
                    <Paper elevation={0} sx={featureCardSx}>
                      <Box sx={{ bgcolor: item.color, width: 64, height: 64, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                        {item.icon}
                      </Box>
                      <Typography variant="h5" fontWeight={800} color="#1a202c" mb={1.5}>
                        {item.title}
                      </Typography>
                      <Typography variant="body1" color="#64748b" mb={4} flexGrow={1} lineHeight={1.6}>
                        {item.desc}
                      </Typography>
                      <Link
                        href={getAuthAwareHref(item.link)}
                        style={{
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: '#0072ff',
                          fontWeight: 700,
                          position: 'relative',
                          width: 'fit-content',
                          paddingBottom: 2,
                        }}
                      >
                        Explore <ChevronRight size={18} style={{ marginLeft: 4 }} />
                        <Box
                          className="explore-underline"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '0%',
                            height: 2,
                            bgcolor: '#0072ff',
                            transition: 'width 0.3s ease',
                            borderRadius: 2,
                          }}
                        />
                      </Link>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
          </Grid>
        </motion.div>
      </Container>

      {/* Top Contributors — skeleton / coming soon */}
      <Container maxWidth="xl" sx={{ mb: 12 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#1a202c">
                Top Contributors
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Leaderboard rankings coming soon
              </Typography>
            </Box>
            <Link href={getAuthAwareHref('/leaderboard')} style={{ textDecoration: 'none', color: '#0072ff', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
              View Leaderboard <ChevronRight size={20} />
            </Link>
          </Box>
          <Grid container spacing={3}>
            {[1, 2, 3].map((rank) => (
              <Grid size={{ xs: 12, md: 4 }} key={rank}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '20px',
                    border: '1px dashed #cbd5e1',
                    bgcolor: '#fafbfc',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2.5}>
                    <Skeleton variant="circular" width={56} height={56} animation="wave" />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="70%" height={28} animation="wave" sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" width="40%" height={20} animation="wave" />
                    </Box>
                    <Chip label="Coming Soon" size="small" sx={{ fontWeight: 600, bgcolor: '#e8f4ff', color: '#0056cc' }} />
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* Notify CTA */}
      <Container maxWidth="xl" sx={{ mb: 12 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={fadeInUp}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: (theme) => theme.custom.cardShadow,
              overflow: 'hidden',
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: 'primary.light',
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-hidden
                  >
                    <Mail size={22} />
                  </Box>
                  <Chip label="Mobile apps coming soon" color="primary" variant="outlined" />
                </Stack>
                <Typography variant="h4" component="h2" fontWeight={800} color="text.primary" gutterBottom>
                  Get notified when MedInternia mobile launches
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
                  We are replacing inactive app download buttons with a waitlist so users can hear when iOS and Android access is ready.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box component="form" onSubmit={handleWaitlistSubmit} noValidate>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      fullWidth
                      required
                      type="email"
                      label="Email address"
                      value={waitlistEmail}
                      onChange={(event) => {
                        setWaitlistEmail(event.target.value);
                        setWaitlistSubmitted(false);
                      }}
                      inputProps={{ 'aria-label': 'Email address for mobile launch notifications' }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      sx={{ px: 4, whiteSpace: 'nowrap' }}
                    >
                      Notify Me
                    </Button>
                  </Stack>
                  {waitlistSubmitted && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      You are on the notify list. We will share updates when mobile access opens.
                    </Alert>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      </Container>

      {/* Why MedInternia */}
      <Container maxWidth="xl" sx={{ mb: 12, overflow: 'hidden' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'center', gap: { xs: 6, lg: 8 } }}>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Box sx={{ width: 40, height: 4, bgcolor: '#0072ff', mb: 3, borderRadius: 2 }} />
              <Typography variant="h3" fontWeight={800} color="#0f172a" mb={1} sx={{ fontSize: { xs: '2.2rem', md: '2.8rem' } }}>
                Why MedInternia?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 520 }}>
                Everything you need to learn, collaborate, and grow — in one platform.
              </Typography>

              <Grid container spacing={3}>
                {[
                  {
                    label: 'Learning',
                    items: [
                      'Case-based learning and analysis',
                      'Peer review and feedback system',
                      'AI-powered suggestions',
                    ],
                  },
                  {
                    label: 'Career & Growth',
                    items: [
                      'Badges and certification achievements',
                      'Job opportunities board',
                      'Leaderboard and advanced search',
                    ],
                  },
                  {
                    label: 'Collaboration',
                    items: [
                      'Webinars and live AMAs',
                      'LinkedIn/GitHub export',
                      'Video conferencing',
                    ],
                  },
                ].map((group) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={group.label}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        height: '100%',
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        bgcolor: '#fff',
                      }}
                    >
                      <Typography
                        variant="overline"
                        fontWeight={800}
                        color="primary.main"
                        sx={{ letterSpacing: '0.08em', display: 'block', mb: 1.5 }}
                      >
                        {group.label}
                      </Typography>
                      <Stack spacing={1.5}>
                        {group.items.map((text) => (
                          <Box key={text} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <CheckCircle2 size={18} color="#fff" fill="#0072ff" style={{ flexShrink: 0, marginTop: 2 }} />
                            <Typography variant="body2" fontWeight={600} color="#1e293b" sx={{ lineHeight: 1.5 }}>
                              {text}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Box sx={{ flex: 1, width: '100%', maxWidth: { lg: 520 } }}>
              <HeroProductPreview />
            </Box>
          </Box>
        </motion.div>
      </Container>

      {/* How It Works */}
      <Container maxWidth="xl" sx={{ mb: { xs: 8, md: 14 } }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <Typography variant="h3" fontWeight={800} color="#0f172a" mb={{ xs: 6, md: 10 }} sx={{ fontSize: { xs: '2.2rem', md: '2.8rem' }, textAlign: 'center' }}>
            How It Works
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' }, justifyContent: 'space-between', gap: { xs: 6, md: 0 } }}>
            {[
              { num: '01', title: 'Sign Up', desc: 'Create your free account and set up your medical profile.', icon: <UserPlus size={26} color="#fff" /> },
              { num: '02', title: 'Learn & Collaborate', desc: 'Join cases, webinars, and discussions to learn and share knowledge.', icon: <Video size={26} color="#fff" /> },
              { num: '03', title: 'Grow Your Career', desc: 'Earn achievements, connect with peers, and find job opportunities.', icon: <Briefcase size={26} color="#fff" /> },
            ].map((step, i) => (
              <React.Fragment key={i}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, width: { xs: '100%', sm: '80%', md: '28%' } }}>
                  <Box
                    sx={{
                      width: 68,
                      height: 68,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 8px 20px rgba(0, 114, 255, 0.25)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.08)',
                        boxShadow: '0 12px 28px rgba(0, 114, 255, 0.35)',
                      },
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Box sx={{ textAlign: 'left', pt: 0.5 }}>
                    <Typography fontWeight={800} color="primary.main" mb={0.5} fontSize="0.95rem">
                      {step.num}
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#0f172a" mb={1}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                      {step.desc}
                    </Typography>
                  </Box>
                </Box>
                {i < 2 && (
                  <Box sx={{ flexGrow: 1, minWidth: 40, height: 30, mt: '34px', mx: 2, display: { xs: 'none', md: 'block' } }}>
                    <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <circle cx="2" cy="15" r="2.5" fill="#0072ff" />
                      <path d="M 5 15 C 30 35, 70 35, 95 15" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
                      <circle cx="98" cy="15" r="2.5" fill="#0072ff" />
                    </svg>
                  </Box>
                )}
              </React.Fragment>
            ))}
          </Box>
        </motion.div>
      </Container>

      {/* Need Help */}
      <Container maxWidth="xl" sx={{ mt: 10, mb: 10 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 5 },
              borderRadius: '24px',
              background: 'linear-gradient(to right, #f0fdf4, #f8fafc)',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
              border: '1px solid #e2e8f0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexDirection: { xs: 'column', sm: 'row' }, textAlign: { xs: 'center', sm: 'left' } }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #34d399, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <HeadphonesIcon size={36} color="#fff" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#0f172a" mb={1}>
                  Need Help or Have Questions?
                </Typography>
                <Typography color="#475569">Reach out to the MedInternia team for support and inquiries.</Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#0072ff',
                borderRadius: '10px',
                px: 5,
                py: 1.5,
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { bgcolor: '#0056cc' },
              }}
              onClick={() => router.push('/contact')}
            >
              Contact Us
            </Button>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}
