import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import Link from 'next/link';

export default function CertificateCard({ certificate }: { certificate: any }) {
  return (
    <Card sx={{ mb: 2, boxShadow: 2, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" component={Link} href={`/certificates/${certificate.certificateId}`}>{certificate.title}</Typography>
        <Typography variant="body2" color="text.secondary">{certificate.description}</Typography>
        <Box mt={1} display="flex" gap={1} flexWrap="wrap">
          {certificate.skills?.map((skill: string) => (
            <Chip key={skill} label={skill} color="primary" size="small" />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary">Issued by: {certificate.doctor?.firstName} {certificate.doctor?.lastName}</Typography>
      </CardContent>
    </Card>
  );
}
