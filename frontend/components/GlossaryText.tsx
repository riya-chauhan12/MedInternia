import React, { useMemo } from 'react';
import { Tooltip, Box } from '@mui/material';
import { sortedGlossaryTerms } from '../utils/medicalGlossary';

interface GlossaryTextProps {
  text: string;
}

export default function GlossaryText({ text }: GlossaryTextProps) {
  const parsedContent = useMemo(() => {
    if (!text) return null;

    // Create a regex to match any of the glossary terms as whole words
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const termsPattern = sortedGlossaryTerms
      .map(item => escapeRegExp(item.term))
      .join('|');
      
    // \b matches word boundary. We use capturing group to keep the matched term
    const regex = new RegExp(`\\b(${termsPattern})\\b`, 'gi');
    
    // Split the text into an array of strings and matched terms
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      // Every odd index is a matched term.
      if (index % 2 === 1) {
        const lowerPart = part.toLowerCase();
        const glossaryItem = sortedGlossaryTerms.find(item => item.lowerTerm === lowerPart);
        
        if (glossaryItem) {
          return (
            <Tooltip 
              key={index} 
              title={glossaryItem.definition} 
              arrow 
              placement="top"
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'rgba(15, 23, 42, 0.95)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    p: 1.5,
                    fontSize: '0.85rem'
                  }
                },
                arrow: {
                  sx: { color: 'rgba(15, 23, 42, 0.95)' }
                }
              }}
            >
              <Box 
                component="span" 
                sx={{ 
                  borderBottom: '2px dotted',
                  borderColor: 'primary.main',
                  color: 'primary.dark',
                  fontWeight: 600,
                  cursor: 'help',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(0,114,255,0.08)',
                    borderRadius: 1
                  }
                }}
              >
                {part}
              </Box>
            </Tooltip>
          );
        }
      }
      
      // Even indexes or unfound matches are just returned as strings
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  }, [text]);

  return <>{parsedContent}</>;
}
