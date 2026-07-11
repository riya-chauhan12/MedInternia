import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface ResumeExportButtonProps {
  user: any;
  badges?: any[];
}

export default function ResumeExportButton({ user, badges = [] }: ResumeExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Dynamically import to avoid SSR errors
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      // --- Helper functions ---

      const addText = (
        text: string,
        x: number,
        y: number,
        options: {
          fontSize?: number;
          fontStyle?: 'normal' | 'bold' | 'italic';
          color?: [number, number, number];
          maxWidth?: number;
          lineHeight?: number;
        } = {}
      ): number => {
        const {
          fontSize = 11,
          fontStyle = 'normal',
          color = [50, 50, 50],
          maxWidth = contentWidth,
          lineHeight = fontSize * 0.5,
        } = options;

        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        doc.setTextColor(...color);

        const lines = doc.splitTextToSize(text || '', maxWidth);
        const totalHeight = lines.length * lineHeight;

        if (y + totalHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        doc.text(lines, x, y);
        return y + totalHeight + 3;
      };

      const drawSectionHeader = (label: string, y: number, bgColor: [number, number, number] = [0, 86, 204]): number => {
        if (y + 12 > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.setFillColor(...bgColor);
        doc.roundedRect(margin, y - 5, contentWidth, 8, 1, 1, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(label, margin + 3, y + 0.5);
        return y + 8;
      };

      // --- Build PDF ---

      // Header: Name and Specialization
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      yPos = addText(fullName, margin, yPos, { fontSize: 24, fontStyle: 'bold', color: [0, 86, 204] });
      
      const roleText = user.userType === 'doctor' && user.specialization 
        ? `Medical Doctor - ${user.specialization}`
        : user.userType === 'patient' 
          ? 'Patient Profile' 
          : 'Medical Intern';
      yPos = addText(roleText, margin, yPos, { fontSize: 14, fontStyle: 'italic', color: [100, 100, 100] });
      
      // Contact Info
      let contactInfo = `${user.email || ''}`;
      if (user.phone) contactInfo += ` | ${user.phone}`;
      if (user.linkedInProfile) contactInfo += ` | LinkedIn`;
      if (user.githubProfile) contactInfo += ` | GitHub`;
      yPos = addText(contactInfo, margin, yPos, { fontSize: 10, color: [80, 80, 80] });
      
      yPos += 5;

      // Summary / Bio
      if (user.bio) {
        yPos = drawSectionHeader('Professional Summary', yPos);
        yPos = addText(user.bio, margin, yPos);
        yPos += 4;
      }

      // Experience & Education
      yPos = drawSectionHeader('Background & Education', yPos);
      if (user.medicalSchool) {
        yPos = addText(`Medical School: ${user.medicalSchool}`, margin, yPos, { fontStyle: 'bold' });
      }
      if (user.yearOfStudy) {
        yPos = addText(`Year of Study: ${user.yearOfStudy}`, margin, yPos);
      }
      if (user.experience) {
        yPos = addText(`Experience: ${user.experience} Years`, margin, yPos, { fontStyle: 'bold' });
      }
      if (user.licenseNumber) {
        yPos = addText(`License Number: ${user.licenseNumber}`, margin, yPos);
      }
      if (user.interests && user.interests.length > 0) {
        yPos = addText(`Clinical Interests: ${user.interests.join(', ')}`, margin, yPos);
      }
      yPos += 4;

      // MedInternia Contributions
      yPos = drawSectionHeader('MedInternia Contributions & Stats', yPos);
      yPos = addText(`Platform Points: ${user.points || 0}`, margin, yPos, { fontStyle: 'bold', color: [0, 114, 255] });
      yPos = addText(`Cases Analyzed: ${user.casesAnalyzed || 0}`, margin, yPos);
      yPos = addText(`Peer Reviews Given: ${user.peerReviewsGiven || 0}`, margin, yPos);
      yPos = addText(`Certificates Earned: ${user.certificatesEarned || 0}`, margin, yPos);
      if (user.streak) {
        yPos = addText(`Current Activity Streak: ${user.streak} days`, margin, yPos);
      }
      yPos += 4;

      // Badges
      if (badges && badges.length > 0) {
        yPos = drawSectionHeader('Achievements & Badges', yPos);
        badges.forEach((b: any) => {
          const badgeName = b.badge?.name || b.name || 'Unknown Badge';
          const badgeDesc = b.badge?.description || b.description || '';
          yPos = addText(`• ${badgeName}`, margin, yPos, { fontStyle: 'bold' });
          if (badgeDesc) {
            yPos = addText(`  ${badgeDesc}`, margin, yPos, { fontSize: 10, color: [100, 100, 100] });
          }
        });
        yPos += 4;
      }

      // Footer
      const footerText = `Generated by MedInternia • ${new Date().toLocaleDateString()}`;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save the PDF
      const filename = `${(user.firstName || 'User').replace(/\\s+/g, '_')}_${(user.lastName || '').replace(/\\s+/g, '_')}_MedInternia_CV.pdf`;
      doc.save(filename);

    } catch (error) {
      console.error('Failed to generate CV PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleExport}
      disabled={loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 600,
        px: 3,
        bgcolor: '#0056cc',
        '&:hover': {
          bgcolor: '#0043a4'
        }
      }}
    >
      {loading ? 'Generating...' : 'Export to PDF (CV)'}
    </Button>
  );
}
