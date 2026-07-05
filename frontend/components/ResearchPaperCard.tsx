import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Button, Box, Stack, IconButton, Tooltip } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import { getAuthToken } from '../utils/api';

export default function ResearchPaperCard({ paper, onReadMore, onOpenDiscussion }: { paper: any, onReadMore?: () => void, onOpenDiscussion?: (id: string) => void }) {
  const [starred, setStarred] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Load starred/pinned state from localStorage
    let starredPapers: string[] = [];
    let pinnedPapers: string[] = [];
    try {
      starredPapers = JSON.parse(localStorage.getItem('starredPapers') || '[]');
    } catch {
      starredPapers = [];
    }
    try {
      pinnedPapers = JSON.parse(localStorage.getItem('pinnedPapers') || '[]');
    } catch {
      pinnedPapers = [];
    }
    setStarred(starredPapers.includes(paper._id));
    setPinned(pinnedPapers.includes(paper._id));
  }, [paper._id]);

  const handleStarClick = () => {
    setStarred(prev => {
      const newVal = !prev;
      try {
        const starredPapers = JSON.parse(localStorage.getItem('starredPapers') || '[]');
        if (newVal) {
          localStorage.setItem('starredPapers', JSON.stringify([...starredPapers, paper._id]));
        } else {
          localStorage.setItem('starredPapers', JSON.stringify(starredPapers.filter((id: string) => id !== paper._id)));
        }
      } catch {
        localStorage.setItem('starredPapers', JSON.stringify(newVal ? [paper._id] : []));
      }
      return newVal;
    });
  };
  const handlePinClick = () => {
    setPinned(prev => {
      const newVal = !prev;
      try {
        const pinnedPapers = JSON.parse(localStorage.getItem('pinnedPapers') || '[]');
        if (newVal) {
          localStorage.setItem('pinnedPapers', JSON.stringify([...pinnedPapers, paper._id]));
        } else {
          localStorage.setItem('pinnedPapers', JSON.stringify(pinnedPapers.filter((id: string) => id !== paper._id)));
        }
      } catch {
        localStorage.setItem('pinnedPapers', JSON.stringify(newVal ? [paper._id] : []));
      }
      return newVal;
    });
  };

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 24px #0072ff22', mb: 3, animation: 'fadeInCard 0.7s' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 1 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#e3f2fd', color: '#1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22 }}>
            RP
          </Box>
          <Box>
            <Typography fontWeight={700} fontSize={17} color="#1976d2">Research Paper</Typography>
            <Typography fontSize={13} color="#888">Author Unknown</Typography>
          </Box>
        </Stack>
        {/* Title and status */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight={800} color="#0056cc" sx={{ flex: 1, letterSpacing: 0.5 }}>{paper?.title || "Untitled Paper"}</Typography>
          <Box
            sx={{
              px: 2,
              py: 0.7,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
              color: '#1976d2',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 1px 4px #0072ff22',
              letterSpacing: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              border: '1.5px solid #90caf9',
            }}
          >
            <Tooltip title={starred ? 'Unstar' : 'Star'}>
              <IconButton
                onClick={handleStarClick}
                sx={{
                  color: starred ? '#FFD700' : '#0072ff',
                  transition: 'color 0.2s, transform 0.18s',
                  transform: starred ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: starred ? '0 2px 12px #ffd70088' : 'none',
                  ml: 1,
                  '&:hover': {
                    color: '#FFC107',
                    background: '#e3f6fc',
                  },
                }}
                size="large"
              >
                {starred ? <StarRoundedIcon fontSize="inherit" /> : <StarBorderRoundedIcon fontSize="inherit" />}
              </IconButton>
            </Tooltip>
            <Tooltip title={pinned ? 'Unpin' : 'Pin'}>
              <IconButton
                onClick={handlePinClick}
                sx={{
                  color: pinned ? '#e53935' : '#0072ff',
                  transition: 'color 0.2s, transform 0.18s',
                  transform: pinned ? 'rotate(-20deg) scale(1.15)' : 'scale(1)',
                  boxShadow: pinned ? '0 2px 12px #1976d288' : 'none',
                  ml: 1,
                  '&:hover': {
                    color: '#e57373',
                    background: '#e3f6fc',
                  },
                }}
                size="large"
              >
                {pinned ? <PushPinIcon fontSize="inherit" /> : <PushPinOutlinedIcon fontSize="inherit" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {/* Description preview with LinkedIn-style Read More */}
        {(() => {
          const desc = paper?.description || "No description.";
          const shortDesc = desc.length > 180 ? desc.slice(0, 180) + "..." : desc;
          return (
            <Typography color="#444" fontSize={16} sx={{ mb: 2, mt: 0.5, fontWeight: 400 }}>
              {expanded ? desc : shortDesc}
              {desc.length > 180 && (
                <Button
                  variant="text"
                  sx={{ ml: 1, fontWeight: 700, color: '#1976d2', textTransform: 'none', fontSize: 15, p: 0, minWidth: 0 }}
                  onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                >
                  {expanded ? 'Show Less' : 'Read More'}
                </Button>
              )}
            </Typography>
          );
        })()}
        {/* Field, Difficulty, PDF */}
        <Typography fontSize={15} color="#1976d2" mt={1}>
          Field: {paper.field} | Difficulty: {paper.difficulty}
        </Typography>
        {paper.fileUrl && (
          <Typography fontSize={13} color="#0072ff" mt={1}>
            PDF: {paper.fileUrl}
          </Typography>
        )}
        {/* View Details & Discussions */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.1,
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "#1976d2",
              borderColor: "#1976d2",
              letterSpacing: 1,
              boxShadow: "0 2px 8px #0072ff22",
              transition: "all 0.2s",
              ml: 0,
              "&:hover": {
                background: "#e3f2fd",
                borderColor: "#0056cc",
                color: "#0056cc",
              },
            }}
            onClick={() => onOpenDiscussion && onOpenDiscussion(paper._id)}
          >
            Discussions
          </Button>
          {paper.fileUrl && (
            <Button
              variant="outlined"
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.1,
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "#0072ff",
                borderColor: "#0072ff",
                letterSpacing: 1,
                boxShadow: "0 2px 8px #0072ff22",
                transition: "all 0.2s",
                ml: 1,
                "&:hover": {
                  background: "#e3f2fd",
                  borderColor: "#0056cc",
                  color: "#0056cc",
                },
              }}
              startIcon={<DownloadIcon />}
              onClick={async (e) => {
                e.preventDefault();
                // If fileUrl is a direct link, open in new tab
                if (/^https?:\/\//.test(paper.fileUrl)) {
                  window.open(paper.fileUrl, '_blank');
                  return;
                }
                // Otherwise, fetch from backend (simulate for now)
                try {
                  const token = getAuthToken();
                  const response = await fetch(`/api/research-papers/download/        ${encodeURIComponent(paper.fileUrl)}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                 });
                  if (!response.ok) throw new Error('File not found');
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = paper.fileUrl;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  alert('Failed to download PDF.');
                }
              }}
            >
              Download PDF
            </Button>
          )}
        </Box>
        <style jsx global>{`
          @keyframes fadeInCard {
            from {
              opacity: 0;
              transform: scale(0.98);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
