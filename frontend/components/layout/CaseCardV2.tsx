import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Stack,
  Button,
  Avatar,
} from '@mui/material';
import Link from 'next/link';
import { Calendar, ArrowRight, Stethoscope } from 'lucide-react';

export interface CaseCardData {
  _id: string;
  title?: string;
  description?: string;
  specialization?: string;
  specialty?: string;
  difficulty?: string;
  tags?: string[];
  key_topics?: string[];
  createdAt?: string;
  doctor?: {
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  images?: string[];
}

export interface CaseCardV2Props {
  caseData: CaseCardData;
  onViewDetails?: (id: string) => void;
  href?: string;
}

const difficultyColors: Record<string, { bg: string; color: string }> = {
  Beginner: { bg: '#d1fae5', color: '#065f46' },
  Intermediate: { bg: '#fef3c7', color: '#92400e' },
  Advanced: { bg: '#fee2e2', color: '#991b1b' },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function getOwnerName(caseData: CaseCardData): string {
  if (caseData.doctor) {
    const { firstName, lastName } = caseData.doctor;
    if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
  }
  return 'Medical Professional';
}

export default function CaseCardV2({ caseData, onViewDetails, href }: CaseCardV2Props) {
  const specialty = caseData.specialization || caseData.specialty || 'General';
  const difficulty = caseData.difficulty
  ? caseData.difficulty.charAt(0).toUpperCase() + caseData.difficulty.slice(1).toLowerCase()
  : 'Intermediate';
  const diffStyle = difficultyColors[difficulty] || difficultyColors.Intermediate;
  const topics = caseData.key_topics?.length
    ? caseData.key_topics
    : (caseData.tags || []).slice(0, 3);
  const desc = caseData.description || 'No description provided.';
  const shortDesc = desc.length > 140 ? `${desc.slice(0, 140)}…` : desc;
  const detailHref = href || `/cases/${caseData._id}`;
  const ownerName = getOwnerName(caseData);
  const dateLabel = formatDate(caseData.createdAt);
  const readingTime = Math.max(
  1,
  Math.ceil(
    ((caseData.description ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length) / 200
  )
);

  return (
    <Card
      component="article"
      aria-label={`Case: ${caseData.title || 'Untitled'}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          boxShadow: (theme) => theme.custom.cardShadowHover,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ flex: 1, p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
          <Chip
  label={`⏱ ${readingTime} min read`}
  size="small"
  variant="outlined"
  sx={{
    borderRadius: "8px",
    fontWeight: 500,
    bgcolor: "#f5f5f5",
  }}
/>
          <Chip
            icon={<Stethoscope size={14} />}
            label={specialty}
            size="small"
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.dark',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'primary.main' },
            }}
          />
          <Chip
            label={difficulty}
            size="small"
            sx={{
              bgcolor: diffStyle.bg,
              color: diffStyle.color,
              fontWeight: 600,
            }}
          />
        </Stack>

        <Typography
          variant="h6"
          component="h3"
          fontWeight={700}
          sx={{
            mb: 1,
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {caseData.title || 'Untitled Case'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          {shortDesc}
        </Typography>

        {topics.length > 0 && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {topics.map((topic) => (
              <Chip
                key={topic}
                label={topic}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: 24,
                  borderColor: 'divider',
                  color: 'text.secondary',
                }}
              />
            ))}
          </Stack>
        )}

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              src={caseData.doctor?.profilePicture}
              sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.light', color: 'primary.main' }}
            >
              {ownerName[0]}
            </Avatar>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {ownerName}
            </Typography>
          </Stack>
          {dateLabel && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Calendar size={13} color="#94a3b8" aria-hidden />
              <Typography variant="caption" color="text.disabled">
                {dateLabel}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ px: { xs: 2, sm: 2.5 }, pb: { xs: 2, sm: 2.5 }, pt: 0 }}>
        {onViewDetails ? (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            endIcon={<ArrowRight size={16} />}
            onClick={() => onViewDetails(caseData._id)}
            aria-label={`View details for ${caseData.title || 'case'}`}
          >
            View Case
          </Button>
        ) : (
          <Button
            fullWidth
            component={Link}
            href={detailHref}
            variant="contained"
            color="primary"
            endIcon={<ArrowRight size={16} />}
            aria-label={`View details for ${caseData.title || 'case'}`}
          >
            View Case
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
