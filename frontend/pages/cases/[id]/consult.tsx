import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Typography, Grid, Paper, IconButton, Button, Avatar,
  Divider, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemAvatar, ListItemText,
  Tooltip
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import CallEndIcon from '@mui/icons-material/CallEnd';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SendIcon from '@mui/icons-material/Send';
import InfoIcon from '@mui/icons-material/Info';

export default function ConsultRoom() {
  const router = useRouter();
  const { id } = router.query;
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const participants = [
    { id: 1, name: 'Dr. Sarah Jenkins', role: 'Oncology', me: true, video: videoOn },
    { id: 2, name: 'Dr. Michael Chen', role: 'Radiology', me: false, video: true },
    { id: 3, name: 'Dr. Emily Carter', role: 'Surgery', me: false, video: false },
  ];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: 'white' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1e293b', borderBottom: '1px solid #334155' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Virtual Consult Room</Typography>
          <Typography variant="body2" color="#94a3b8">Case #{id} • Multidisciplinary Tumor Board</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => setInviteOpen(true)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Invite Specialists
        </Button>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Video Grid */}
        <Box sx={{ flex: 1, p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, overflowY: 'auto' }}>
          {participants.map((p) => (
            <Paper
              key={p.id}
              elevation={4}
              sx={{
                flex: '1 1 calc(50% - 16px)',
                minHeight: '300px',
                bgcolor: p.video ? '#334155' : '#1e293b',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #475569'
              }}
            >
              {!p.video && (
                <Avatar sx={{ width: 80, height: 80, bgcolor: '#475569', fontSize: 32 }}>
                  {p.name.charAt(4)}
                </Avatar>
              )}
              {p.video && (
                <Typography variant="h4" color="#94a3b8" sx={{ opacity: 0.5 }}>
                  (Video Feed)
                </Typography>
              )}
              <Box sx={{ position: 'absolute', bottom: 12, left: 12, bgcolor: 'rgba(0,0,0,0.6)', px: 2, py: 0.5, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600} color="white">
                  {p.name} {p.me ? '(You)' : ''}
                </Typography>
                <Typography variant="caption" color="#cbd5e1">{p.role}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Right Panel (Chat & Context) */}
        <Box sx={{ width: 360, bgcolor: '#1e293b', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #334155' }}>
          {/* Case Context Snippet */}
          <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <InfoIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700} color="white">Case Context</Typography>
            </Box>
            <Typography variant="body2" color="#94a3b8" sx={{ lineHeight: 1.5 }}>
              45y/o female presenting with a 3cm mass in the right breast. Core biopsy confirms invasive ductal carcinoma. Requesting input on neo-adjuvant vs surgical first approach.
            </Typography>
          </Box>

          {/* Chat Area */}
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="#94a3b8" fontWeight={700}>Dr. Michael Chen (Radiology) • 10:42 AM</Typography>
              <Paper sx={{ p: 1.5, mt: 0.5, bgcolor: '#334155', color: 'white', borderRadius: 2, borderTopLeftRadius: 0 }}>
                I've reviewed the recent MRI. The margins look relatively clear but it's close to the chest wall.
              </Paper>
            </Box>
            <Box sx={{ mb: 2, textAlign: 'right' }}>
              <Typography variant="caption" color="#94a3b8" fontWeight={700}>You • 10:43 AM</Typography>
              <Paper sx={{ p: 1.5, mt: 0.5, bgcolor: '#2563eb', color: 'white', borderRadius: 2, borderTopRightRadius: 0, display: 'inline-block' }}>
                Thanks Michael. Emily, what are your thoughts from a surgical perspective?
              </Paper>
            </Box>
          </Box>

          {/* Chat Input */}
          <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              variant="outlined"
              sx={{
                input: { color: 'white' },
                fieldset: { borderColor: '#475569' },
                '&:hover fieldset': { borderColor: '#64748b' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                bgcolor: '#0f172a',
                borderRadius: 2
              }}
              InputProps={{
                endAdornment: (
                  <IconButton size="small" color="primary">
                    <SendIcon fontSize="small" />
                  </IconButton>
                )
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Control Bar */}
      <Box sx={{ p: 2, bgcolor: '#0f172a', display: 'flex', justifyContent: 'center', gap: 2, borderTop: '1px solid #334155' }}>
        <Tooltip title={micOn ? "Mute" : "Unmute"}>
          <IconButton 
            onClick={() => setMicOn(!micOn)} 
            sx={{ bgcolor: micOn ? '#334155' : '#ef4444', color: 'white', width: 56, height: 56, '&:hover': { bgcolor: micOn ? '#475569' : '#dc2626' } }}
          >
            {micOn ? <MicIcon fontSize="large" /> : <MicOffIcon fontSize="large" />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title={videoOn ? "Stop Video" : "Start Video"}>
          <IconButton 
            onClick={() => setVideoOn(!videoOn)} 
            sx={{ bgcolor: videoOn ? '#334155' : '#ef4444', color: 'white', width: 56, height: 56, '&:hover': { bgcolor: videoOn ? '#475569' : '#dc2626' } }}
          >
            {videoOn ? <VideocamIcon fontSize="large" /> : <VideocamOffIcon fontSize="large" />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Share Screen">
          <IconButton sx={{ bgcolor: '#334155', color: 'white', width: 56, height: 56, '&:hover': { bgcolor: '#475569' } }}>
            <ScreenShareIcon fontSize="large" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Leave Room">
          <IconButton 
            onClick={() => router.push(`/cases/${id}`)}
            sx={{ bgcolor: '#ef4444', color: 'white', width: 80, height: 56, borderRadius: 8, '&:hover': { bgcolor: '#dc2626' } }}
          >
            <CallEndIcon fontSize="large" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Invite Specialists to Consult</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Search for verified specialists on MedInternia to join this real-time discussion.
          </Typography>
          <TextField
            fullWidth
            placeholder="Search by name or specialty (e.g., Oncology)"
            size="small"
            sx={{ mb: 3 }}
          />
          <List>
            <ListItem
              secondaryAction={<Button variant="contained" size="small" sx={{ textTransform: 'none' }}>Invite</Button>}
            >
              <ListItemAvatar><Avatar>DR</Avatar></ListItemAvatar>
              <ListItemText primary="Dr. David Ross" secondary="Chief of Oncology • Online" />
            </ListItem>
            <Divider component="li" />
            <ListItem
              secondaryAction={<Button variant="contained" size="small" sx={{ textTransform: 'none' }}>Invite</Button>}
            >
              <ListItemAvatar><Avatar>AL</Avatar></ListItemAvatar>
              <ListItemText primary="Dr. Amanda Lee" secondary="Surgical Oncology • In a consult" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInviteOpen(false)} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
