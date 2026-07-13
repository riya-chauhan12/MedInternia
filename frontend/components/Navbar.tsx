import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Paper,
  Divider,
  useMediaQuery,
  Tooltip,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
} from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import DatasetIcon from '@mui/icons-material/Dataset';
import Image from 'next/image';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TranscriptIcon from '@mui/icons-material/DescriptionOutlined';
import WorkIcon from '@mui/icons-material/Work';
import VideocamIcon from '@mui/icons-material/Videocam';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProfileDropdown from './ProfileDropdown';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import ArticleIcon from '@mui/icons-material/Article';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';

import { getCurrentUserRole } from '../utils/permissions';
import { getAuthToken } from "../utils/api";

interface NavButtonProps {
  href: string;
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onNavigate?: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({
  href,
  icon,
  label,
  isActive,
  onNavigate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  if (isMobile) {
    return (
      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={href}
          onClick={onNavigate}
          sx={{
            justifyContent: 'flex-start',
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
            borderRadius: 2,
            mx: 1.5,
            mb: 0.5,
            py: 1.25,
          }}
        >
          <ListItemIcon sx={{ color: 'text.primary', minWidth: 40 }}>{icon}</ListItemIcon>
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              color: 'text.primary',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.95rem',
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  }

  return (
    <Tooltip title={label} placement="bottom" arrow>
      <IconButton
        color="inherit"
        component={Link}
        href={href}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        sx={{
          mx: 0.25,
          p: 1.2,
          borderRadius: 2,
          backgroundColor: isActive ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
          transition: 'background-color 0.2s ease',
          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' },
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};

export default function Navbar({ route }: { route?: string }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  const { mode, toggleColorMode } = useContext(ThemeContext);

  const handleHomeNav = () => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken();
      if (token) {
        router.push('/dashboard');
        return;
      }
    }
    router.push('/');
  };

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const closeDrawer = () => setDrawerOpen(false);
  const toggleDrawer = (open: boolean) => () => setDrawerOpen(open);

  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [recentSearches] = React.useState<string[]>([
    'Cardiology',
    'Internships',
    'Webinar on Diabetes',
  ]);
  const [search, setSearch] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const showHint = !search && !isFocused;
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | undefined>(undefined);
  const [firstName, setFirstName] = React.useState<string>('');
  const [lastName, setLastName] = React.useState<string>('');
  const [userType, setUserType] = React.useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      return !!(token && userId);
    }
    return false;
  });

  React.useEffect(() => {
    const token = getAuthToken();
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!token || !userId) {
      setIsLoggedIn(false);
      return;
    }
    setIsLoggedIn(true);

    try {
      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        setProfileImageUrl(storedUser.profilePicture || undefined);
        setFirstName(storedUser.firstName || storedUser.name || '');
        setLastName(storedUser.lastName || '');
        setUserType(storedUser.userType || storedUser.role || '');
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }

    import('../utils/api').then((apiModule) => {
      apiModule.default
        .get(`/users/${userId}/profile`)
        .then((res) => {
          const userData = res.data?.data?.user || res.data?.user || res.data;
          setProfileImageUrl(userData.profilePicture || undefined);
          setFirstName(userData.firstName || userData.name || '');
          setLastName(userData.lastName || '');
          setUserType(userData.userType || '');
        })
        .catch(() => {
          setProfileImageUrl(undefined);
          setFirstName('');
          setLastName('');
        });
    });
  }, [getAuthToken()]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search?.trim();
    if (q) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/search');
    }
  };

  const navItems = [
    ...(isLoggedIn
      ? [{ href: '/cases', icon: <FolderOpenIcon />, label: t('navbar.cases', 'Cases') }]
      : []),
    { href: '/webinar-demo', icon: <TranscriptIcon />, label: 'Webinar Transcripts' },
    { href: '/learning-paths', icon: <BookIcon />, label: t('navbar.learningPaths') },
    { href: '/patients', icon: <DatasetIcon />, label: t('navbar.patients') },
    { href: '/doctors', icon: <WorkIcon />, label: t('navbar.doctors') },
    { href: '/webinars', icon: <VideocamIcon />, label: t('navbar.webinars') },
    { href: '/mentorship', icon: <ArticleIcon />, label: 'Mentorship' },
    { href: '/research_paper', icon: <ArticleIcon />, label: 'Research Paper' },
    { href: '/diaries', icon: <BookIcon />, label: 'Diaries' },
    { href: '/faq', icon: <HelpIcon />, label: 'FAQ' },
  ];

  const mobileNavItems = [
    ...(isLoggedIn
      ? [{ href: '/cases', icon: <FolderOpenIcon />, label: t('navbar.cases', 'Cases') }]
      : []),
    { href: '/webinar-demo', icon: <TranscriptIcon />, label: 'Webinar Transcripts' },
    { href: '/learning-paths', icon: <BookIcon />, label: t('navbar.learningPaths') },
    { href: '/patients', icon: <DatasetIcon />, label: t('navbar.patients') },
    { href: '/doctors', icon: <WorkIcon />, label: t('navbar.doctors') },
    { href: '/webinars', icon: <VideocamIcon />, label: t('navbar.webinars') },
    { href: '/mentorship', icon: <ArticleIcon />, label: 'Mentorship' },
    { href: '/research_paper', icon: <ArticleIcon />, label: 'Research Paper' },
    { href: '/diaries', icon: <BookIcon />, label: 'Diaries' },
    { href: '/faq', icon: <HelpIcon />, label: 'FAQ' },
  ];

  const searchBar = (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <Paper
        component="form"
        onSubmit={handleSearchSubmit}
        elevation={0}
        sx={{
          p: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          borderRadius: 24,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'box-shadow 0.2s',
          '&:focus-within': {
            boxShadow: '0 0 0 3px rgba(0, 114, 255, 0.15)',
            borderColor: 'primary.main',
          },
        }}
      >
        <SearchIcon sx={{ color: 'text.secondary', ml: 1, mr: 0.5 }} fontSize="small" />
        <input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            setTimeout(() => setShowSuggestions(false), 150);
          }}
          placeholder={!showHint ? t('navbar.searchPlaceholder') : ''}
          aria-label="Search medical content"
          style={{
            border: 'none',
            flexGrow: 1,
            outline: 'none',
            height: 36,
            fontSize: '0.9rem',
            background: 'transparent',
            color: theme.palette.text.primary,
            fontFamily: 'inherit',
          }}
        />
        {showHint && !isMobile && (
          <Typography variant="caption" sx={{ color: 'text.disabled', pr: 1, whiteSpace: 'nowrap' }}>
            Press <kbd style={{ fontFamily: 'monospace', fontWeight: 600, padding: '1px 4px', borderRadius: 4, border: '1px solid #e2e8f0' }}>/</kbd> to search
          </Typography>
        )}
        {search && (
          <IconButton
            onClick={() => setSearch('')}
            sx={{ p: 0.5, color: 'text.secondary' }}
            aria-label="Clear search"
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Paper>

      {showSuggestions && search.length > 0 && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: 48,
            left: 0,
            width: '100%',
            zIndex: 10,
            borderRadius: 2,
            mt: 0.5,
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" fontWeight={600} color="primary" sx={{ px: 1, display: 'block', mb: 0.5 }}>
            Recent Searches
          </Typography>
          {recentSearches.map((item) => (
            <Box
              key={item}
              role="button"
              tabIndex={0}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 1.5,
                cursor: 'pointer',
                fontSize: '0.875rem',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onMouseDown={() => {
                setSearch(item);
                setShowSuggestions(false);
              }}
            >
              {item}
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );

  return (
    <>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: theme.zIndex.drawer + 1,
          color: 'text.primary',
        }}
      >
        <Toolbar
          sx={{
            minHeight: theme.custom.navbarHeight,
            px: { xs: 1.5, md: 3 },
            gap: 1,
          }}
        >
          {isMobile && isLoggedIn && (
            <IconButton
              color="inherit"
              aria-label="Open navigation menu"
              edge="start"
              onClick={toggleDrawer(true)}
              sx={{ mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
            onClick={handleHomeNav}
            role="button"
            tabIndex={0}
            aria-label="Go to home"
            onKeyDown={(e) => e.key === 'Enter' && handleHomeNav()}
          >
            <Image
              src="/med-internia-logo.jpg"
              alt="MedInternia logo"
              width={32}
              height={32}
              style={{ marginRight: 8, borderRadius: '50%' }}
            />
            <Typography
              variant="h6"
              suppressHydrationWarning
              sx={{
                fontWeight: 700,
                letterSpacing: 0.5,
                display: { xs: 'none', sm: 'block' },
                color: 'text.primary',
              }}
            >
              {t('navbar.brand', 'MedInternia')}
            </Typography>
          </Box>

          {!isMobile && isLoggedIn && (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: 420, mx: 'auto' }}>
              {searchBar}
            </Box>
          )}

          {!isMobile && isLoggedIn && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {navItems.map((item) => (
                <NavButton
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={router.pathname === item.href || router.pathname.startsWith(`${item.href}/`)}
                />
              ))}
              <NotificationBell />
            </Box>
          )}

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageSwitcher />
            <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="bottom" arrow>
              <IconButton onClick={toggleColorMode} color="inherit">
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <ProfileDropdown
              onNavigate={router.push}
              profileImageUrl={profileImageUrl}
              firstName={firstName}
              lastName={lastName}
              userType={userType}
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Toolbar
        sx={{
          minHeight: theme.custom.navbarHeight,
          visibility: 'hidden',
        }}
      />

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={closeDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            background: 'background.paper',
            color: 'text.primary',
            width: 280,
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Image
                src="/med-internia-logo.jpg"
                alt="MedInternia logo"
                width={28}
                height={28}
                style={{ borderRadius: '50%' }}
              />
              <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                MedInternia
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={closeDrawer} aria-label="Close navigation menu">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ px: 2, py: 2 }}>{searchBar}</Box>

          <List sx={{ flex: 1, pt: 0 }}>
            {mobileNavItems.map((item) => (
              <NavButton
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={router.pathname === item.href || router.pathname.startsWith(`${item.href}/`)}
                onNavigate={closeDrawer}
              />
            ))}
          </List>

          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Medical learning & collaboration
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}