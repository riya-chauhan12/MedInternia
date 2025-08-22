import QRCode from "qrcode.react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Divider,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
// import Link from 'next/link';
import Link from "next/link";

import React, { useState } from "react";

const categories = ["All", "Cases", "Jobs", "Webinars", "Patients"];
const specialties = [
  "All",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "General Medicine",
];
const difficulties = ["Beginner", "Intermediate", "Complex"];
const verifications = ["Verified", "Unverified"];
const sortOptions = ["Newest", "Oldest", "Most Upvoted"];

const HomePage = () => {
  const [toastOpen, setToastOpen] = useState(false);
  // Leaderboard preview data
  const topContributors = [
    { name: "Dr. Smith", points: 320 },
    { name: "Dr. Lee", points: 290 },
    { name: "Dr. Patel", points: 270 },
  ];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [specialty, setSpecialty] = useState("All");
  const [difficulty, setDifficulty] = useState("");
  const [verification, setVerification] = useState("");
  const [sort, setSort] = useState("Newest");

  // Snackbar close handler
  const handleToastClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setToastOpen(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #e0eafc 0%, #f8f9fa 100%)",
        position: "relative",
        pb: { xs: 4, md: 8 },
      }}
    >
      {/* Hero Section with medical-themed background, search bar, improved typography, and CTA */}
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          pt: { xs: 2, md: 4 }, // reduce top padding
          pb: 2,
          mb: { xs: 2, md: 3 },
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box/>
        <Typography
          variant="h1"
          fontWeight={900}
          color="#2193b0"
          mb={2}
          sx={{ letterSpacing: 1, fontSize: { xs: "2.5rem", md: "3.5rem" } }}
        >
          Med-Internia
        </Typography>
        <Typography
          variant="h6"
          color="#555"
          mb={4}
          sx={{ fontWeight: 400, fontSize: { xs: "1.1rem", md: "1.3rem" } }}
        >
          Your gateway to medical learning, jobs, and opportunities.
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{
            borderRadius: 30,
            px: 5,
            py: 1.5,
            fontWeight: 700,
            fontSize: "1.2rem",
            background: "linear-gradient(90deg, #1de9b6 0%, #2193b0 100%)",
            boxShadow: "0 4px 24px #2193b044",
            transition: "transform 0.2s",
            mb: 2,
            "&:hover": {
              transform: "scale(1.07)",
              boxShadow: "0 8px 32px #2193b066",
              background: "linear-gradient(90deg, #2193b0 0%, #1de9b6 100%)",
            },
          }}
          href="/auth/login"
        >
          Get Started
        </Button>
      </Box>
      {/* 4 Main Cards Section (Cases, Jobs, Webinars, Leaderboard) */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: 2,
          py: 2,
          mb: { xs: 4, md: 6 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          justifyContent="center"
          alignItems="stretch"
        >
          <CardLink
            href="/cases"
            title="Cases"
            icon={
              <span style={{ fontSize: 48 }} role="img" aria-label="Cases">
                📂
              </span>
            }
            desc="Explore and analyze real medical cases."
          />
          <CardLink
            href="/jobs"
            title="Jobs"
            icon={
              <span style={{ fontSize: 48 }} role="img" aria-label="Jobs">
                💼
              </span>
            }
            desc="Find internships and opportunities."
          />
          <CardLink
            href="/webinars"
            title="Webinars"
            icon={
              <span style={{ fontSize: 48 }} role="img" aria-label="Webinars">
                🎤
              </span>
            }
            desc="Join live AMAs and sessions."
          />
          <CardLink
            href="/leaderboard"
            title="Leaderboard"
            icon={
              <span
                style={{ fontSize: 48 }}
                role="img"
                aria-label="Leaderboard"
              >
                🏆
              </span>
            }
            desc="Track contributors and ranks."
          />
        </Stack>
      </Box>
      {/* Leaderboard Preview Section */}
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          py: 4,
          mb: { xs: 4, md: 6 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={2} color="#1565c0">
          Top Contributors
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "center",
            mb: 2,
          }}
        >
          {topContributors.map((c, i) => (
            <Paper
              key={i}
              elevation={2}
              sx={{
                px: 3,
                py: 2,
                borderRadius: 3,
                minWidth: 120,
                textAlign: "center",
                background: "#e0eafc",
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} color="#2193b0">
                {c.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {c.points} pts
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
      {/* Features Section */}
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          py: 4,
          mb: { xs: 4, md: 6 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={2} color="#1565c0">
          Why Med-Internia?
        </Typography>
        <ul
          style={{ fontSize: "1.1rem", marginLeft: "2rem", marginBottom: 24 }}
        >
          <li>Case-based learning and analysis</li>
          <li>Peer review and feedback system</li>
          <li>Badges and certification achievements</li>
          <li>Job opportunities board</li>
          <li>Webinars and live AMAs</li>
          <li>AI-powered suggestions</li>
          <li>Leaderboard and advanced search</li>
          <li>LinkedIn/GitHub export, video conferencing</li>
        </ul>
  {/* Login/Register buttons removed as requested */}
      </Box>
      <Box
        sx={{
          maxWidth: 900,
          mx: 'auto',
          px: 2,
          py: 2,
          mb: { xs: 4, md: 6 },
          position: 'relative',
          zIndex: 1,
          display: { xs: 'block', md: 'flex' },
          alignItems: { xs: 'center', md: 'center' },
          justifyContent: { xs: 'center', md: 'center' },
          gap: 6,
          background: 'linear-gradient(120deg, #e0f7fa 0%, #f8f9fa 100%)',
          borderRadius: 6,
          boxShadow: '0 2px 24px #2193b022',
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 260, display: { xs: 'flex', md: 'block' }, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h4" fontWeight={700} color="#2193b0" mb={2} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            Ready to improve your medical journey?
          </Typography>
          <Typography variant="body1" color="#555" mb={3} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            Download the Med-Internia app and access medical cases, jobs, webinars, and more on your mobile device.
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
            <Button variant="contained" sx={{ background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)', color: '#fff', fontWeight: 700, px: 2, borderRadius: 2, boxShadow: 1 }}>
              Download for iOS
            </Button>
            <Button variant="contained" sx={{ background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)', color: '#fff', fontWeight: 700, px: 2, borderRadius: 2, boxShadow: 1 }}>
              Download for Android
            </Button>
          </Box>
        </Box>
        <Box
            sx={{
              bgcolor: '#c8d8f7ff',
              borderRadius: 4,
              boxShadow: '0 4px 32px #2193b044',
              p: 3,
              minWidth: 220,
              textAlign: 'center',
              display: { xs: 'none', sm: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
            }}
        >
          <div style={{ background: '#fff', padding: 8, borderRadius: 12, boxShadow: '0 2px 8px #2193b022', marginBottom: 12 }}>
            <img src="/qr-blue-spies.png" alt="Team Blue Spies QR" width={140} height={140} style={{ display: 'block', margin: '0 auto' }} />
          </div>
            <Typography variant="h6" color="#2193b0" fontWeight={700} mb={1}>
              Med-Internia App on Mobile
            </Typography>
          <Typography variant="body2" color="#888">
            Scan to Download
          </Typography>
        </Box>
      </Box>
      {/* How it works / Testimonials Section */}
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          py: 4,
          mb: { xs: 4, md: 6 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={2} color="#1565c0">
          How It Works
        </Typography>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          justifyContent="center"
          alignItems="stretch"
        >
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 4,
              textAlign: "center",
              flex: 1,
              minWidth: 220,
            }}
          >
            <Typography variant="h6" fontWeight={700} color="#2193b0" mb={1}>
              Sign Up
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your free account and set up your medical profile.
            </Typography>
          </Paper>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 4,
              textAlign: "center",
              flex: 1,
              minWidth: 220,
            }}
          >
            <Typography variant="h6" fontWeight={700} color="#2193b0" mb={1}>
              Learn & Collaborate
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join cases, webinars, and discussions to learn and share
              knowledge.
            </Typography>
          </Paper>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 4,
              textAlign: "center",
              flex: 1,
              minWidth: 220,
            }}
          >
            <Typography variant="h6" fontWeight={700} color="#2193b0" mb={1}>
              Grow Your Career
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Earn achievements, connect with peers, and find job opportunities.
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
  // CardLink component for homepage cards
  function CardLink({
    href,
    title,
    icon,
    desc,
  }: {
    href: string;
    title: string;
    icon: React.ReactNode;
    desc: string;
  }) {
    return (
      <Paper
        elevation={4}
        sx={{
          p: 3,
          borderRadius: 4,
          minWidth: 220,
          flex: 1,
          textAlign: "center",
          transition: "box-shadow 0.2s, transform 0.2s",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          "&:hover": {
            boxShadow: 12,
            background: "#e0eafc",
            transform: "scale(1.04)",
            filter: "drop-shadow(0 0 12px #2193b044)",
          },
        }}
      >
        <Box
          mb={1}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h6"
          fontWeight={700}
          color="#2193b0"
          mb={0.5}
          sx={{ fontSize: "1.25rem" }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          mb={1}
          sx={{ minHeight: 32 }}
        >
          {desc}
        </Typography>
        <Button
          variant="contained"
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 600,
            background: "linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)",
            color: "#fff",
            boxShadow: "0 1px 4px #2193b022",
            mt: 1,
            "&:hover": {
              background: "linear-gradient(90deg, #6dd5ed 0%, #2193b0 100%)",
              color: "#fff",
              boxShadow: "0 2px 8px #2193b044",
            },
          }}
          onClick={() => setToastOpen(true)}
        >
          Explore
        </Button>
      </Paper>
    );
  }
  return (
    <>
      {/* ...existing code... */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleToastClose} severity="info" sx={{ width: '100%', fontWeight: 700, fontSize: 16, background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)', color: '#fff', boxShadow: '0 2px 12px #2193b044' }}>
          Login for more info
        </Alert>
      </Snackbar>
      {/* ...existing code... */}
    </>
  );
};

export default HomePage;
