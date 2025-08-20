import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import api from "../utils/api";

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/jobs")
      .then((res) => {
        setJobs(res.data.data.jobs || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch jobs");
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box
      maxWidth={700}
      mx="auto"
      my={4}
      sx={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        sx={{
          p: 4,
          borderRadius: 4,
          boxShadow: "0 2px 12px #2193b022",
          background: "linear-gradient(120deg, #f8f9fa 0%, #e0eafc 100%)",
          width: "100%",
        }}
      >
        <Typography
          variant="h3"
          fontWeight={900}
          mb={2}
          color="#1565c0"
          sx={{ letterSpacing: 1, textAlign: "center" }}
        >
          Job Opportunities
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          mb={3}
          sx={{ fontSize: "1.12rem", fontWeight: 500, textAlign: "center" }}
        >
          Discover internships, residencies, and medical jobs tailored for you.
        </Typography>

        {jobs.length === 0 ? (
          <Typography textAlign="center">No jobs found.</Typography>
        ) : (
          <List>
            {jobs.map((j, i) => (
              <ListItem
                key={j._id}
                sx={{
                  animation: `slideUp 0.6s ${i * 0.1}s both`,
                  borderRadius: 3,
                  mb: 2,
                  boxShadow: "0 1px 4px #2193b022",
                  background: "#fff",
                }}
                secondaryAction={
                  j.status === "Open" ? (
                    <Button
                      variant="contained"
                      sx={{
                        borderRadius: 3,
                        px: 3,
                        py: 1,
                        fontWeight: 700,
                        fontSize: "1.02rem",
                        background: "#43a047",
                        color: "#fff",
                        boxShadow: "0 2px 8px #2193b044",
                        transition: "all 0.2s",
                        "&:hover": {
                          background: "#1565c0",
                          boxShadow: "0 4px 16px #2193b066",
                        },
                      }}
                    >
                      Apply
                    </Button>
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          borderRadius: 3,
                          px: 3,
                          py: 1,
                          fontWeight: 700,
                          fontSize: "1.02rem",
                          background:
                            "linear-gradient(90deg, #bdbdbd 60%, #e0eafc 100%)",
                          color: "#666",
                          boxShadow: "0 2px 8px #2193b022",
                          opacity: 0.8,
                          letterSpacing: 1,
                          border: "none",
                          cursor: "not-allowed",
                          userSelect: "none",
                        }}
                      >
                        Closed
                      </Box>
                    </Box>
                  )
                }
              >
                <ListItemText
                  primary={
                    <Typography fontWeight={700} fontSize={18}>
                      {j.title}
                    </Typography>
                  }
                  secondary={
                    <Typography color="text.secondary">{j.location}</Typography>
                  }
                />
                <Chip
                  label={j.status}
                  color={j.status === "Open" ? "success" : "default"}
                  sx={{ ml: 2, fontWeight: 700 }}
                />
              </ListItem>
            ))}
          </List>
        )}

        <style jsx global>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </Card>
    </Box>
  );
}
