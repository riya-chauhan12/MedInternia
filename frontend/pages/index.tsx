import { getAuthToken } from "../utils/api";
import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  motion,
  Variants,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion';

// Temporary JSX intrinsic elements typing for inline SVG usage in this file.
// This prevents "JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists." errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      svg: any;
      path: any;
      circle: any;
    }
  }
}
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
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { getLoginHref, protectedLandingPaths } from '../utils/authRedirect';
import HeroProductPreview from '../components/landing/HeroProductPreview';

// Type-safe font stacks for the hero's clinical/vitals-monitor motif.
// Sora carries the headline, IBM Plex Mono reads like a monitor readout,
// Inter stays as the neutral body voice.
const fontDisplay = "'Sora', 'Inter', sans-serif";
const fontMono = "'IBM Plex Mono', monospace";

// Words the animated hero headline cycles through.
const HERO_HEADLINE_WORDS = [
  'Medical Learning',
  'Clinical Cases',
  'Medical Careers',
  'Healthcare Opportunities',
];

// Deterministic particle field for the hero background (no Math.random so
// server and client render identically and hydration never mismatches).
const HERO_PARTICLES: { top: string; left: string; size: number; duration: number; delay: number }[] = [
  { top: '12%', left: '8%', size: 6, duration: 7, delay: 0 },
  { top: '22%', left: '84%', size: 4, duration: 9, delay: 1.2 },
  { top: '68%', left: '14%', size: 5, duration: 8, delay: 0.6 },
  { top: '78%', left: '70%', size: 7, duration: 10, delay: 2 },
  { top: '40%', left: '92%', size: 4, duration: 6.5, delay: 1.8 },
  { top: '58%', left: '4%', size: 5, duration: 8.5, delay: 0.3 },
  { top: '85%', left: '46%', size: 4, duration: 7.5, delay: 2.4 },
  { top: '6%', left: '55%', size: 5, duration: 9.5, delay: 1 },
  { top: '30%', left: '36%', size: 3, duration: 6, delay: 0.9 },
];

/** A small pulsing "live" dot used across the hero's monitor-style badges. */
function LiveDot({ color = '#00c853', size = 8 }: { color?: string; size?: number }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.6, 1], opacity: [1, 0.35, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0 }}
    />
  );
}

/**
 * Headline word that cycles through a list with a typewriter effect and a
 * blinking cursor. The revealed text is painted with a slowly animated blue
 * gradient so it always reads as "alive" even mid-word.
 */
function TypewriterText({ words }: { words: string[] }) {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [subIndex, setSubIndex] = React.useState(0);
  const [deleting, setDeleting] = React.useState(false);
  const [blink, setBlink] = React.useState(true);

  React.useEffect(() => {
    if (shouldReduceMotion) return;
    const current = words[index];

    if (!deleting && subIndex === current.length) {
      const holdTimeout = setTimeout(() => setDeleting(true), 1500);
      return () => clearTimeout(holdTimeout);
    }

    if (deleting && subIndex === 0) {
      setDeleting(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const typeTimeout = setTimeout(
      () => setSubIndex((prev) => prev + (deleting ? -1 : 1)),
      deleting ? 35 : 65
    );
    return () => clearTimeout(typeTimeout);
  }, [subIndex, deleting, index, words, shouldReduceMotion]);

  React.useEffect(() => {
    const blinkInterval = setInterval(() => setBlink((prev) => !prev), 500);
    return () => clearInterval(blinkInterval);
  }, []);

  const displayText = shouldReduceMotion ? words[0] : words[index].substring(0, subIndex);

  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'baseline' }}>
      <motion.span
        style={{
          backgroundImage: 'linear-gradient(90deg, #0072ff, #00c6ff, #4facfe, #00c6ff, #0072ff)',
          backgroundSize: '300% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          fontFamily: fontDisplay,
        }}
        animate={shouldReduceMotion ? undefined : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      >
        {displayText}
      </motion.span>
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          display: 'inline-block',
          width: '3px',
          ml: '2px',
          alignSelf: 'stretch',
          bgcolor: '#0072ff',
          opacity: blink ? 1 : 0,
          transition: 'opacity 0.1s',
        }}
      />
    </Box>
  );
}

/**
 * Ambient hero backdrop: soft glowing blobs, a faint particle field, a slow
 * horizontal ECG trace, and subtle radial lighting. Kept low-opacity and
 * pointer-events: none so it never competes with the foreground content.
 */
