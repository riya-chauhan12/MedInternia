import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
  Paper,
  IconButton,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Search, X } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  specialtyValue?: string;
  onSpecialtyChange?: (value: string) => void;
  specialtyOptions?: FilterOption[];
  difficultyValue?: string;
  onDifficultyChange?: (value: string) => void;
  difficultyOptions?: FilterOption[];
  isRareDiseaseValue?: boolean;
  onRareDiseaseChange?: (value: boolean) => void;
  onClear?: () => void;
}

const defaultSpecialties: FilterOption[] = [
  { value: '', label: 'All Specialties' },
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'Neurology', label: 'Neurology' },
  { value: 'Pulmonology', label: 'Pulmonology' },
  { value: 'Gastroenterology', label: 'Gastroenterology' },
  { value: 'Orthopedics', label: 'Orthopedics' },
  { value: 'General', label: 'General' },
];

const defaultDifficulties: FilterOption[] = [
  { value: '', label: 'All Levels' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search by title or topic…',
  specialtyValue = '',
  onSpecialtyChange,
  specialtyOptions = defaultSpecialties,
  difficultyValue = '',
  onDifficultyChange,
  difficultyOptions = defaultDifficulties,
  isRareDiseaseValue = false,
  onRareDiseaseChange,
  onClear,
}: FilterBarProps) {
  const hasActiveFilters = Boolean(searchValue || specialtyValue || difficultyValue || isRareDiseaseValue);

  return (
    <Paper
      component="section"
      aria-label="Filter cases"
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <TextField
          fullWidth
          size="small"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search cases"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#64748b" aria-hidden />
              </InputAdornment>
            ),
            endAdornment: searchValue ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Clear search"
                  onClick={() => onSearchChange('')}
                >
                  <X size={16} />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
          sx={{ flex: { md: 2 } }}
        />

        {onSpecialtyChange && (
          <TextField
            select
            fullWidth
            size="small"
            label="Specialty"
            value={specialtyValue}
            onChange={(e) => onSpecialtyChange(e.target.value)}
            aria-label="Filter by specialty"
            sx={{ flex: { md: 1 }, minWidth: { md: 160 } }}
          >
            {specialtyOptions.map((opt) => (
              <MenuItem key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        )}

        {onDifficultyChange && (
          <TextField
            select
            fullWidth
            size="small"
            label="Difficulty"
            value={difficultyValue}
            onChange={(e) => onDifficultyChange(e.target.value)}
            aria-label="Filter by difficulty"
            sx={{ flex: { md: 1 }, minWidth: { md: 160 } }}
          >
            {difficultyOptions.map((opt) => (
              <MenuItem key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        )}

        {onRareDiseaseChange && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: { md: 2 } }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={isRareDiseaseValue}
                  onChange={(e) => onRareDiseaseChange(e.target.checked)}
                  color="primary"
                />
              }
              label="Rare Diseases"
              sx={{ whiteSpace: 'nowrap', mr: 0 }}
            />
          </Box>
        )}

        {hasActiveFilters && onClear && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={onClear}
              aria-label="Clear all filters"
              sx={{
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 2,
                width: { xs: '100%', md: 'auto' },
              }}
            >
              <X size={16} style={{ marginRight: 6 }} />
              Clear
            </IconButton>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
