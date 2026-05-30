import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { Lock, ShieldCheck } from "lucide-react";

const sections = [
  {
    title: "Information We Collect",
    text: "MedInternia may collect account details, profile information, learning activity, and content you choose to submit on the platform.",
  },
  {
    title: "How We Use Information",
    text: "Information is used to provide platform features, improve learning experiences, manage user access, and support communication.",
  },
  {
    title: "Data Protection",
    text: "We aim to protect user information with reasonable safeguards and encourage responsible platform usage.",
  },
  {
    title: "Contact",
    text: "For privacy-related questions, contact the team through the Contact page or at medinternia@gmail.com.",
  },
];

export default function PrivacyPage() {
  return (
    <Box sx={{ flex: 1, background: "linear-gradient(120deg, #e0eafc 0%, #f8f9fa 100%)", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 5,
            border: "1px solid rgba(33,147,176,0.12)",
            boxShadow: "0 12px 36px rgba(33,147,176,0.14)",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <ShieldCheck size={42} color="#2193b0" />
            <Typography variant="h2" fontWeight={900} color="#2193b0" sx={{ fontSize: { xs: "2.2rem", md: "3.5rem" } }}>
              Privacy Policy
            </Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
            This page explains how MedInternia handles user information and platform data.
          </Typography>

          <Stack spacing={3}>
            {sections.map((section) => (
              <Box key={section.title} sx={{ p: 3, borderRadius: 3, bgcolor: "rgba(33,147,176,0.08)" }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <Lock size={18} color="#2193b0" />
                  <Typography variant="h6" fontWeight={800}>
                    {section.title}
                  </Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {section.text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
