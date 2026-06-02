import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, Variants } from 'framer-motion';
import { Box, Button, Typography, Paper, Stack, Container, Grid, IconButton } from '@mui/material';
import { Search, PlayCircle, FolderOpen, Briefcase, Video, Award, ChevronRight, CheckCircle2, HeadphonesIcon, UserPlus } from 'lucide-react';
import { getLoginHref, protectedLandingPaths } from '../utils/authRedirect';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsLoggedIn(!!token);
  }, []);

  const getAuthAwareHref = (path: string) =>
    !isLoggedIn && protectedLandingPaths.includes(path) ? getLoginHref(path) : path;

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fbff', fontFamily: '"Inter", sans-serif', overflowX: 'hidden' }}>
      <Head>
        <title>MedInternia - Your Gateway to Medical Learning</title>
      </Head>

      {/* Header specific to Landing Page */}
      <Box sx={{ px: { xs: 2, md: 6 }, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#fff', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => router.push('/')}>
          <Image src="/med-internia-logo.jpg" alt="MedInternia Logo" width={36} height={36} style={{ borderRadius: '50%' }} />
          <Typography variant="h6" fontWeight={800} color="#1a202c" ml={1}>MedInternia</Typography>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
          {(isLoggedIn ? ['Cases', 'Jobs', 'Webinars', 'Leaderboard', 'About'] : ['Jobs', 'Webinars', 'Leaderboard', 'About']).map((item) => (
            <Link key={item} href={getAuthAwareHref(`/${item.toLowerCase()}`)} passHref legacyBehavior>
              <Typography component="a" fontWeight={600} color="#4a5568" sx={{ textDecoration: 'none', transition: 'all 0.2s', '&:hover': { color: '#0072ff', borderBottom: 'none !important', textDecoration: 'none' } }}>{item}</Typography>
            </Link>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <IconButton size="small"><Search size={20} color="#4a5568" /></IconButton>
          <Button variant="text" sx={{ color: '#0072ff', fontWeight: 700, display: { xs: 'none', sm: 'inline-flex' }, '&:hover': { bgcolor: 'rgba(0,114,255,0.08)' } }} onClick={() => router.push('/auth/login')}>Log in</Button>
          <Button variant="contained" sx={{ bgcolor: '#0072ff', color: '#fff', borderRadius: '24px', px: { xs: 2, sm: 3 }, fontWeight: 700, textTransform: 'none', boxShadow: '0 4px 14px rgba(0,114,255,0.2)', '&:hover': { bgcolor: '#005bb5', boxShadow: '0 6px 20px rgba(0,114,255,0.3)', transform: 'translateY(-1px)' }, transition: 'all 0.2s ease-in-out' }} onClick={() => router.push('/auth/register')}>Sign Up</Button>
        </Box>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="xl" sx={{ pt: { xs: 6, md: 12 }, pb: { xs: 8, md: 12 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Typography variant="h1" fontWeight={800} sx={{ fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' }, color: '#1a202c', lineHeight: 1.15, mb: 3 }}>
                Your Gateway to <br/>
                <Box component="span" sx={{ color: '#00c6ff', background: '-webkit-linear-gradient(45deg, #0072ff, #00c6ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Medical Learning,<br/>Jobs & Opportunities
                </Box>
              </Typography>
              <Typography variant="body1" sx={{ color: '#4a5568', fontSize: '1.15rem', mb: 4, maxWidth: 500, lineHeight: 1.6 }}>
                Join a community of learners and professionals collaborating to shape the future of healthcare.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 5 }}>
                <Button variant="contained" size="large" sx={{ bgcolor: '#0072ff', color: '#fff', px: 5, py: 1.5, borderRadius: '30px', fontWeight: 800, fontSize: '1.1rem', whiteSpace: 'nowrap', boxShadow: '0 8px 25px rgba(0,114,255,0.3)', transition: 'all 0.3s ease-in-out', '&:hover': { bgcolor: '#005bb5 !important', color: '#fff !important', transform: 'translateY(-2px)', boxShadow: '0 12px 30px rgba(0,114,255,0.4)' } }} onClick={() => router.push('/auth/register')}>
                  Join Now
                </Button>
                <Button variant="outlined" size="large" sx={{ color: '#0072ff', borderColor: '#0072ff', borderWidth: 2, px: 5, py: 1.5, borderRadius: '30px', fontWeight: 800, fontSize: '1.1rem', whiteSpace: 'nowrap', bgcolor: 'rgba(255,255,255,0.9)', transition: 'all 0.3s ease-in-out', '&:hover': { bgcolor: '#eff6ff !important', color: '#005bb5 !important', borderColor: '#005bb5 !important', borderWidth: 2, transform: 'translateY(-2px)' } }} onClick={() => router.push('/auth/login')}>
                  Log In
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex' }}>
                  {[1, 2, 3, 4].map((i) => (
                    <Box key={i} sx={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #fff', ml: i === 1 ? 0 : -2, bgcolor: '#e2e8f0', overflow: 'hidden', zIndex: 5 - i, position: 'relative', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)', zIndex: 10 } }}>
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  ))}
                </Box>
                <Box>
                  <Typography fontWeight={800} color="#1a202c" fontSize="1.1rem">10K+</Typography>
                  <Typography variant="caption" color="#718096" fontSize="0.9rem">Active Members</Typography>
                </Box>
              </Box>
            </motion.div>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}>
              <Box sx={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                {/* Decorative blob */}
                <Box sx={{ position: 'absolute', top: -40, right: -40, width: '100%', height: '100%', bgcolor: '#e0f2fe', borderRadius: '50%', zIndex: 0, filter: 'blur(60px)', opacity: 0.8 }} />
                
                <Box sx={{ position: 'relative', zIndex: 1, borderRadius: '32px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.12)', border: '8px solid #fff', width: '100%', maxWidth: 540, bgcolor: '#000', transition: 'transform 0.3s ease-in-out', '&:hover': { transform: 'scale(1.01)' } }}>
                  <video width="100%" autoPlay loop muted playsInline style={{ display: 'block' }}>
                    <source src="/anushka_video.mp4" type="video/mp4" />
                  </video>
                </Box>
                
                {/* Floating Badge 1 */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
                  <Paper sx={{ position: 'absolute', top: 30, right: { xs: -10, md: -30 }, p: 2.5, borderRadius: '20px', zIndex: 2, boxShadow: '0 12px 30px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#48bb78', boxShadow: '0 0 0 4px #c6f6d5', animation: 'pulse 2s infinite' }} />
                    <Box>
                      <Typography variant="caption" color="#718096" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Live Webinar</Typography>
                      <Typography variant="body1" fontWeight={800} color="#1a202c">Cardiology Advances</Typography>
                      <Typography variant="caption" color="#a0aec0" fontWeight={500}>Today at 7:00 PM</Typography>
                    </Box>
                  </Paper>
                </motion.div>

                {/* Floating Badge 2 */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.5 }}>
                  <Paper sx={{ position: 'absolute', bottom: { xs: 0, md: 20 }, left: { xs: 10, md: -20 }, p: 2.5, borderRadius: '20px', zIndex: 2, boxShadow: '0 12px 30px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <Box sx={{ bgcolor: '#eff6ff', p: 1.5, borderRadius: '14px' }}>
                      <FolderOpen size={28} color="#0072ff" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="#718096" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Weekly Cases</Typography>
                      <Typography variant="h5" fontWeight={800} color="#1a202c">25+</Typography>
                      <Typography variant="caption" color="#a0aec0" fontWeight={500}>Updated</Typography>
                    </Box>
                  </Paper>
                </motion.div>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Categories Cards */}
      <Container maxWidth="xl" sx={{ mb: 12 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}>
          <Grid container spacing={3}>
            {[
              { title: 'Cases', desc: 'Explore and analyze real medical cases.', icon: <FolderOpen size={28} color="#0072ff" />, color: '#eff6ff', link: '/cases', authRequired: true },
              { title: 'Jobs', desc: 'Find internships and career opportunities.', icon: <Briefcase size={28} color="#38a169" />, color: '#f0fdf4', link: '/jobs' },
              { title: 'Webinars', desc: 'Join live AMAs and sessions.', icon: <Video size={28} color="#8b5cf6" />, color: '#f5f3ff', link: '/webinars' },
              { title: 'Leaderboard', desc: 'Track contributors and ranks.', icon: <Award size={28} color="#d97706" />, color: '#fffbeb', link: '/leaderboard' },
            ].filter((item) => !item.authRequired || isLoggedIn).map((item, i) => (
              <Grid size={{ xs: 12, sm: 6, md: isLoggedIn ? 3 : 4 }} key={i}>
                <motion.div variants={fadeInUp} style={{ height: '100%' }}>
                  <Paper sx={{ p: 4, borderRadius: '24px', height: '100%', transition: 'all 0.3s ease-in-out', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 15px 35px rgba(0,0,0,0.06)', '& .explore-underline': { width: '100%' } }, display: 'flex', flexDirection: 'column', bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.04)' }} elevation={0}>
                    <Box sx={{ bgcolor: item.color, width: 64, height: 64, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                      {item.icon}
                    </Box>
                    <Typography variant="h5" fontWeight={800} color="#1a202c" mb={1.5}>{item.title}</Typography>
                    <Typography variant="body1" color="#64748b" mb={4} flexGrow={1} lineHeight={1.6}>{item.desc}</Typography>
                    <Link href={getAuthAwareHref(item.link)} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', color: '#0072ff', fontWeight: 700, position: 'relative', width: 'fit-content', paddingBottom: '2px' }}>
                      Explore <ChevronRight size={18} style={{ marginLeft: 4 }} />
                      <Box className="explore-underline" sx={{ position: 'absolute', bottom: 0, left: 0, width: '0%', height: '2px', bgcolor: '#0072ff', transition: 'width 0.3s ease-in-out', borderRadius: '2px' }} />
                    </Link>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* Top Contributors */}
      <Container maxWidth="xl" sx={{ mb: 12 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
            <Typography variant="h4" fontWeight={800} color="#1a202c">Top Contributors</Typography>
            <Link href={getAuthAwareHref("/leaderboard")} style={{ textDecoration: 'none', color: '#0072ff', fontWeight: 700, display: 'inline-flex', alignItems: 'center', position: 'relative', paddingBottom: '2px', '&:hover .top-underline': { width: '100%' } } as any}>
              View Leaderboard <ChevronRight size={20} />
              <Box className="top-underline" sx={{ position: 'absolute', bottom: 0, left: 0, width: '0%', height: '2px', bgcolor: '#0072ff', transition: 'width 0.3s ease-in-out', borderRadius: '2px' }} />
            </Link>
          </Box>
          <Grid container spacing={3}>
            {[
              { name: 'Dr. Smith', points: 320, medal: '#fbbf24', img: 1 },
              { name: 'Dr. Lee', points: 290, medal: '#94a3b8', img: 2 },
              { name: 'Dr. Patel', points: 270, medal: '#f59e0b', img: 3 },
            ].map((c, i) => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <Paper sx={{ p: 3, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(0,0,0,0.05)', transition: 'all 0.2s ease-in-out', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' } }} elevation={0}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <img src={`https://i.pravatar.cc/100?img=${c.img + 20}`} alt={c.name} style={{ width: 60, height: 60, borderRadius: '50%' }} />
                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#1a202c">{c.name}</Typography>
                      <Typography variant="body1" color="#64748b" fontWeight={600}>{c.points} pts</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ bgcolor: `${c.medal}15`, p: 1.5, borderRadius: '50%' }}>
                    <Award size={32} color={c.medal} fill={c.medal} />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* Why MedInternia */}
      <Container maxWidth="xl" sx={{ mb: 12 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: { xs: 6, lg: 8 } }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 45%', lg: '0 0 40%' } }}>
              <Box sx={{ width: 40, height: 4, bgcolor: '#2563eb', mb: 3, borderRadius: 2 }} />
              <Typography variant="h3" fontWeight={800} color="#0f172a" mb={4} sx={{ fontSize: { xs: '2.2rem', md: '2.8rem' } }}>
                Why MedInternia?
              </Typography>
              <Stack spacing={2.5}>
                {[
                  'Case-based learning and analysis',
                  'Peer review and feedback system',
                  'Badges and certification achievements',
                  'Job opportunities board',
                  'Webinars and live AMAs',
                  'AI-powered suggestions',
                  'Leaderboard and advanced search',
                  'LinkedIn/GitHub export, video conferencing',
                ].map((text, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircle2 size={24} color="#fff" fill="#3b82f6" style={{ flexShrink: 0 }} />
                    <Typography variant="body1" fontWeight={600} color="#1e293b" sx={{ fontSize: '1.05rem' }}>
                      {text}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 50%', lg: '0 0 55%' }, width: '100%', display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, bgcolor: '#fff' }}>
              <img 
                src="/dashboard-mockup.png" 
                alt="MedInternia Dashboard Mockup" 
                style={{ width: '100%', maxWidth: '800px', height: 'auto', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.08) brightness(1.03)' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<div style="padding: 40px; background: #f8fafc; border-radius: 24px; border: 2px dashed #cbd5e1; color: #64748b; text-align: center; width: 100%; font-family: sans-serif;"><b>Image Placeholder</b><br/>Please save the provided design image as <code>public/dashboard-mockup.png</code></div>'; }}
              />
            </Box>
          </Box>
        </motion.div>
      </Container>

      {/* How It Works - REDESIGNED TO MATCH IMAGE */}
      <Container maxWidth="xl" sx={{ mb: { xs: 8, md: 14 } }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <Typography variant="h3" fontWeight={800} color="#0f172a" mb={{ xs: 6, md: 10 }} sx={{ fontSize: { xs: '2.2rem', md: '2.8rem' }, textAlign: 'center' }}>How It Works</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' }, justifyContent: 'space-between', gap: { xs: 6, md: 0 } }}>
            {[
              { num: '01', title: 'Sign Up', desc: 'Create your free account and set up your medical profile.', icon: <UserPlus size={28} color="#fff" />, color: '#2563eb', bg: 'linear-gradient(135deg, #60a5fa, #2563eb)', shadow: '0 8px 20px rgba(37, 99, 235, 0.3)' },
              { num: '02', title: 'Learn & Collaborate', desc: 'Join cases, webinars, and discussions to learn and share knowledge.', icon: <Video size={28} color="#7c3aed" />, color: '#2563eb', bg: '#ede9fe', shadow: 'none' },
              { num: '03', title: 'Grow Your Career', desc: 'Earn achievements, connect with peers, and find job opportunities.', icon: <Briefcase size={28} color="#2563eb" />, color: '#2563eb', bg: '#e0e7ff', shadow: 'none' },
            ].map((step, i) => (
              <React.Fragment key={i}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, width: { xs: '100%', sm: '80%', md: '28%' } }}>
                  <Box className="icon-box" sx={{ width: 68, height: 68, borderRadius: '50%', background: step.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: step.shadow, transition: 'transform 0.3s ease', '&:hover': { transform: 'scale(1.08)' } }}>
                    {step.icon}
                  </Box>
                  <Box sx={{ textAlign: 'left', pt: 0.5 }}>
                    <Typography fontWeight={800} color={step.color} mb={0.5} fontSize="0.95rem">{step.num}</Typography>
                    <Typography variant="h6" fontWeight={800} color="#0f172a" mb={1}>{step.title}</Typography>
                    <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6, fontSize: '0.95rem' }}>{step.desc}</Typography>
                  </Box>
                </Box>
                
                {/* Dynamic Connecting Line */}
                {i < 2 && (
                  <Box sx={{ flexGrow: 1, minWidth: '40px', height: '30px', mt: '34px', mx: 2, display: { xs: 'none', md: 'block' } }}>
                    <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <circle cx="2" cy="15" r="2.5" fill="#2563eb" />
                      <path d="M 5 15 C 30 35, 70 35, 95 15" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
                      <circle cx="98" cy="15" r="2.5" fill="#2563eb" />
                    </svg>
                  </Box>
                )}
              </React.Fragment>
            ))}
          </Box>
        </motion.div>
      </Container>

      {/* Need Help Banner */}
      <Container maxWidth="xl" sx={{ mt: 10, mb: 10 }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <Paper sx={{ p: { xs: 4, md: 5 }, borderRadius: '24px', background: 'linear-gradient(to right, #f0fdf4, #f8fafc)', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexDirection: { xs: 'column', sm: 'row' }, textAlign: { xs: 'center', sm: 'left' } }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #34d399, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 25px rgba(6, 182, 212, 0.3)' }}>
                <HeadphonesIcon size={36} color="#fff" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#0f172a" mb={1}>Need Help or Have Questions?</Typography>
                <Typography color="#475569" fontSize="1rem">Reach out to the MedInternia team for support and inquiries.</Typography>
              </Box>
            </Box>
            <Button variant="contained" sx={{ bgcolor: '#2563eb', color: '#fff', borderRadius: '8px', px: 5, py: 1.5, fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'nowrap', textTransform: 'none', boxShadow: '0 4px 14px rgba(37,99,235,0.2)', '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 6px 20px rgba(37,99,235,0.3)' }, transition: 'all 0.2s ease-in-out' }} onClick={() => router.push('/contact')}>
              Contact Us
            </Button>
          </Paper>
        </motion.div>
      </Container>
      
      {/* Global styles for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(72, 187, 120, 0); }
          100% { box-shadow: 0 0 0 0 rgba(72, 187, 120, 0); }
        }
      `}} />
    </Box>
  );
}