function HeroBackground({
  parallaxX,
  parallaxY,
}: {
  parallaxX: ReturnType<typeof useTransform<number, number>>;
  parallaxY: ReturnType<typeof useTransform<number, number>>;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* subtle radial lighting */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(120% 90% at 15% 10%, rgba(0,114,255,0.07), transparent 55%)',
        }}
      />

      {/* glowing blurred circles */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-8%',
          left: '-6%',
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,114,255,0.20), transparent 70%)',
          filter: 'blur(30px)',
          x: parallaxX,
          y: parallaxY,
        }}
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          bottom: '-12%',
          right: '-8%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,198,255,0.16), transparent 70%)',
          filter: 'blur(36px)',
          x: parallaxX,
          y: parallaxY,
        }}
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.06, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />

      {/* floating particles */}
      {HERO_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: '#0072ff',
          }}
          animate={
            shouldReduceMotion
              ? { opacity: 0.15 }
              : { y: [0, -18, 0], opacity: [0.08, 0.28, 0.08] }
          }
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}

      {/* slow-moving ECG trace */}
      {!shouldReduceMotion && (
        <motion.svg
          width="360"
          height="60"
          viewBox="0 0 360 60"
          style={{ position: 'absolute', top: '42%', opacity: 0.09 }}
          animate={{ x: ['-20%', '120%'] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        >
          <path
            d="M0 30 H90 L104 8 L122 52 L138 30 H210 L222 14 L236 46 L250 30 H360"
            stroke="#0072ff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.svg>
      )}
    </Box>
  );
}

