import { Card, CardContent, Typography } from '@mui/material';
import { Box } from '@mui/material';
import Link from 'next/link';

export default function BadgeCard({ badge }: { badge: any }) {
  // Color map for badge types
  // More varied colors for badges, alternating by index
  const colorList = [
    'linear-gradient(135deg, #2193b0 60%, #6dd5ed 100%)',
    'linear-gradient(135deg, #ff9800 60%, #ffe082 100%)',
    'linear-gradient(135deg, #43a047 60%, #a5d6a7 100%)',
    'linear-gradient(135deg, #ffb300 60%, #fff176 100%)',
    'linear-gradient(135deg, #8e24aa 60%, #ce93d8 100%)',
    'linear-gradient(135deg, #e53935 60%, #ff8a65 100%)',
    'linear-gradient(135deg, #00bcd4 60%, #b2ebf2 100%)',
    'linear-gradient(135deg, #cddc39 60%, #f0f4c3 100%)',
    'linear-gradient(135deg, #f44336 60%, #ffcdd2 100%)',
  ];
  // Use badge._idx if available, else randomize
  const badgeIdx = badge._idx !== undefined ? badge._idx : Math.floor(Math.random() * colorList.length);
  const badgeBg = colorList[badgeIdx % colorList.length];
  return (
    <Card sx={{ mb: 2, borderRadius: 4, boxShadow: '0 2px 8px #2193b022', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 220 }}>
      <Box sx={{
        width: 128,
        height: 128,
        borderRadius: '50%',
        background: badgeBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 18px 2px #2193b044`,
        
        mb: 2,
        overflow: 'hidden',
        paddingTop: 2.5,
      }}>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          color="#fff"
          sx={{
            fontSize: 22,
            textShadow: '0 1px 4px #2193b044',
            textAlign: 'center',
            width: '90%',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: 1.2,
            mx: 'auto',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          {badge.name}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
        {badge.description}
      </Typography>
    </Card>
  );
}
