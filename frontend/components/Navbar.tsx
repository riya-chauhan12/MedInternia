import React from "react";
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
} from "@mui/material";
import BookIcon from "@mui/icons-material/Book";
import DatasetIcon from "@mui/icons-material/Dataset";
import Image from "next/image";
import NotificationsIcon from "@mui/icons-material/Notifications";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import WorkIcon from "@mui/icons-material/Work";
import VideocamIcon from "@mui/icons-material/Videocam";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { useRouter } from "next/router";
import ProfileDropdown from "./ProfileDropdown";
import NotificationBell from "./NotificationBell";
import SearchIcon from "@mui/icons-material/Search";
import ArticleIcon from "@mui/icons-material/Article";
import CloseIcon from "@mui/icons-material/Close";

import { getCurrentUserRole } from "../utils/permissions";

// Define a TypeScript interface for the NavButton props
interface NavButtonProps {
  href: string;
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
}

// Reusable component for navigation buttons
const NavButton: React.FC<NavButtonProps> = ({
  href,
  icon,
  label,
  isActive,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });

  if (isMobile) {
    return (
      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={href}
          sx={{
            justifyContent: "flex-start",
            backgroundColor: isActive
              ? "rgba(255, 255, 255, 0.2)"
              : "transparent",
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            borderRadius: theme.spacing(1),
            mx: 1,
            mb: 1,
          }}
        >
          <ListItemIcon sx={{ color: "white" }}>{icon}</ListItemIcon>
          <ListItemText
            primary={label}
            sx={{ color: "white", fontWeight: isActive ? 600 : 400 }}
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
        sx={{
          mx: 0.5,
          p: 1.2,
          borderRadius: 2,
          backgroundColor: isActive
            ? "rgba(255, 255, 255, 0.2)"
            : "transparent",
          color: isActive ? theme.palette.common.white : "inherit",
          transition:
            "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.15)",
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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });

  const handleHomeNav = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const role = getCurrentUserRole() || "";
      if (token) {
        switch (role) {
          case "doctor":
            router.push("/dashboard/doctor");
            return;
          case "patient":
            router.push("/dashboard/patient");
            return;
          case "intern":
            router.push("/dashboard/intern");
            return;
          case "admin":
            router.push("/dashboard/admin");
            return;
          default:
            router.push("/dashboard");
            return;
        }
      }
    }
    router.push("/");
  };

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([
    "Cardiology",
    "Internships",
    "Webinar on Diabetes",
  ]);
  const [search, setSearch] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, []);

  const showHint = !search && !isFocused;
  const [profileImageUrl, setProfileImageUrl] = React.useState<
    string | undefined
  >(undefined);
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [userType, setUserType] = React.useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(false);

  React.useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!token || !userId) {
      setIsLoggedIn(false);
      return;
    }
    setIsLoggedIn(true);

    import("../utils/api").then((apiModule) => {
      apiModule.default
        .get(`/users/${userId}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const userData = res.data?.data?.user || res.data?.user || res.data;
          setProfileImageUrl(userData.profilePicture || undefined);
          setFirstName(userData.firstName || "");
          setLastName(userData.lastName || "");
          setUserType(userData.userType || "");
        })
        .catch(() => {
          setProfileImageUrl(undefined);
          setFirstName("");
          setLastName("");
        });
    });
  }, []);

  return (
    <>
      <AppBar
        sx={{
          background: "linear-gradient(90deg, #1d8299 0%, #5ac0d8 100%)",
          zIndex: theme.zIndex.drawer + 1,
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mr: 2,
              cursor: "pointer",
            }}
            onClick={handleHomeNav}
          >
            <Image
              src="/med-internia-logo.jpg"
              alt="Med-Internia Logo"
              width={32}
              height={32}
              style={{ marginRight: theme.spacing(1), borderRadius: "50%" }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                display: { xs: "none", sm: "block" },
              }}
            >
              MedInternia
            </Typography>
          </Box>
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
                  onSubmit={(e) => {
                    e.preventDefault();
                    const q = search?.trim();
                    if (q) {
                      setShowSuggestions(false);
                      router.push(`/search?q=${encodeURIComponent(q)}`);
                    } else {
                      router.push("/search");
                    }
                  }}
                  sx={{
                    p: "4px 8px",
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
                    autoFocus
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
                    placeholder={
                      !showHint
                        ? "Search medical cases, jobs, or webinars…"
                        : ""
                    }
                    aria-label="Search medical content"
                    style={{
                      border: "none",
                      flexGrow: 1,
                      outline: "none",
                      height: 36,
                      fontSize: "0.95rem",
                      background: "transparent",
                      color: theme.palette.text.primary,
                      minWidth: "auto", // Ensures flex-shrink works
                    }}
                  />
                  {showHint && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        opacity: 0.7,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        pointerEvents: "none",
                        pl: 1, // Add padding to separate from the input
                        whiteSpace: "nowrap",
                      }}
                    >
                      Press
                      <Paper
                        sx={{
                          bgcolor: "background.paper",
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: "4px",
                          p: "2px 4px",
                          display: "inline-flex",
                          alignItems: "center",
                          boxShadow: "none",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 600,
                            lineHeight: 1,
                            color: theme.palette.text.secondary,
                          }}
                        >
                          /
                        </span>
                      </Paper>
                      to search
                    </Typography>
                  )}
                  {search && (
                    <IconButton
                      onClick={() => setSearch("")}
                      sx={{ p: 0.5, color: theme.palette.text.secondary }}
                      aria-label="clear search"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Paper>
                {/* Suggestions dropdown */}
                {showSuggestions && search.length > 0 && (
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
                      sx={{
                        mb: 1,
                        px: 1,
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                      }}
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
                          color: theme.palette.primary.dark,
                          "&:hover": { background: theme.palette.action.hover },
                        }}
                        onMouseDown={() => {
                          setSearch(item);
                          setShowSuggestions(false);
                        }}
                      >
                        {item}
                      </Box>
                    ))}
                    <Divider
                      sx={{ my: 1, borderColor: theme.palette.divider }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        px: 1,
                        fontWeight: 500,
                        color: theme.palette.primary.main,
                      }}
                    >
                      {(isLoggedIn
                        ? ["Cases", "Jobs", "Webinars"]
                        : ["Jobs", "Webinars"]
                      ).map((item) => (
                        <Box
                          key={item}
                          sx={{
                            cursor: "pointer",
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            "&:hover": {
                              background: theme.palette.action.hover,
                            },
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isLoggedIn && (
                <NavButton
                  href="/cases"
                  icon={<FolderOpenIcon />}
                  label="Cases"
                  isActive={router.pathname === "/cases"}
                />
              )}
              <NavButton
                href="/diaries"
                icon={<BookIcon />}
                label="Diaries"
                isActive={router.pathname === "/diaries"}
              />
              <NavButton
                href="/upload-raw"
                icon={<DatasetIcon />}
                label="Upload Raw"
                isActive={router.pathname === "/upload-raw"}
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
                href="/research_paper"
                icon={<ArticleIcon />}
                label="Research Paper"
                isActive={router.pathname === "/research_paper"}
              />
              <NotificationBell />
            </Box>
          )}

          {/* Profile Dropdown: always visible, right side */}
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
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
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            background: "linear-gradient(180deg, #1d8299 0%, #5ac0d8 100%)",
            color: "white",
            width: 250,
            pt: 2,
          },
        }}
      >
        <Box
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
          sx={{ py: 2 }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              <Image
                src="/med-internia-logo.png"
                alt="Med-Internia Logo"
                width={32}
                height={32}
                style={{ marginRight: theme.spacing(1) }}
              />
              Med-Internia
            </Typography>
          </Box>
          <List>
            {isLoggedIn && (
              <NavButton
                href="/cases"
                icon={<FolderOpenIcon />}
                label="Cases"
                isActive={router.pathname === "/cases"}
              />
            )}
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
              href="/research_paper"
              icon={<ArticleIcon />}
              label="Research Paper"
              isActive={router.pathname === "/research_paper"}
            />
          </List>
        </Box>
      </Drawer>
    </>
  );
}
