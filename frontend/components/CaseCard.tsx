import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Button, Box, Avatar, Stack, IconButton, Tooltip } from "@mui/material";
import Link from "next/link";
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import {getCurrentUserRole} from "../utils/permissions";
import api from "../utils/api";

// Helper to get owner name from doctor field
function getOwnerName(caseData: any) {
  if (caseData?.doctor && typeof caseData.doctor === 'object') {
    const { firstName, lastName } = caseData.doctor;
    if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
  }
  if (caseData?.owner && typeof caseData.owner === 'object') {
    const { firstName, lastName, name } = caseData.owner;
    if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
    if (name) return name;
  }
  return "Unknown";
}
function getOwnerAvatar(caseData: any) {
  if (caseData?.doctor && typeof caseData.doctor === 'object') {
    return caseData.doctor.profilePicture || undefined;
  }
  if (caseData?.owner && typeof caseData.owner === 'object') {
    return caseData.owner.avatarUrl || undefined;
  }
  return undefined;
}

export default function CaseCard({ caseData, onOpenDiscussion, onReadMore, isExpanded }: { caseData: any, onOpenDiscussion?: (caseId: string) => void, onReadMore?: () => void, isExpanded?: boolean }) {
  const [starred, setStarred] = useState(false);
  const [starring, setStarring] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const userRole = getCurrentUserRole();

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    const starredBy = caseData.starredBy || [];
    setStarred(userId ? starredBy.some((id: any) => id.toString() === userId) : false);
  }, [caseData, userId]);

  const handleStarClick = async () => {
    if (starring) return;
    setStarring(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/cases/${caseData._id}/star`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStarred(res.data.data.isStarred);
    } catch (err) {
      console.error('Failed to star case', err);
    } finally {
      setStarring(false);
    }
  };

  // Pin icon click handler
  const handlePinIconClick = () => {
    setShowPinned(prev => !prev);
  };
  // Status accent color and icon
  const statusMap = {
    Open: { color: "#1976d2", icon: "🔵" },
    Closed: { color: "#bdbdbd", icon: "🔒" },
    Pending: { color: "#64b5f6", icon: "⏳" },
  };

  const status: keyof typeof statusMap =
    (caseData?.status as keyof typeof statusMap) || "Open";
  const accent = statusMap[status] || statusMap["Open"];

  // Helper: get owner name and avatar (prefer doctor field)
  const ownerName = getOwnerName(caseData);
  const ownerAvatar = getOwnerAvatar(caseData);
  // Helper: get images (array of URLs)
  const images = Array.isArray(caseData?.images) ? caseData.images : [];
  // Helper: truncated description
  const desc = caseData?.description || "No description.";
  const shortDesc = desc.length > 180 ? desc.slice(0, 180) + "..." : desc;


  // Color palette for the circle
  // Pick a color based on case id (stable per card)

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 24px #0072ff22', mb: 3, animation: 'fadeInCard 0.7s' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
          <Avatar src={ownerAvatar} sx={{ width: 48, height: 48, fontWeight: 700, fontSize: 22, bgcolor: '#e3f2fd', color: '#1976d2' }}>{ownerName[0]}</Avatar>
          <Box>
            <Typography fontWeight={700} fontSize={17} color="#1976d2">{ownerName}</Typography>
            <Typography fontSize={13} color="#888">Case Owner</Typography>
          </Box>
          <Box sx={{ ml: 'auto', textAlign: 'right' }}>
            <Typography fontSize={12} color="#94a3b8">
              {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </Typography>
          </Box>
        </Stack>
        {/* Title and status */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5, justifyContent: 'space-between', gap: 2 }}>
          <Link href={`/cases/${caseData._id}`} passHref style={{ textDecoration: 'none', flex: 1 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              color="#0056cc"
              sx={{
                letterSpacing: 0.5,
                cursor: 'pointer',
                '&:hover': {
                  color: '#0072ff',
                }
              }}
            >
              {caseData?.title || "Untitled Case"}
            </Typography>
          </Link>
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
            {status}
            {/* Interactive Star and Pin icons with tooltips and color scheme */}
            <Tooltip title={starred ? 'Unstar' : 'Star'}>
              <IconButton
                onClick={handleStarClick}
                disabled={starring}
                sx={{
                  color: starred ? '#FFD700' : '#0072ff',
                  transition: 'color 0.2s, transform 0.18s',
                  transform: starred ? 'scale(1.15)' : 'scale(1)',
                  ml: 1,
                  '&:hover': {
                    color: '#FFC107',
                    background: '#e3f6fc',
                  },
                }}
                size="small"
              >
                {starred ? <StarRoundedIcon fontSize="inherit" /> : <StarBorderRoundedIcon fontSize="inherit" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Badges and Chips */}
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {caseData?.specialization && (
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                bgcolor: '#ebf8ff',
                color: '#2b6cb0',
                border: '1px solid #bee3f8',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              🩺 {caseData.specialization}
            </Box>
          )}
          {caseData?.difficulty && (
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'capitalize',
                ...(() => {
                  switch (caseData.difficulty.toLowerCase()) {
                    case 'beginner':
                      return { bgcolor: '#e6fffa', color: '#00a389', border: '1px solid #b2f5ea' };
                    case 'advanced':
                    case 'complex':
                      return { bgcolor: '#fff5f5', color: '#e53e3e', border: '1px solid #feb2b2' };
                    default: // intermediate
                      return { bgcolor: '#fffaf0', color: '#dd6b20', border: '1px solid #fbd38d' };
                  }
                })()
              }}
            >
              ⚡ {caseData.difficulty}
            </Box>
          )}
        </Stack>

        {/* Description preview */}
        <Typography color="#444" fontSize={16} sx={{ mb: images.length ? 1 : 2, mt: 0.5, fontWeight: 400 }}>
          {shortDesc}
        </Typography>
        {/* Images preview */}
        {images.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {images.slice(0, 3).map((img: string, idx: number) => (
              <Box key={idx} sx={{ width: 70, height: 70, borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 6px #0072ff22', border: '1px solid #e3eafc', bgcolor: '#f8fbff' }}>
                <img src={img} alt={`case-img-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ))}
          </Box>
        )}
        {/* View Details Button */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Button
            variant="contained"
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.1,
              fontWeight: 700,
              fontSize: "1.05rem",
              background: "linear-gradient(90deg, #0072ff 0%, #6dd5ed 100%)",
              color: "#fff",
              boxShadow: "0 2px 8px #0072ff44",
              letterSpacing: 1,
              transition: "all 0.2s",
              "&:hover": {
                background: "linear-gradient(90deg, #0056cc 0%, #0072ff 100%)",
                color: "#fff",
                boxShadow: "0 4px 16px #0072ff66",
                filter: "brightness(1.08)",
                transform: "scale(1.03)",
              },
            }}
            onClick={onReadMore}
          >
            {isExpanded ? 'Show Less' : 'Read More'}
          </Button>
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
              ml: 1,
              "&:hover": {
                background: "#e3f2fd",
                borderColor: "#0056cc",
                color: "#0056cc",
              },
            }}
            onClick={() => onOpenDiscussion && onOpenDiscussion(caseData._id)}
            disabled={userRole === 'patient'}
          >
            Discussions
          </Button>
        </Box>
  {/* Comments section removed. Pin/unpin will be handled in the discussions modal/page. */}

        {/* Pinned discussions section, smooth transition */}
        <Box sx={{
          maxHeight: showPinned ? 400 : 0,
          opacity: showPinned ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.5s cubic-bezier(.4,0,.2,1), opacity 0.4s',
          mt: 2,
          mb: showPinned ? 2 : 0,
          bgcolor: '#f5fafd',
          borderRadius: 3,
          boxShadow: showPinned ? '0 2px 12px #1976d222' : 'none',
          p: showPinned ? 2 : 0,
        }}>
          {showPinned && (
            <Typography fontWeight={700} fontSize={18} color="#1976d2" sx={{ mb: 1 }}>
              Pinned Discussions
            </Typography>
          )}
          {/* You can render pinned discussions here, e.g. from props or context */}
          {showPinned && (
            <Typography color="#888" fontSize={15}>
              (Pinned discussions will appear here)
            </Typography>
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