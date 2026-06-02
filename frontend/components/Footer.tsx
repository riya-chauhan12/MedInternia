// GSSoC: Redesigned Footer component to match MedInternia design
import React from 'react';
import Link from 'next/link';
import { Linkedin, Twitter, Instagram, Mail, Send } from 'lucide-react';
import { Box, Typography, Stack, Divider, IconButton, InputBase, Paper } from '@mui/material';
import { getLoginHref, protectedLandingPaths } from '../utils/authRedirect';

const quickLinks = [
  { label: 'Cases', href: '/cases' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Webinars', href: '/webinars' },
  { label: 'Contact', href: '/contact' },
];

const resourcesLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'FAQs', href: '/faq' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export default function Footer() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsLoggedIn(Boolean(token));
  }, []);

  const getAuthAwareHref = (path: string) =>
    !isLoggedIn && protectedLandingPaths.includes(path) ? getLoginHref(path) : path;

  return (
    <Box
      component="footer"
      role="contentinfo"
      aria-label="Site footer"
      sx={{
        backgroundColor: '#0f172a', // Dark navy
        color: '#fff',
        pt: { xs: 6, md: 8 },
        pb: { xs: 4, md: 4 },
        px: { xs: 3, md: 10 },
        mt: 'auto',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={6}
        justifyContent="space-between"
        alignItems="flex-start"
      >
        {/* Brand & Socials */}
        <Box sx={{ maxWidth: 300 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight={900} sx={{ color: '#2193b0', letterSpacing: 0.5 }}>
              MedInternia
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.7, lineHeight: 1.8, mb: 3, fontSize: '0.9rem' }}>
            Your gateway to medical learning, peer collaboration, career opportunities, and live webinars.
          </Typography>
          
          <Stack direction="row" spacing={1.5}>
            <IconButton
              aria-label="LinkedIn"
              component="a"
              href="https://linkedin.com/company/medinternia"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', '&:hover': { background: 'rgba(255,255,255,0.2)' }, p: 1 }}
            >
              <Linkedin size={18} />
            </IconButton>
            <IconButton
              aria-label="Twitter"
              component="a"
              href="https://twitter.com/medinternia"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', '&:hover': { background: 'rgba(255,255,255,0.2)' }, p: 1 }}
            >
              <Twitter size={18} />
            </IconButton>
            <IconButton
              aria-label="Instagram"
              component="a"
              href="https://instagram.com/medinternia"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', '&:hover': { background: 'rgba(255,255,255,0.2)' }, p: 1 }}
            >
              <Instagram size={18} />
            </IconButton>
            <IconButton
              aria-label="Email"
              component="a"
              href="mailto:medinternia@gmail.com"
              sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', '&:hover': { background: 'rgba(255,255,255,0.2)' }, p: 1 }}
            >
              <Mail size={18} />
            </IconButton>
          </Stack>
        </Box>

        {/* Quick Links */}
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ mb: 3 }}
          >
            Quick Links
          </Typography>
          <Stack spacing={2}>
            {quickLinks.map((link) => (
              <Link key={link.href} href={getAuthAwareHref(link.href)} passHref legacyBehavior>
                <Typography
                  component="a"
                  variant="body2"
                  sx={{
                    color: '#fff',
                    opacity: 0.7,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem',
                    '&:hover': { opacity: 1, textDecoration: 'none', borderBottom: 'none !important' },
                  }}
                >
                  {link.label}
                </Typography>
              </Link>
            ))}
          </Stack>
        </Box>

        {/* Resources */}
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ mb: 3 }}
          >
            Resources
          </Typography>
          <Stack spacing={2}>
            {resourcesLinks.map((link) => (
              <Link key={link.href} href={link.href} passHref legacyBehavior>
                <Typography
                  component="a"
                  variant="body2"
                  sx={{
                    color: '#fff',
                    opacity: 0.7,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem',
                    '&:hover': { opacity: 1, textDecoration: 'none', borderBottom: 'none !important' },
                  }}
                >
                  {link.label}
                </Typography>
              </Link>
            ))}
          </Stack>
        </Box>

        {/* Stay Connected */}
        <Box sx={{ maxWidth: 300 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ mb: 3 }}
          >
            Stay Connected
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7, mb: 2, fontSize: '0.9rem' }}>
            Subscribe to our newsletter
          </Typography>
          <Paper
            component="form"
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#1e293b',
              borderRadius: 2,
              border: '1px solid #334155'
            }}
          >
            <InputBase
              sx={{ ml: 1, flex: 1, color: '#fff', fontSize: '0.9rem', '& input::placeholder': { color: '#94a3b8', opacity: 1 } }}
              placeholder="Enter your email"
              inputProps={{ 'aria-label': 'enter your email' }}
            />
            <IconButton type="button" sx={{ p: '8px', color: '#fff', backgroundColor: '#3b82f6', borderRadius: 1, '&:hover': { backgroundColor: '#2563eb' } }} aria-label="subscribe">
              <Send size={18} />
            </IconButton>
          </Paper>
        </Box>
      </Stack>

      <Divider sx={{ mt: 8, mb: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

      <Typography variant="body2" align="center" sx={{ opacity: 0.6, fontSize: '0.85rem' }}>
        © {new Date().getFullYear()} MedInternia. All rights reserved.
      </Typography>
    </Box>
  );
}
