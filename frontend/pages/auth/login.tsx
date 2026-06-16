import { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box, Alert, Paper, Divider, IconButton, InputAdornment } from '@mui/material';
import { useState } from 'react';
// GSSoC: Added CircularProgress for loading state
import { Typography, TextField, Button, Box, Alert, Paper, Divider, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import Link from 'next/link';
import api from '../../utils/api';
import { useRouter } from 'next/router';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { getSafeRedirectPath } from '../../utils/authRedirect';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // GSSoC: Loading state for submit button
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSuccess = async (response: any) => {
    try {
      setError('');
      const res = await api.post('/auth/google', { credential: response.credential });
      const token = res.data?.data?.token;
      const user = res.data?.data?.user;
      const role = user?.role || user?.userType || '';
      const userId = user?._id || user?.id || '';
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId);
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google authentication failed');
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      const google = (window as any).google;
      if (google && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
        });
        google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: 336,
            text: 'continue_with',
            shape: 'rectangular',
          }
        );
      }
    };

    const interval = setInterval(() => {
      if ((window as any).google) {
        initializeGoogleSignIn();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // GSSoC: Show loading spinner while login request is in-flight
    setLoading(true);
    try {
  const res = await api.post('/auth/login', { email, password });
  const token = res.data?.data?.token;
  const user = res.data?.data?.user;
  const role = user?.role || '';
  const userId = user?._id || user?.id || '';
  localStorage.setItem('token', token);
  localStorage.setItem('userId', userId);
  router.push(getSafeRedirectPath(router.query.redirect));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 2, sm: 0 } }}>
      {/* GSSoC: card-enter adds fade-in-up; mobile width fixed with width/minWidth */}
      <Paper elevation={8} className="card-enter" sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 4,
        width: { xs: '100%', sm: 400 },
        minWidth: { xs: 0, sm: 350 },
        maxWidth: 420,
        background: 'rgba(255,255,255,0.98)',
        boxShadow: '0 8px 32px 0 rgba(33,147,176,0.10)',
        position: 'relative',
        overflow: 'hidden',
      }}>
       <Box
  sx={{
    display: 'flex',
    justifyContent: 'center',
    mb: 3,
  }}
>
  <Box
    sx={{
      width: 90,
      height: 90,

      borderRadius: '50%',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      backgroundColor: '#fff',
      p: 1,
    }}
  >
    <img
      src="/med-internia-logo.jpg"
      alt="MedInternia Logo"
      style={{ width: '100%', height: '100%' }}
    />
  </Box>
</Box>
  {/* Removed decorative circle at top right */}
        <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 900, color: '#1565c0', letterSpacing: 1, zIndex: 1, position: 'relative' }}>Login</Typography>
        {error && <Alert severity="error" sx={{ zIndex: 1, position: 'relative' }}>{error}</Alert>}
        <form onSubmit={handleSubmit} style={{ zIndex: 1, position: 'relative' }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            sx={{ bgcolor: '#f8fafd', borderRadius: 2 }}
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            sx={{
              bgcolor: '#f8fafd',
              borderRadius: 2,
              '& .MuiInputBase-input': {
                animation: showPassword
                  ? 'revealPassword 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                  : 'hidePassword 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                '@keyframes revealPassword': {
                  '0%': {
                    filter: 'blur(5px)',
                    letterSpacing: '0.12em',
                    opacity: 0,
                    clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
                  },
                  '40%': {
                    opacity: 0.6,
                  },
                  '100%': {
                    filter: 'blur(0)',
                    letterSpacing: 'normal',
                    opacity: 1,
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                  }
                },
                '@keyframes hidePassword': {
                  '0%': {
                    filter: 'blur(5px)',
                    letterSpacing: '0.12em',
                    opacity: 0,
                    clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
                  },
                  '40%': {
                    opacity: 0.6,
                  },
                  '100%': {
                    filter: 'blur(0)',
                    letterSpacing: 'normal',
                    opacity: 1,
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                  }
                }
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    sx={{
                      color: 'text.secondary',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'scale(1.12)',
                        color: '#1565c0',
                        filter: 'drop-shadow(0 0 4px rgba(21, 147, 176, 0.4))',
                      },
                      '&:active': {
                        transform: 'scale(0.93)',
                      },
                      mr: 0.5,
                    }}
                  >
                    {showPassword ? (
                      <VisibilityOff
                        sx={{
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          animation: 'premiumRotateOut 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                          '@keyframes premiumRotateOut': {
                            '0%': { opacity: 0, transform: 'rotate(-25deg) scale(0.8)' },
                            '100%': { opacity: 1, transform: 'rotate(0deg) scale(1)' }
                          }
                        }}
                      />
                    ) : (
                      <Visibility
                        sx={{
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          animation: 'premiumRotateIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                          '@keyframes premiumRotateIn': {
                            '0%': { opacity: 0, transform: 'rotate(25deg) scale(0.8)' },
                            '100%': { opacity: 1, transform: 'rotate(0deg) scale(1)' }
                          }
                        }}
                      />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {/* GSSoC: Disabled + spinner when loading */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            aria-label="Login"
            sx={{
              mt: 2,
              py: 1.3,
              fontWeight: 800,
              fontSize: '1.1rem',
              borderRadius: 3,
              letterSpacing: 0.5,
              background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 20px 0 rgba(33, 147, 176, 0.13)',
              transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
              textTransform: 'uppercase',
              '&:hover': {
                background: 'linear-gradient(90deg, #1565c0 0%, #2193b0 100%)',
                transform: 'scale(1.03)',
                boxShadow: '0 8px 32px 0 rgba(33, 147, 176, 0.18)',
                color: '#ffffff'
              },
              '&:active': {
                color: '#ffffff',
              },
              '&:focus': {
                color: '#ffffff',
              }
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Login'}
          </Button>
        </form>
        <Divider sx={{ my: 3, zIndex: 1, position: 'relative' }}>or</Divider>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, zIndex: 1, position: 'relative' }}>
          <div id="google-signin-button" style={{ width: '100%', maxWidth: '336px' }} />
        </Box>
        <Box textAlign="center" sx={{ zIndex: 1, position: 'relative' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>Don't have an account?</Typography>
          <Button
            component={Link}
            href="/auth/register"
            variant="outlined"
            color="primary"
            fullWidth
            sx={{
              borderRadius: 3,
              fontWeight: 700,
              py: 1.3,
              border: '2px solid #2193b0',
              color: '#2193b0',
              textDecoration: 'none !important',
              transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
              '&:hover': {
                border: '2px solid #1565c0',
                background: 'rgba(33, 147, 176, 0.05)',
                color: '#1565c0',
                transform: 'scale(1.02)',
                textDecoration: 'none !important',
              },
            }}
          >
            Register
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
