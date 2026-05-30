import { Box, Button, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { BookOpen, BriefcaseMedical, HeartPulse, Users } from "lucide-react";

const highlights = [
  {
    icon: <BookOpen size={28} color="#2193b0" />,
    title: "Case-based learning",
    text: "Explore practical medical cases and sharpen clinical thinking through guided discussions.",
  },
  {
    icon: <Users size={28} color="#2193b0" />,
    title: "Peer collaboration",
    text: "Connect with students, interns, and mentors who are learning and building together.",
  },
  {
    icon: <BriefcaseMedical size={28} color="#2193b0" />,
    title: "Career support",
    text: "Find webinars, jobs, certificates, and learning opportunities in one focused platform.",
  },
];

export default function AboutPage() {
  return (
    <Box sx={{ flex: 1, background: "linear-gradient(120deg, #e0eafc 0%, #f8f9fa 100%)", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={5}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 6 },
              borderRadius: 5,
              border: "1px solid rgba(33,147,176,0.12)",
              boxShadow: "0 12px 36px rgba(33,147,176,0.14)",
              background: "#ffffff",
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography variant="h2" fontWeight={900} color="#2193b0" sx={{ fontSize: { xs: "2.4rem", md: "4rem" } }}>
                  About MedInternia
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
                  MedInternia helps medical learners grow through real cases, peer review, career opportunities, and live learning experiences.
                </Typography>
                <Button
                  component={Link}
                  href="/contact"
                  variant="contained"
                  sx={{
                    mt: 4,
                    borderRadius: 30,
                    px: 4,
                    py: 1.4,
                    fontWeight: 700,
                    background: "linear-gradient(90deg, #1de9b6 0%, #2193b0 100%)",
                  }}
                >
                  Contact Us
                </Button>
              </Box>
              <Box
                sx={{
                  width: { xs: 120, md: 160 },
                  height: { xs: 120, md: 160 },
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6dd5ed 0%, #2193b0 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 18px 40px rgba(33,147,176,0.28)",
                }}
              >
                <HeartPulse size={70} color="#ffffff" />
              </Box>
            </Stack>
          </Paper>

          <Grid container spacing={3}>
            {highlights.map((item) => (
              <Grid size={{ xs: 12, md: 4 }} key={item.title}>
                <Paper
                  elevation={0}
                  sx={{
                    height: "100%",
                    p: 3,
                    borderRadius: 4,
                    border: "1px solid rgba(33,147,176,0.12)",
                    boxShadow: "0 8px 24px rgba(33,147,176,0.10)",
                  }}
                >
                  <Box sx={{ mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {item.text}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
