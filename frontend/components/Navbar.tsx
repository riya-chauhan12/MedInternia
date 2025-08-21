import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
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
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import FolderOpenIcon from "@mui/icons-material/FolderOpen"; // Icon for Cases
import WorkIcon from "@mui/icons-material/Work"; // Icon for Jobs
import VideocamIcon from "@mui/icons-material/Videocam"; // Icon for Webinars
import MoreHorizIcon from "@mui/icons-material/MoreHoriz"; // Icon for More
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { useRouter } from "next/router";
import ProfileDropdown from "./ProfileDropdown";
import SearchIcon from "@mui/icons-material/Search";

// Define a TypeScript interface for the NavButton props
interface NavButtonProps {
  href: string;
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
}

// Reusable component for navigation buttons
const NavButton: React.FC<NavButtonProps> = ({ href, icon, label, isActive }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  if (isMobile) {
    return (
      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={href}
          sx={{
            justifyContent: "center",
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
          }}
        >
          <ListItemIcon sx={{ color: "white" }}>{icon}</ListItemIcon>
          <ListItemText primary={label} sx={{ color: "white" }} />
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
        sx={{
          mx: 0.5,
          p: 1.2,
          borderRadius: 2,
          borderBottom: isActive ? "2px solid #fff" : "none",
          transition: "background-color 0.3s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            borderBottom: isActive ? "2px solid #fff" : "none",
          },
        }}
        aria-label={label}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};

export default function Navbar({ route }: { route?: string }) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Role-based dashboard navigation
  const handleHomeNav = () => {
    // If logged in, always go to dashboard; else go to main page
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role') || '';
      // Only route to dashboard if logged in
      if (token) {
        switch (role) {
          case 'doctor':
            router.push('/dashboard/doctor');
            return;
          case 'patient':
            router.push('/dashboard/patient');
            return;
          case 'intern':
            router.push('/dashboard/intern');
            return;
          case 'admin':
            router.push('/dashboard/admin');
            return;
          default:
            router.push('/dashboard');
            return;
        }
      }
    }
    // If not logged in, always go to main page
    router.push('/');
  };

  // More dropdown and mobile drawer state
  const [moreAnchorEl, setMoreAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  const moreOpen = Boolean(moreAnchorEl);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreAnchorEl(event.currentTarget);
  };

  const handleMoreClose = () => {
    setMoreAnchorEl(null);
  };

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };
  
  // Recent searches and suggestions
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([
    "Cardiology",
    "Internships",
    "Webinar on Diabetes",
  ]);
  const [search, setSearch] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut: focus search on '/'
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <AppBar
        sx={{
          background: "linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)",
          zIndex: 1201,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <Toolbar sx={{ flexWrap: "wrap", minHeight: 64, px: { xs: 1, md: 3 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <IconButton color="inherit" sx={{ mr: 2 }} onClick={handleHomeNav}>
            <HomeIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, letterSpacing: 1, mr: 2, cursor: 'pointer' }}
            onClick={handleHomeNav}
          >
            Med-Internia
          </Typography>
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minWidth: 0,
            }}
          >
            {/* Desktop search bar */}
            {!isMobile && (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 420,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Paper
                  component="form"
                  onSubmit={(e) => e.preventDefault()}
                  sx={{
                    p: "2px 4px",
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    borderRadius: 24,
                    boxShadow: "0 2px 8px rgba(33,147,176,0.10)",
                    transition: "box-shadow 0.3s",
                    "&:hover": {
                      boxShadow: "0 4px 16px rgba(33,147,176,0.25)",
                    },
                    "&:focus-within": {
                      boxShadow: "0 4px 16px rgba(33,147,176,0.25)",
                    },
                  }}
                >
                  <SearchIcon sx={{ color: "text.secondary", ml: 1, mr: 1 }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowSuggestions(search.length > 0)}
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 150)
                    }
                    placeholder="Search medical cases, jobs, or webinars…"
                    aria-label="Search medical content"
                    style={{
                      border: "none",
                      flexGrow: 1,
                      outline: "none",
                      height: 40,
                      fontSize: "1rem",
                      background: "transparent",
                      color: "#222",
                    }}
                  />
                  <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
                    <SearchIcon />
                  </IconButton>
                </Paper>
                {/* Suggestions dropdown */}
                {showSuggestions && (
                  <Paper
                    sx={{
                      position: "absolute",
                      top: 48,
                      left: 0,
                      width: "100%",
                      zIndex: 10,
                      borderRadius: 2,
                      boxShadow: "0 4px 16px #2193b044",
                      mt: 1,
                      p: 1,
                    }}
                  >
                    <Box
                      sx={{ mb: 1, px: 1, fontWeight: 600, color: "#1565c0" }}
                    >
                      Recent Searches
                    </Box>
                    {recentSearches.map((item) => (
                      <Box
                        key={item}
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          cursor: "pointer",
                          fontSize: "0.92rem",
                          color: "#1565c0",
                          "&:hover": { background: "#e0eafc" },
                        }}
                        onMouseDown={() => {
                          setSearch(item);
                          setShowSuggestions(false);
                        }}
                      >
                        {item}
                      </Box>
                    ))}
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        px: 1,
                        fontWeight: 500,
                        color: "#2193b0",
                      }}
                    >
                      {["Cases", "Jobs", "Webinars"].map((item) => (
                        <Box
                          key={item}
                          sx={{
                            cursor: "pointer",
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            "&:hover": { background: "#e0eafc" },
                          }}
                          onMouseDown={() => {
                            setSearch(item);
                            setShowSuggestions(false);
                          }}
                        >
                          {item}
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
          {/* Main Nav Buttons for Desktop */}
          {!isMobile && (
            <Box
              sx={{ display: "flex", alignItems: "center" }}
            >
              <NavButton
                href="/cases"
                icon={<FolderOpenIcon />}
                label="Cases"
                isActive={router.pathname === "/cases"}
              />
              <NavButton
                href="/jobs"
                icon={<WorkIcon />}
                label="Jobs"
                isActive={router.pathname === "/jobs"}
              />
              <NavButton
                href="/webinars"
                icon={<VideocamIcon />}
                label="Webinars"
                isActive={router.pathname === "/webinars"}
              />
              <Tooltip title="More options" placement="bottom" arrow>
                <IconButton
                  color="inherit"
                  onClick={handleMoreClick}
                  aria-label="More options"
                  sx={{
                    mx: 0.5,
                    p: 1.2,
                    borderRadius: 2,
                    transition: "background-color 0.3s ease-in-out",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                    },
                  }}
                >
                  <MoreHorizIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={moreAnchorEl}
                open={moreOpen}
                onClose={handleMoreClose}
                PaperProps={{ sx: { minWidth: 160, borderRadius: 2, textAlign: 'center' } }}
              >
                <MenuItem
                  onClick={() => {
                    handleMoreClose();
                    router.push("/resources");
                  }}
                  sx={{ justifyContent: 'center' }}
                >
                  Resources
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleMoreClose();
                    router.push("/leaderboard");
                  }}
                  sx={{ justifyContent: 'center' }}
                >
                  Leaderboard
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleMoreClose();
                    router.push("/badges");
                  }}
                  sx={{ justifyContent: 'center' }}
                >
                  Badges
                </MenuItem>
              </Menu>
              <Tooltip title="Notifications" placement="bottom" arrow>
                <IconButton
                  color="inherit"
                  sx={{ mx: 0.5, p: 1.2, borderRadius: 2 }}
                  onClick={() => router.push("/notifications")}
                  aria-label="Notifications"
                >
                  <NotificationsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="About" placement="bottom" arrow>
                <IconButton
                  color="inherit"
                  component={Link}
                  href="/about"
                  sx={{ mx: 0.5, p: 1.2, borderRadius: 2 }}
                  aria-label="About"
                >
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Profile Dropdown: always visible, right side */}
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
            <ProfileDropdown onNavigate={router.push} />
          </Box>
        </Toolbar>
      </AppBar>
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            background: "linear-gradient(180deg, #2193b0 0%, #6dd5ed 100%)",
            color: "white",
            width: 250,
          }
        }}
      >
        <Box
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
          sx={{ py: 2 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              Med-Internia
            </Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)' }} />
          <List>
            <NavButton 
              href="/cases" 
              icon={<FolderOpenIcon />} 
              label="Cases"
              isActive={router.pathname === "/cases"}
            />
            <NavButton 
              href="/jobs" 
              icon={<WorkIcon />} 
              label="Jobs"
              isActive={router.pathname === "/jobs"}
            />
            <NavButton 
              href="/webinars" 
              icon={<VideocamIcon />} 
              label="Webinars"
              isActive={router.pathname === "/webinars"}
            />
            <NavButton 
              href="/resources" 
              icon={<InfoIcon />} 
              label="Resources" 
              isActive={router.pathname === "/resources"}
            />
            <NavButton 
              href="/leaderboard" 
              icon={<InfoIcon />} 
              label="Leaderboard" 
              isActive={router.pathname === "/leaderboard"}
            />
            <NavButton 
              href="/badges" 
              icon={<InfoIcon />} 
              label="Badges" 
              isActive={router.pathname === "/badges"}
            />
          </List>
        </Box>
      </Drawer>
    </>
  );
}