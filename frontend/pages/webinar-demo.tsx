import React, { useState } from 'react';
import {
  Box, Typography, Grid, Paper, TextField, InputAdornment, IconButton,
  Divider, Chip, Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import TranscriptIcon from '@mui/icons-material/DescriptionOutlined';
import Navbar from '../components/Navbar';

export default function WebinarTranscriptDemo() {
  const [search, setSearch] = useState('');

  const transcript = [
    { time: '00:00', speaker: 'Dr. Sarah Jenkins', text: 'Welcome everyone to today’s grand rounds. We will be discussing the latest guidelines on management of acute decompensated heart failure.' },
    { time: '02:15', speaker: 'Dr. Mark Thorne', text: 'Thank you, Sarah. Let’s start by looking at the baseline admission criteria. When we see a patient with elevated pro-BNP and pulmonary edema...' },
    { time: '05:30', speaker: 'Dr. Mark Thorne', text: 'The cornerstone of initial therapy remains intravenous loop diuretics. We typically start with furosemide, transitioning to continuous infusion if bolus dosing is inadequate.' },
    { time: '08:45', speaker: 'Dr. Sarah Jenkins', text: 'Right, and the recent DOSE trial really highlighted that high-dose strategies don’t necessarily worsen renal outcomes compared to low-dose.' },
    { time: '12:10', speaker: 'Dr. Mark Thorne', text: 'Exactly. Now, what do we do when patients are resistant to loop diuretics? That’s where sequential nephron blockade comes in. Adding a thiazide like metolazone can be very effective.' },
    { time: '15:25', speaker: 'Dr. Sarah Jenkins', text: 'Just be extremely careful with electrolyte monitoring, particularly potassium and magnesium, once you start sequential blockade.' },
    { time: '19:40', speaker: 'Dr. Mark Thorne', text: 'Moving on to vasodilators. Nitroglycerin is excellent for preload reduction, especially in hypertensive acute heart failure.' },
  ];

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 8 }}>
      <Navbar />
      
      {/* Header */}
      <Box sx={{ bgcolor: '#1e293b', color: 'white', pt: 12, pb: 4, mb: 4 }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3 }}>
          <Chip label="Recorded Webinar" color="primary" size="small" sx={{ mb: 2, fontWeight: 700 }} />
          <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
            Advanced Management of Acute Decompensated Heart Failure
          </Typography>
          <Typography variant="subtitle1" color="#94a3b8">
            Presented by Dr. Sarah Jenkins & Dr. Mark Thorne • 45 mins • 2,103 views
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3 }}>
        <Grid container spacing={4}>
          
          {/* Video Player Mock */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper elevation={0} sx={{ 
              borderRadius: 4, overflow: 'hidden', bgcolor: 'black', 
              position: 'relative', aspectRatio: '16/9'
            }}>
              <video
                width="100%"
                height="100%"
                controls
                style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
                poster="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200"
              >
                <source src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </Paper>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Webinar Description</Typography>
              <Typography variant="body1" color="#334155" lineHeight={1.8}>
                This session covers the latest clinical guidelines for managing acute decompensated heart failure, 
                focusing on diuretic resistance, sequential nephron blockade, and the timing of vasodilator therapy.
              </Typography>
            </Box>
          </Grid>

          {/* Transcript Panel */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper elevation={0} sx={{ height: '700px', display: 'flex', flexDirection: 'column', borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
              
              {/* Transcript Header & Search */}
              <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TranscriptIcon color="primary" /> Interactive Transcript
                </Typography>
                <TextField 
                  fullWidth
                  placeholder="Search transcript..."
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ bgcolor: 'white', borderRadius: 1 }}
                />
              </Box>

              {/* Transcript Scrollable Area */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                {transcript
                  .filter(t => t.text.toLowerCase().includes(search.toLowerCase()))
                  .map((t, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      mb: 3, p: 2, borderRadius: 2, transition: 'all 0.2s', cursor: 'pointer',
                      '&:hover': { bgcolor: '#f1f5f9' },
                      border: index === 5 ? '1px solid #3b82f6' : '1px solid transparent',
                      bgcolor: index === 5 ? '#eff6ff' : 'transparent'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={t.time} size="small" sx={{ fontWeight: 800, bgcolor: index === 5 ? 'primary.main' : '#e2e8f0', color: index === 5 ? 'white' : '#475569' }} />
                      <Typography variant="subtitle2" fontWeight={800} color="#0f172a">{t.speaker}</Typography>
                    </Box>
                    <Typography variant="body2" color="#334155" lineHeight={1.6}>
                      {t.text}
                    </Typography>
                  </Box>
                ))}
                {transcript.filter(t => t.text.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <Typography color="text.secondary" textAlign="center" mt={4}>No matches found.</Typography>
                )}
              </Box>
              
            </Paper>
          </Grid>

        </Grid>
      </Box>
    </Box>
  );
}
