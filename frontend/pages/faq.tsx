import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Paper, Typography } from "@mui/material";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is MedInternia?",
    answer: "MedInternia is a medical learning and collaboration platform for cases, webinars, career opportunities, certificates, and peer interaction.",
  },
  {
    question: "Who can use the platform?",
    answer: "Medical students, interns, doctors, educators, and healthcare learners can use MedInternia to learn, collaborate, and grow professionally.",
  },
  {
    question: "How do I explore cases and webinars?",
    answer: "Use the navigation links for Cases and Webinars to browse available learning resources and open individual detail pages.",
  },
  {
    question: "How can I contact the team?",
    answer: "You can use the Contact page or email the team at medinternia@gmail.com for support and collaboration queries.",
  },
];

export default function FAQPage() {
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
          <Typography variant="h2" fontWeight={900} color="#2193b0" sx={{ fontSize: { xs: "2.3rem", md: "3.5rem" }, mb: 2 }}>
            FAQs
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
            Find quick answers about MedInternia, platform access, and support.
          </Typography>

          {faqs.map((faq) => (
            <Accordion key={faq.question} disableGutters elevation={0} sx={{ borderBottom: "1px solid #e2e8f0", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ChevronDown size={20} color="#2193b0" />}>
                <Typography fontWeight={800}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      </Container>
    </Box>
  );
}
