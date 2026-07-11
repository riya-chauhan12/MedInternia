import React from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Divider,
  Paper,
  Button
} from '@mui/material';

export interface JobFiltersProps {
  specialties: string[];
  onSpecialtiesChange: (s: string[]) => void;
  experience: string;
  onExperienceChange: (e: string) => void;
  isRemote: boolean;
  onRemoteChange: (r: boolean) => void;
  visaSponsorship: boolean;
  onVisaChange: (v: boolean) => void;
  onClear: () => void;
}

const SPECIALTY_OPTIONS = [
  'General', 'Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Surgery',
  'Psychiatry', 'Radiology', 'Emergency', 'Internal-Medicine'
];

export default function JobFilters({
  specialties,
  onSpecialtiesChange,
  experience,
  onExperienceChange,
  isRemote,
  onRemoteChange,
  visaSponsorship,
  onVisaChange,
  onClear
}: JobFiltersProps) {
  
  const handleSpecialtyToggle = (spec: string) => {
    const val = spec.toLowerCase();
    if (specialties.includes(val)) {
      onSpecialtiesChange(specialties.filter(s => s !== val));
    } else {
      onSpecialtiesChange([...specialties, val]);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Filters</Typography>
        <Button size="small" onClick={onClear} sx={{ textTransform: 'none', color: 'text.secondary' }}>
          Clear All
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
        Specialty
      </Typography>
      <FormGroup sx={{ mb: 3 }}>
        {SPECIALTY_OPTIONS.map((spec) => (
          <FormControlLabel
            key={spec}
            control={
              <Checkbox 
                size="small" 
                checked={specialties.includes(spec.toLowerCase())}
                onChange={() => handleSpecialtyToggle(spec)}
              />
            }
            label={<Typography variant="body2">{spec}</Typography>}
          />
        ))}
      </FormGroup>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
        Max Experience Required
      </Typography>
      <RadioGroup
        value={experience}
        onChange={(e) => onExperienceChange(e.target.value)}
        sx={{ mb: 3 }}
      >
        <FormControlLabel value="" control={<Radio size="small" />} label={<Typography variant="body2">Any Experience</Typography>} />
        <FormControlLabel value="1" control={<Radio size="small" />} label={<Typography variant="body2">Entry Level (0-1 yrs)</Typography>} />
        <FormControlLabel value="3" control={<Radio size="small" />} label={<Typography variant="body2">Mid Level (1-3 yrs)</Typography>} />
        <FormControlLabel value="5" control={<Radio size="small" />} label={<Typography variant="body2">Senior Level (5+ yrs)</Typography>} />
      </RadioGroup>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
        Work Model
      </Typography>
      <FormGroup sx={{ mb: 3 }}>
        <FormControlLabel
          control={<Checkbox size="small" checked={isRemote} onChange={(e) => onRemoteChange(e.target.checked)} />}
          label={<Typography variant="body2">Remote Only</Typography>}
        />
      </FormGroup>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
        Visa Sponsorship
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={<Switch size="small" checked={visaSponsorship} onChange={(e) => onVisaChange(e.target.checked)} color="primary" />}
          label={<Typography variant="body2">Offers Sponsorship</Typography>}
        />
      </FormGroup>
    </Paper>
  );
}
