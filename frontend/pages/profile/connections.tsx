import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import api from "../../utils/api";

export default function ConnectionsPage() {
  const [tab, setTab] = useState(0);
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  useEffect(() => {
    api.get("/users/connections", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setFollowing(res.data.following || []);
      setFollowers(res.data.followers || []);
    });
  }, [token]);

  return (
    <Box maxWidth={600} mx="auto" my={4}>
      <Card sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Connections
        </Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Following" />
          <Tab label="Followers" />
        </Tabs>
        <List>
          {(tab === 0 ? following : followers).map((f: any) => (
            <ListItem
              key={f._id}
              secondaryAction={
                tab === 0 ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={async () => {
                      await api.post("/users/unfollow", { userId: f._id }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      setFollowing(following.filter((u: any) => u._id !== f._id));
                    }}
                  >
                    Unfollow
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={async () => {
                      await api.post("/users/follow", { userId: f._id }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      setFollowing([...following, f]);
                    }}
                  >
                    Follow
                  </Button>
                )
              }
            >
              <Avatar src={f.profilePicture ? f.profilePicture : undefined} sx={{ mr: 2 }}>
                {!f.profilePicture && (
                  <span style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2196f3', color: '#fff', borderRadius: '50%' }}>
                    {`${(f.firstName?.[0] || "").toUpperCase()}${(f.lastName?.[0] || "").toUpperCase()}`}
                  </span>
                )}
              </Avatar>
              <ListItemText
                primary={`${f.firstName} ${f.lastName}`}
                secondary={f.specialization || f.userType}
              />
            </ListItem>
          ))}
        </List>
      </Card>
    </Box>
  );
}
