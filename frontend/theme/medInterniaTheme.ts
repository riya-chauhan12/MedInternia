import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      navbarGradient: string;
      footerBg: string;
      heroGradient: string;
      cardShadow: string;
      cardShadowHover: string;
      navbarHeight: number;
    };
  }
  interface ThemeOptions {
    custom?: {
      navbarGradient?: string;
      footerBg?: string;
      heroGradient?: string;
      cardShadow?: string;
      cardShadowHover?: string;
      navbarHeight?: number;
    };
  }
}

const primaryMain = '#0072ff';
const primaryDark = '#0056cc';
const primaryLight = '#e8f4ff';
const secondaryMain = '#00c6ff';
const tealAccent = '#008ecf';

import { PaletteMode } from '@mui/material';

export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: {
            main: primaryMain,
            dark: primaryDark,
            light: primaryLight,
            contrastText: '#ffffff',
          },
          secondary: {
            main: secondaryMain,
            dark: tealAccent,
            light: '#e0f7ff',
            contrastText: '#ffffff',
          },
          success: {
            main: '#10b981',
            light: '#d1fae5',
          },
          warning: {
            main: '#f59e0b',
            light: '#fef3c7',
          },
          error: {
            main: '#ef4444',
            light: '#fee2e2',
          },
          info: {
            main: tealAccent,
            light: '#e0f2fe',
          },
          background: {
            default: '#f8fbff',
            paper: '#ffffff',
          },
          text: {
            primary: '#1a202c',
            secondary: '#64748b',
            disabled: '#94a3b8',
          },
          divider: '#e2e8f0',
        }
      : {
          // Dark mode palette
          primary: {
            main: '#3b82f6',
            dark: '#2563eb',
            light: '#60a5fa',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#0ea5e9',
            dark: '#0284c7',
            light: '#38bdf8',
            contrastText: '#ffffff',
          },
          success: {
            main: '#34d399',
            light: '#6ee7b7',
          },
          warning: {
            main: '#fbbf24',
            light: '#fcd34d',
          },
          error: {
            main: '#f87171',
            light: '#fca5a5',
          },
          info: {
            main: '#38bdf8',
            light: '#7dd3fc',
          },
          background: {
            default: '#0f172a',
            paper: '#1e293b',
          },
          text: {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
            disabled: '#64748b',
          },
          divider: '#334155',
        }),
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: 0, color: mode === 'light' ? '#1a202c' : '#f8fafc' },
    h2: { fontWeight: 700, letterSpacing: 0, color: mode === 'light' ? '#1a202c' : '#f8fafc' },
    h3: { fontWeight: 700, color: mode === 'light' ? '#1a202c' : '#f8fafc' },
    h4: { fontWeight: 700, color: mode === 'light' ? '#1a202c' : '#f8fafc' },
    h5: { fontWeight: 600, color: mode === 'light' ? '#1a202c' : '#f8fafc' },
    h6: { fontWeight: 600, color: mode === 'light' ? '#1a202c' : '#f8fafc' },
    subtitle1: { fontWeight: 500, color: mode === 'light' ? '#64748b' : '#94a3b8' },
    subtitle2: { fontWeight: 500, color: mode === 'light' ? '#64748b' : '#94a3b8', fontSize: '0.875rem' },
    body1: { fontSize: '1rem', lineHeight: 1.6, color: mode === 'light' ? '#334155' : '#cbd5e1' },
    body2: { fontSize: '0.875rem', lineHeight: 1.6, color: mode === 'light' ? '#64748b' : '#94a3b8' },
    button: { fontWeight: 600, textTransform: 'none' as const, letterSpacing: '0.01em' },
    caption: { fontSize: '0.75rem', color: mode === 'light' ? '#94a3b8' : '#64748b' },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  custom: {
    navbarGradient: mode === 'light' 
      ? `linear-gradient(90deg, ${primaryDark} 0%, ${primaryMain} 50%, ${secondaryMain} 100%)`
      : `linear-gradient(90deg, #0f172a 0%, #1e293b 100%)`,
    footerBg: '#0f172a',
    heroGradient: mode === 'light' 
      ? `linear-gradient(135deg, ${primaryMain} 0%, ${secondaryMain} 100%)`
      : `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`,
    cardShadow: mode === 'light' 
      ? '0 1px 3px rgba(0, 114, 255, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    cardShadowHover: mode === 'light'
      ? '0 4px 24px rgba(0, 114, 255, 0.12), 0 8px 32px rgba(0, 0, 0, 0.06)'
      : '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
    navbarHeight: 64,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'light' ? '#f8fbff' : '#0f172a',
          color: mode === 'light' ? '#1a202c' : '#f8fafc',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        },
        'input, textarea, [contenteditable="true"]': {
          userSelect: 'text',
          WebkitUserSelect: 'text',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          fontWeight: 600,
          '&:focus-visible': {
            outline: `2px solid ${primaryMain}`,
            outlineOffset: 2,
          },
        },
        containedPrimary: {
          background: mode === 'light' 
            ? `linear-gradient(90deg, ${primaryMain} 0%, ${secondaryMain} 100%)`
            : `linear-gradient(90deg, #3b82f6 0%, #0ea5e9 100%)`,
          '&:hover': {
            background: mode === 'light'
              ? `linear-gradient(90deg, ${primaryDark} 0%, ${primaryMain} 100%)`
              : `linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)`,
          },
        },
        outlinedPrimary: {
          borderColor: alpha(primaryMain, 0.4),
          '&:hover': {
            borderColor: primaryMain,
            backgroundColor: alpha(primaryMain, 0.04),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === 'light' 
            ? '0 1px 3px rgba(0, 114, 255, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
          border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease, background-color 0.3s ease',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined' as const,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: mode === 'light' ? '#ffffff' : '#0f172a',
            '&.Mui-focused fieldset': {
              borderColor: mode === 'light' ? primaryMain : '#3b82f6',
              boxShadow: `0 0 0 3px ${alpha(mode === 'light' ? primaryMain : '#3b82f6', 0.12)}`,
            },
            '& fieldset': {
              borderColor: mode === 'light' ? '#cbd5e1' : '#475569',
            }
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
        filled: {
          '&.MuiChip-colorPrimary': {
            backgroundColor: alpha(primaryMain, 0.1),
            color: mode === 'light' ? primaryDark : '#93c5fd',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'light' ? '0 4px 20px rgba(0, 86, 204, 0.15)' : 'none',
          borderBottom: mode === 'dark' ? '1px solid #334155' : 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: `2px solid ${primaryMain}`,
            outlineOffset: 2,
          },
        },
      },
    },
  },
});

export const medInterniaTheme = createTheme(getDesignTokens('light'));
export default medInterniaTheme;
