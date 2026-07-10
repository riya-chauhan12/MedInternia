import type { AppProps } from 'next/app';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Snackbar, Alert, Typography } from '@mui/material';
import { useNotifications } from '../hooks/useNotifications';
import { AuthProvider } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import Head from 'next/head';
import Chatbot from '../components/Chatbot';
import medInterniaTheme from '../theme/medInterniaTheme';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { newToast, clearToast } = useNotifications();
  const hideNavbarRoutes = ['/', '/contact', '/auth/login', '/auth/register'];
  const showNavbar = !hideNavbarRoutes.includes(router.pathname);
  const hideFooterRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/change-password',
    '/auth/forgot-password',
  ];
  const showFooter = !hideFooterRoutes.includes(router.pathname);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider theme={medInterniaTheme}>
          <Head>
            <title>MedInternia</title>
            <link rel="icon" type="image/x-icon" href="/favicon.ico" />
            <link rel="shortcut icon" href="/favicon.ico" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
              href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
              rel="stylesheet"
            />

            {/* --- PWA META TAGS --- */}
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#000000" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="MedInternia" />
            <link rel="apple-touch-icon" href="/icon-192x192.png" />
            {/* -------------------------------- */}
          </Head>

          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden', maxWidth: '100%' }}>
            <CssBaseline />
            {showNavbar && <Navbar route={router.pathname} />}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Component {...pageProps} />
            </div>
            {showFooter && <Footer />}
            <Chatbot />

            <Snackbar
              open={!!newToast}
              autoHideDuration={4000}
              onClose={clearToast}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <Alert
                onClose={clearToast}
                severity="info"
                variant="filled"
                onClick={() => {
                  if (newToast?.link) router.push(newToast.link);
                  clearToast();
                }}
                sx={{
                  cursor: newToast?.link ? 'pointer' : 'default',
                  background: (theme) => theme.custom.navbarGradient,
                  color: 'white',
                  minWidth: 280,
                  '& .MuiAlert-icon': { color: 'white' },
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  New Notification
                </Typography>
                <Typography variant="caption">{newToast?.message}</Typography>
              </Alert>
            </Snackbar>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp;