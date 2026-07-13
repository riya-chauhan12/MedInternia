import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import Link from "next/link";
import api from "../../utils/api";

interface LikedCase {
  _id: string;
  title: string;
  specialization?: string;
}

export default function LikedPage() {
  const [likedCases, setLikedCases] = useState<LikedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikedCases = async () => {
      try {
        const res = await api.get('/cases/liked');
        setLikedCases(res.data?.data?.cases || []);
      } catch (err) {
        setError("Could not load liked items. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLikedCases();
  }, []);

  return (
    <Box maxWidth={600} mx="auto" my={4}>
      <Card sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Liked Items
        </Typography>

        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loading && error && (
          <Typography color="error" fontSize={14}>
            {error}
          </Typography>
        )}

        {!loading && !error && likedCases.length === 0 && (
          <Typography color="text.secondary" fontSize={14}>
            You haven't liked any cases yet.
          </Typography>
        )}

        {!loading && !error && likedCases.length > 0 && (
          <List>
            {likedCases.map((item) => (
              <ListItem
                key={item._id}
                secondaryAction={
                  <IconButton color="primary" disabled>
                    <ThumbUpAltIcon />
                  </IconButton>
                }
              >
                <Link href={`/cases/${item._id}`} passHref style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
                  <ListItemText primary={item.title} secondary={item.specialization} />
                </Link>
              </ListItem>
            ))}
          </List>
        )}
      </Card>
    </Box>
  );
}