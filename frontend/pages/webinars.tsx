import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
} from "@mui/material";
    import api from '../utils/api';
import WebinarJoin from "../components/WebinarJoin";

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState<any[]>([]);
  const [selectedWebinar, setSelectedWebinar] = useState<any>(null);


    useEffect(() => {
      api.get('/webinars')
        .then(res => setWebinars(res.data.data.webinars || []))
        .catch(() => setWebinars([]));
  }, []);

  if (selectedWebinar) {
    return <WebinarJoin meetingLink={selectedWebinar.meetingLink} onLeave={() => setSelectedWebinar(null)} />;
  }


  return (
    <Box maxWidth={700} mx="auto" my={4} sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card sx={{ p: 4, borderRadius: 4, boxShadow: "0 2px 12px #2193b022", background: "linear-gradient(120deg, #f8f9fa 0%, #e0eafc 100%)", width: "100%" }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" fontWeight={900} color="#1565c0" sx={{ letterSpacing: 1 }}>
            Webinars
          </Typography>
          {typeof window !== 'undefined' && ['doctor'].includes(localStorage.getItem('userType') || '') && (
            <Button href="/webinars/create" variant="contained" color="primary" sx={{ fontWeight: 700, borderRadius: 3 }}>
              Add Webinar
            </Button>
          )}
        </Box>
        <Typography variant="subtitle1" color="text.secondary" mb={3} sx={{ fontSize: "1.12rem", fontWeight: 500 }}>
          Join upcoming webinars and expand your medical expertise. Learn from top professionals and stay updated with the latest trends.
        </Typography>
        <List>
          {webinars.length === 0 ? (
            <Typography color="text.secondary">No webinars available.</Typography>
          ) : (
            webinars.map((w, i) => (
              <ListItem
                key={w._id}
                sx={{ animation: `slideUp 0.6s ${i * 0.1}s both`, borderRadius: 3, mb: 2, boxShadow: "0 1px 4px #2193b022", background: "#fff" }}
                secondaryAction={
                  (w.status === 'scheduled' || w.status === 'live') ? (
                    <Button
                      variant="contained"
                      sx={{
                        borderRadius: 3,
                        px: 3,
                        py: 1,
                        fontWeight: 700,
                        fontSize: "1.02rem",
                        background: "#1976d2",
                        color: "#fff",
                        boxShadow: "0 2px 8px #2193b044",
                        transition: "all 0.2s",
                        "&:hover": {
                          background: "#1565c0",
                          boxShadow: "0 4px 16px #2193b066",
                        },
                      }}
                      onClick={() => setSelectedWebinar(w)}
                    >
                      Join
                    </Button>
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{
                        borderRadius: 3,
                        px: 3,
                        py: 1,
                        fontWeight: 700,
                        fontSize: "1.02rem",
                        background: "linear-gradient(90deg, #bdbdbd 60%, #e0eafc 100%)",
                        color: "#666",
                        boxShadow: "0 2px 8px #2193b022",
                        opacity: 0.8,
                        letterSpacing: 1,
                        border: "none",
                        cursor: "not-allowed",
                        userSelect: "none",
                      }}>
                        Completed
                      </Box>
                    </Box>
                  )
                }
              >
                <ListItemText
                  primary={<Typography fontWeight={700} fontSize={18}>{w.title}</Typography>}
                  secondary={<Typography color="text.secondary">{new Date(w.scheduledAt).toLocaleString()}</Typography>}
                />
                <Chip
                  label={w.status === 'scheduled' ? 'Upcoming' : w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                  color={w.status === 'scheduled' ? 'info' : 'default'}
                  sx={{ ml: 2, fontWeight: 700 }}
                />
              </ListItem>
            ))
          )}
        </List>
        <style jsx global>{`
          @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </Card>
    </Box>
  );
}