/** A glassmorphic pill that floats gently, used to frame the hero video with proof points. */
function FloatingCard({
  icon,
  eyebrow,
  label,
  accent,
  sx,
  floatDelay = 0,
  parallaxX,
  parallaxY,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  label: string;
  accent: string;
  sx: object;
  floatDelay?: number;
  parallaxX: ReturnType<typeof useTransform<number, number>>;
  parallaxY: ReturnType<typeof useTransform<number, number>>;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      style={{ position: 'absolute', zIndex: 3, x: parallaxX, y: parallaxY, ...sx }}
      initial={{ opacity: 0, y: 12 }}
      animate={
        shouldReduceMotion
          ? { opacity: 1, y: 0 }
          : { opacity: 1, y: [0, -10, 0] }
      }
      transition={{
        opacity: { duration: 0.5, delay: floatDelay },
        y: shouldReduceMotion
          ? { duration: 0.5, delay: floatDelay }
          : { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: floatDelay },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          py: 1.25,
          px: 2,
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          bgcolor: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderLeft: `3px solid ${accent}`,
          boxShadow: '0 12px 28px rgba(10,37,64,0.14)',
        }}
      >
        {icon}
        <Box>
          <Typography
            sx={{
              fontFamily: fontMono,
              fontSize: '0.62rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#64748b',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </Typography>
          <Typography variant="body2" fontWeight={700} color="#0a2540" sx={{ whiteSpace: 'nowrap' }}>
            {label}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
}

/** Primary CTA: animated glow, hover lift, click ripple, and a slow ambient pulse. */
function GlowRippleButton({
  children,
  onClick,
  sx,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  sx?: object;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [ripples, setRipples] = React.useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
    onClick?.();
  };

  return (
    <motion.div
      animate={
        shouldReduceMotion
          ? undefined
          : {
              boxShadow: [
                '0 10px 24px rgba(0,114,255,0.28)',
                '0 16px 40px rgba(0,114,255,0.48)',
                '0 10px 24px rgba(0,114,255,0.28)',
              ],
              scale: [1, 1.02, 1],
            }
      }
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
      style={{ borderRadius: '14px', display: 'inline-block' }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
    >
      <Button
        variant="contained"
        size="large"
        onClick={handleClick}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          bgcolor: '#0072ff',
          px: 4.5,
          py: 1.4,
          borderRadius: '14px',
          fontWeight: 700,
          textTransform: 'none',
          fontSize: '1rem',
          '&:hover': { bgcolor: '#005bd6' },
          ...sx,
        }}
      >
        {children}
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ width: 0, height: 0, opacity: 0.45 }}
            animate={{ width: 260, height: 260, opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y,
              x: '-50%',
              y: '-50%',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              pointerEvents: 'none',
            }}
          />
        ))}
      </Button>
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [waitlistEmail, setWaitlistEmail] = React.useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = React.useState(false);

  // Needed by the feature cards below, and also by the hero mouse-parallax setup.
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
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

  // ---- Hero mouse-parallax setup ----
  // Tracks pointer position within the hero section (normalized -0.5..0.5)
  // and drives a handful of differently-weighted transforms so background,
  // video, and floating cards each drift a slightly different amount.
  const heroRef = React.useRef<HTMLDivElement | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 0.4 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 0.4 });

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleHeroMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const bgParallaxX = useTransform(springX, [-0.5, 0.5], [-18, 18]);
  const bgParallaxY = useTransform(springY, [-0.5, 0.5], [-18, 18]);
  const textParallaxX = useTransform(springX, [-0.5, 0.5], [-8, 8]);
  const textParallaxY = useTransform(springY, [-0.5, 0.5], [-8, 8]);
  const videoParallaxX = useTransform(springX, [-0.5, 0.5], [-12, 12]);
  const videoParallaxY = useTransform(springY, [-0.5, 0.5], [-12, 12]);
  const cardParallaxX = useTransform(springX, [-0.5, 0.5], [-16, 16]);
  const cardParallaxY = useTransform(springY, [-0.5, 0.5], [-16, 16]);
  const cardParallaxXInv = useTransform(springX, [-0.5, 0.5], [16, -16]);
  const cardParallaxYInv = useTransform(springY, [-0.5, 0.5], [16, -16]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fbff', overflowX: 'hidden', maxWidth: '100%' }}>
      <Head>
        <title>MedInternia - Your Gateway to Medical Learning</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Landing header / navbar layout - dynamically hidden if active session is detected */}
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          px: { xs: 2, md: 6 },
          py: 2,
          display: isLoggedIn ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          zIndex: 1100,
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
          <Typography variant="h6" fontWeight={800} color="#1a202c" ml={1}>
            MedInternia
          </Typography>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
          {navItems.map((item) => (
            <Link key={item} href={getAuthAwareHref(`/${item.toLowerCase()}`)} passHref legacyBehavior>
              <Typography
                component="a"
                fontWeight={600}
                color="#4a5568"
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
            sx={{ display: { xs: 'inline-flex', md: 'none' }, color: '#1a202c' }}
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
        </Box>
      </Box>

      {/* Layout Spacer Box - only active if not logged in to clear fixed header bounds */}
      {!isLoggedIn && <Box sx={{ height: 72 }} />}

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
      <Box
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        sx={{ position: 'relative', overflow: 'hidden' }}
      >
        <HeroBackground parallaxX={bgParallaxX} parallaxY={bgParallaxY} />

        <Container maxWidth="xl" sx={{ pt: { xs: 6, md: 12 }, pb: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} aria-label="Hero contents layout layout container grid" alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                {/* Eyebrow: slides in from the left, sets the "vitals monitor" tone */}
                <motion.div
                  initial={{ opacity: 0, x: -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 3 }}>
                    <LiveDot />
                    <Typography
                      sx={{
                        fontFamily: fontMono,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        color: '#0072ff',
                        textTransform: 'uppercase',
                      }}
                    >
                      Medical Learning Network
                    </Typography>
                  </Stack>
                </motion.div>

                <motion.div style={{ x: textParallaxX, y: textParallaxY }} variants={fadeInUp}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontFamily: fontDisplay,
                      fontWeight: 800,
                      fontSize: { xs: '2.4rem', sm: '3.2rem', md: '3.7rem' },
                      color: '#0a2540',
                      lineHeight: 1.14,
                      letterSpacing: '-0.01em',
                      mb: 3,
                      minHeight: { xs: '7.5rem', sm: '8.5rem', md: '8.8rem' },
                    }}
                  >
                    Your gateway to
                    <br />
                    <TypewriterText words={HERO_HEADLINE_WORDS} />
                  </Typography>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Typography variant="body1" sx={{ color: '#4a5568', fontSize: '1.1rem', mb: 4, maxWidth: 480, lineHeight: 1.65 }}>
                    Join a community of learners and professionals collaborating to shape the future of healthcare.
                  </Typography>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 5 }}>
                    <GlowRippleButton onClick={() => router.push('/auth/register')}>Join now</GlowRippleButton>
                    <Button
                      variant="text"
                      size="large"
                      endIcon={
                        <Box
                          className="hero-arrow"
                          sx={{ display: 'inline-flex', transition: 'transform 0.25s ease' }}
                        >
                          <ChevronRight size={18} />
                        </Box>
                      }
                      sx={{
                        color: '#0a2540',
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '1rem',
                        px: 2,
                        '&:hover': { bgcolor: 'transparent', color: '#0072ff' },
                        '&:hover .hero-arrow': { transform: 'translateX(4px)' },
                      }}
                      onClick={() => router.push('/auth/login')}
                    >
                      Log in
                    </Button>
                  </Box>
                </motion.div>

                {/* Community social proof — slides in from the left */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.75, ease: 'easeOut' }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        bgcolor: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Activity size={19} color="#0072ff" aria-hidden />
                    </Box>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Users size={15} color="#0072ff" aria-hidden />
                        <Typography fontWeight={700} color="#0a2540" fontSize="0.92rem">
                          Growing community
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        sx={{ color: '#718096', fontFamily: fontMono, letterSpacing: '0.02em', fontSize: '0.72rem' }}
                      >
                        Doctors · interns · students
                      </Typography>
                    </Box>
                  </Stack>
                </motion.div>
              </motion.div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
              >
                <Box sx={{ position: 'relative', px: { xs: 1, sm: 2 }, py: 2 }}>
                  {/* Clinical chart-paper backdrop, replaces the generic blurred blob */}
                  <Box
                    aria-hidden="true"
                    sx={{
                      position: 'absolute',
                      inset: { xs: 18, sm: 28 },
                      borderRadius: '32px',
                      backgroundImage:
                        'linear-gradient(rgba(0,114,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,114,255,0.08) 1px, transparent 1px)',
                      backgroundSize: '22px 22px',
                      zIndex: 0,
                    }}
                  />

                  {/* Gradient-bordered glass container with an animated light sweep */}
                  <motion.div
                    style={{ x: videoParallaxX, y: videoParallaxY }}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.015, rotate: 0.4 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        maxWidth: 540,
                        mx: 'auto',
                        p: '2px',
                        borderRadius: '30px',
                        background: 'linear-gradient(135deg, rgba(0,114,255,0.65), rgba(0,198,255,0.35), rgba(79,172,254,0.65))',
                        boxShadow: '0 24px 56px rgba(10, 37, 64, 0.2)',
                        transition: 'box-shadow 0.35s ease',
                        '&:hover': { boxShadow: '0 30px 70px rgba(0,114,255,0.34)' },
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          borderRadius: '28px',
                          overflow: 'hidden',
                          bgcolor: '#000',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                        }}
                      >
                        <video width="100%" autoPlay loop muted playsInline style={{ display: 'block' }}>
                          <source src="/anushka_video.mp4" type="video/mp4" />
                        </video>

                        {!shouldReduceMotion && (
                          <motion.div
                            aria-hidden="true"
                            initial={{ x: '-150%' }}
                            animate={{ x: '150%' }}
                            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '40%',
                              height: '100%',
                              background:
                                'linear-gradient(105deg, transparent, rgba(255,255,255,0.22), transparent)',
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </motion.div>

                  <FloatingCard
                    icon={<LiveDot />}
                    eyebrow="Live Now"
                    label="Expert AMA sessions"
                    accent="#00c853"
                    floatDelay={0.7}
                    parallaxX={cardParallaxX}
                    parallaxY={cardParallaxY}
                    sx={{ top: -10, right: 16, display: { xs: 'none', sm: 'block' } }}
                  />

                  <FloatingCard
                    icon={
                      <Box sx={{ bgcolor: '#eff6ff', p: 1, borderRadius: '10px', display: 'flex' }}>
                        <FolderOpen size={20} color="#0072ff" />
                      </Box>
                    }
                    eyebrow="Case Library"
                    label="Peer-reviewed cases"
                    accent="#0072ff"
                    floatDelay={0.9}
                    parallaxX={cardParallaxXInv}
                    parallaxY={cardParallaxYInv}
                    sx={{ bottom: -10, left: 16 }}
                  />

                  <FloatingCard
                    icon={
                      <Box sx={{ bgcolor: '#f0fdf4', p: 1, borderRadius: '10px', display: 'flex' }}>
                        <ShieldCheck size={20} color="#16a34a" />
                      </Box>
                    }
                    eyebrow="Verified"
                    label="Trusted community"
                    accent="#16a34a"
                    floatDelay={1.3}
                    parallaxX={cardParallaxXInv}
                    parallaxY={cardParallaxY}
                    sx={{ top: '38%', right: -18, display: { xs: 'none', md: 'block' } }}
                  />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

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
                  <motion.div
                    variants={fadeInUp}
                    style={{ height: '100%' }}
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : { y: -10, scale: 1.035, transition: { duration: 0.25, ease: 'easeOut' } }
                    }
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 4,
                        borderRadius: '24px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: '#fff',
                        border: '1px solid #e2e8f0',
                        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                        '&:hover': {
                          borderColor: '#0072ff',
                          boxShadow: '0 20px 45px rgba(0, 114, 255, 0.22)',
                          '& .explore-underline': { width: '100%' },
                          '& .explore-arrow': { transform: shouldReduceMotion ? 'none' : 'translateX(6px)' },
                        },
                      }}
                    >
                      <motion.div
                        className="feature-icon-box"
                        style={{
                          backgroundColor: item.color,
                          width: 64,
                          height: 64,
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 24,
                        }}
                        whileHover={
                          shouldReduceMotion
                            ? undefined
                            : {
                                rotate: [0, -12, 10, -6, 0],
                                scale: 1.12,
                                transition: { duration: 0.55, ease: 'easeInOut' },
                              }
                        }
                      >
                        {item.icon}
                      </motion.div>

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
                        Explore <ChevronRight className="explore-arrow" size={18} style={{ marginLeft: 4, transition: 'transform 0.25s ease' }} />
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