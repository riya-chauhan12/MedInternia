import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { ClipboardCheck } from "lucide-react";

const terms = [
  "Use MedInternia respectfully and only for learning, collaboration, and professional development.",
  "Do not upload harmful, misleading, or unauthorized content.",
  "Respect other learners, mentors, and healthcare professionals participating on the platform.",
  "Platform content is intended for learning support and should not replace professional medical advice.",
  "The team may update these terms as the platform evolves.",
];

export default function TermsPage() {
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
            <ClipboardCheck size={42} color="#2193b0" />
            <Typography variant="h2" fontWeight={900} color="#2193b0" sx={{ fontSize: { xs: "2.2rem", md: "3.5rem" } }}>
              Terms of Service
            </Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
            Please review these terms before using MedInternia.
          </Typography>

          <Stack component="ol" spacing={2} sx={{ pl: 3, m: 0 }}>
            {terms.map((term) => (
              <Typography component="li" key={term} color="text.secondary" sx={{ lineHeight: 1.8, pl: 1 }}>
                {term}
              </Typography>
            ))}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
