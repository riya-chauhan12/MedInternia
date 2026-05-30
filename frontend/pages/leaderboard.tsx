import { Box, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import { Award, Medal, Trophy } from "lucide-react";

const contributors = [
  { rank: 1, name: "Dr. Smith", points: 320, badge: "Case Champion" },
  { rank: 2, name: "Dr. Lee", points: 290, badge: "Webinar Mentor" },
  { rank: 3, name: "Dr. Patel", points: 270, badge: "Peer Reviewer" },
];

export default function LeaderboardPage() {
  return (
    <Box sx={{ flex: 1, background: "linear-gradient(120deg, #e0eafc 0%, #f8f9fa 100%)", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 5,
              border: "1px solid rgba(33,147,176,0.12)",
              boxShadow: "0 12px 36px rgba(33,147,176,0.14)",
              textAlign: "center",
            }}
          >
            <Trophy size={54} color="#d97706" />
            <Typography variant="h2" fontWeight={900} color="#2193b0" sx={{ fontSize: { xs: "2.4rem", md: "4rem" }, mt: 2 }}>
              Leaderboard
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
              Track top contributors and celebrate active learning across MedInternia.
            </Typography>
          </Paper>

          <Grid container spacing={3}>
            {contributors.map((contributor) => (
              <Grid size={{ xs: 12, md: 4 }} key={contributor.rank}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    border: "1px solid rgba(33,147,176,0.12)",
                    boxShadow: "0 8px 24px rgba(33,147,176,0.10)",
                    height: "100%",
                  }}
                >
                  <Stack spacing={2} alignItems="center" textAlign="center">
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
                        bgcolor: contributor.rank === 1 ? "#fffbeb" : "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {contributor.rank === 1 ? <Medal size={34} color="#d97706" /> : <Award size={34} color="#2193b0" />}
                    </Box>
                    <Typography variant="h5" fontWeight={900}>
                      #{contributor.rank} {contributor.name}
                    </Typography>
                    <Typography color="text.secondary">{contributor.badge}</Typography>
                    <Typography fontWeight={800} color="#2193b0">
                      {contributor.points} pts
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
