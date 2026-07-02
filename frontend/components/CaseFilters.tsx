import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';

export interface CaseFilterParams {
  search: string;
  specialization: string;
  sortBy: string;
}

interface CaseFiltersProps {
  filters: CaseFilterParams;
  onFilterChange: (filters: CaseFilterParams) => void;
  onClearFilters: () => void;
}

const specialties = [
  "All",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Oncology",
  "General Medicine",
  "Orthopedics",
  "Dermatology",
  "Psychiatry",
  "Emergency Medicine"
];

const CaseFilters: React.FC<CaseFiltersProps> = ({ filters, onFilterChange, onClearFilters }) => {
  const handleChange = (field: keyof CaseFilterParams) => (e: any) => {
    onFilterChange({ ...filters, [field]: e.target.value });
  };

  return (
    <Box sx={{
      p: 3, 
      mb: 4, 
      borderRadius: 4, 
      bgcolor: '#fff', 
      boxShadow: '0 4px 20px #2193b01a',
      border: '1px solid #e3eafc'
    }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search cases by title, tags, or description..."
          value={filters.search}
          onChange={handleChange('search')}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          }}
          sx={{ flex: 2 }}
        />
        
        <FormControl fullWidth sx={{ flex: 1 }}>
          <InputLabel id="specialty-label">Specialty</InputLabel>
          <Select
            labelId="specialty-label"
            value={filters.specialization}
            label="Specialty"
            onChange={handleChange('specialization')}
            startAdornment={<FilterListIcon sx={{ color: 'text.secondary', ml: 1, mr: 1 }} />}
          >
            {specialties.map(spec => (
              <MenuItem key={spec} value={spec === 'All' ? '' : spec}>{spec}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ flex: 1 }}>
          <InputLabel id="sort-label">Sort By</InputLabel>
          <Select
            labelId="sort-label"
            value={filters.sortBy}
            label="Sort By"
            onChange={handleChange('sortBy')}
            startAdornment={<SortIcon sx={{ color: 'text.secondary', ml: 1, mr: 1 }} />}
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="most_discussed">Most Discussed</MenuItem>
            <MenuItem value="highest_rated">Highest Rated</MenuItem>
          </Select>
        </FormControl>

        {(filters.search || filters.specialization || filters.sortBy !== 'newest') && (
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={onClearFilters}
            sx={{ minWidth: 120, height: 56, borderRadius: 2 }}
          >
            Clear
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default CaseFilters;
