import type { AppProps } from "next/app";
import { CssBaseline, Snackbar, Alert, Typography } from "@mui/material";
import { useNotifications } from "../hooks/useNotifications";
import Navbar from "../components/Navbar";
// GSSoC: Import Footer component
import Footer from "../components/Footer";
import { useRouter } from "next/router";
import "../styles/globals.css";
import Head from "next/head";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { newToast, clearToast } = useNotifications();
  const hideNavbarRoutes = ["/", "/contact", "/auth/login", "/auth/register"];
  const showNavbar = !hideNavbarRoutes.includes(router.pathname);
  // GSSoC: Hide footer on auth pages
  const hideFooterRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/change-password",
    "/auth/forgot-password",
  ];
  const showFooter = !hideFooterRoutes.includes(router.pathname);
  return (
    <>
      <Head>
        <title>MedInternia</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>

      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <CssBaseline />
        {showNavbar && <Navbar route={router.pathname} />}
        <div
          style={{
            marginTop: showNavbar ? 64 : 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Component {...pageProps} />
        </div>
        {/* GSSoC: Render footer on non-auth pages */}
        {showFooter && <Footer />}

        {/* Real-time notification toast */}
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
              background: 'linear-gradient(90deg, #1d8299 0%, #5ac0d8 100%)',
              color: 'white',
              minWidth: 280,
              '& .MuiAlert-icon': { color: 'white' },
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              New Notification
            </Typography>
            <Typography variant="caption">
              {newToast?.message}
            </Typography>
          </Alert>
        </Snackbar>
        <style jsx global>{`
          .mouse-droplet {
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: radial-gradient(
              circle at 50% 50%,
              #6dd5ed 70%,
              #2193b0 100%
            );
            box-shadow: 0 0 8px 2px #6dd5ed88;
            opacity: 0.8;
            pointer-events: none;
            animation: dropletFade 0.4s forwards;
          }
          @keyframes dropletFade {
            0% {
              opacity: 0.8;
              transform: scale(1);
            }
            70% {
              opacity: 0.4;
              transform: scale(1.3);
            }
            100% {
              opacity: 0;
              transform: scale(0.7);
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default MyApp;
