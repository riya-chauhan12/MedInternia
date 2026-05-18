import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

export default function ContactPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={6}
        sx={{
            p: 5,
            borderRadius: 4,
            maxWidth: 550,
            mx: "auto",
            mt: 8,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
       >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Contact Us
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={4}>
          Reach out to the MedInternia team for support and inquiries.
        </Typography>

        <Stack spacing={3}>
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={1}
                mt={3}
                >
                <EmailIcon color="primary" />
                <Typography
                  component="a"
                  href="mailto:medinternia@gmail.com"
                  sx={{ textDecoration: "none", color: "inherit" }}
                >
                  medinternia@gmail.com
                </Typography>
                </Box>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                <PhoneIcon color="primary" />
                <Typography
                  component="a"
                  href="tel:8585858585"
                  sx={{ textDecoration: "none", color: "inherit" }}
                >
                  8585858585
                </Typography>
            </Box>

            <Box mt={4}>
                <Link href="/" passHref>
                    <Button variant="contained">
                    Back to Home
                    </Button>
                </Link>
            </Box>

          
        </Stack>
      </Paper>
    </Container>
  );
}