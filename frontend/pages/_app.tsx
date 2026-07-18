import type { AppProps } from "next/app";
import { ReactNode, useEffect, useState } from "react";
import { CssBaseline, Snackbar, Alert, Typography } from "@mui/material";
import { useNotifications } from "../hooks/useNotifications";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CustomThemeProvider } from "../context/ThemeContext";
import ErrorBoundary from "../components/ErrorBoundary";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRouter } from "next/router";
import "../styles/globals.css";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import "../i18n";

const Chatbot = dynamic(() => import("../components/Chatbot"), {
  ssr: false,
  loading: () => null,
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const PUBLIC_ROUTES = [
  "/",
  "/landing",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/jobs",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/change-password",
  "/404",
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const publicRoute = isPublicRoute(router.pathname);

  useEffect(() => {
    if (publicRoute || isLoading) return;

    if (!isAuthenticated) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(router.asPath)}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicRoute, isLoading, isAuthenticated, router.pathname]);

  if (publicRoute) return <>{children}</>;
  if (isLoading || !isAuthenticated) return null; // blank while validating / before redirect fires
  return <>{children}</>;
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { newToast, clearToast } = useNotifications();
  const [showChatbot, setShowChatbot] = useState(false);

  const hideNavbarRoutes = ["/", "/contact", "/auth/login", "/auth/register"];
  const showNavbar = !hideNavbarRoutes.includes(router.pathname);
  const hideFooterRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/change-password",
    "/auth/forgot-password",
  ];
  const showFooter = !hideFooterRoutes.includes(router.pathname);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowChatbot(true);
    }, 12000);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CustomThemeProvider>
          <Head>
            <title>MedInternia</title>
            <link rel="icon" type="image/x-icon" href="/favicon.ico" />
            <link rel="shortcut icon" href="/favicon.ico" />

            {/* --- PWA META TAGS --- */}
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#000000" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta
              name="apple-mobile-web-app-status-bar-style"
              content="default"
            />
            <meta name="apple-mobile-web-app-title" content="MedInternia" />
            <link rel="apple-touch-icon" href="/icon-192x192.png" />
          </Head>

          <div
            className={inter.className}
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              overflowX: "hidden",
              maxWidth: "100%",
            }}
          >
            <CssBaseline />

            {showNavbar && <Navbar route={router.pathname} />}

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <AuthGate>
                <Component {...pageProps} />
              </AuthGate>
            </div>

            {showFooter && <Footer />}
            {showChatbot && router.pathname !== "/" && router.pathname !== "/landing" && (
              <Chatbot />
            )}

            <Snackbar
              open={!!newToast}
              autoHideDuration={4000}
              onClose={clearToast}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
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
                  cursor: newToast?.link ? "pointer" : "default",
                  background: (theme: any) => theme.custom.navbarGradient,
                  color: "white",
                  minWidth: 280,
                  "& .MuiAlert-icon": { color: "white" },
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  New Notification
                </Typography>
                <Typography variant="caption">{newToast?.message}</Typography>
              </Alert>
            </Snackbar>
          </div>
        </CustomThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
