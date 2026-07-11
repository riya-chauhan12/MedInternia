import React, { useState } from "react";
import {
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Divider,
  Typography,
  Box,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import BarChartIcon from "@mui/icons-material/BarChart";
import FolderIcon from "@mui/icons-material/Folder";
import CommentIcon from "@mui/icons-material/Comment";
import GroupIcon from "@mui/icons-material/Group";
import StarIcon from "@mui/icons-material/Star";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTranslation } from 'react-i18next';

interface ProfileDropdownProps {
  onNavigate: (path: string) => void;
  profileImageUrl?: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onNavigate, profileImageUrl, firstName, lastName, userType }) => {
  const { t } = useTranslation('common');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Get userId and initials from localStorage
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : '';

  // Logout logic
  const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("user");
  localStorage.removeItem("starredCases");
  localStorage.removeItem("starredPapers");
  localStorage.removeItem("pinnedPapers");
  localStorage.removeItem("refreshToken");
  document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "auth_status=; Path=/; Max-Age=0; SameSite=Lax";
  handleClose();
  onNavigate("/");
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="Profile"
        sx={{ ml: 2 }}
      >
        {/* Show avatar from prop if available, else initials from props */}
        {profileImageUrl ? (
          <Avatar src={profileImageUrl} sx={{ width: 40, height: 40, mr: 1 }} />
        ) : (
          <Box
            sx={{
              bgcolor: '#bae6fd',
              color: '#0284c7',
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16,
              mr: 1,
            }}
          >
            {(firstName && lastName)
              ? (userType === 'doctor'
                  ? `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`
                  : `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`)
              : 'U'}
          </Box>
        )}
        <ArrowDropDownIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { minWidth: 220, borderRadius: 3 } }}
      >
        <Box px={2} py={1}>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('navbar.profile')}
          </Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        {/* <MenuItem
          onClick={() => {
            handleClose();
            if (window.location.pathname !== `/profile/${userId}`) {
              onNavigate(`/profile/${userId}`);
            }
          }}
          sx={{ py: 1.2 }}
        >
          <PersonIcon sx={{ mr: 1 }} /> View Profile
        </MenuItem> */}
        <MenuItem
          onClick={() => {
            handleClose();
            onNavigate("/profile/edit");
          }}
          sx={{ py: 1.2 }}
        >
          <EditIcon sx={{ mr: 1 }} /> Edit Profile
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        {/* <MenuItem
        onClick={() => {
          handleClose();
          onNavigate("/profile/activity");
        }}
        sx={{ py: 1.2 }}
        >
          <BarChartIcon sx={{ mr: 1 }} /> User Activity
          </MenuItem> */}
        <MenuItem
          onClick={() => {
            handleClose();
            onNavigate("/profile/achievements");
          }}
          sx={{ py: 1.2 }}
        >
          <EmojiEventsIcon sx={{ mr: 1 }} /> Achievements
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            onNavigate("/profile/cases");
          }}
          sx={{ py: 1.2 }}
        >
          <FolderIcon sx={{ mr: 1 }} /> Your Cases
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            onNavigate("/profile/comments");
          }}
          sx={{ py: 1.2 }}
        >
          <CommentIcon sx={{ mr: 1 }} /> Your Comments
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            onNavigate("/profile/following");
          }}
          sx={{ py: 1.2 }}
        >
          <GroupIcon sx={{ mr: 1 }} /> Connections
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            //onNavigate("/profile/activity");
          }}
          sx={{ py: 1.2 }}
        >
          <StarIcon sx={{ mr: 1 }} /> Starred
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            onNavigate("/profile/liked");
          }}
          sx={{ py: 1.2 }}
        >
          <ThumbUpAltIcon sx={{ mr: 1 }} /> Liked Items
        </MenuItem>
        {/* Divider above logout */}
        <Divider sx={{ my: 1, bgcolor: "#fdecea" }} />
        <MenuItem
          onClick={logout}
          sx={{
            py: 1.2,
            color: "#d32f2f",
            fontWeight: 700,
            "&:hover": {
              bgcolor: "#fdecea",
              color: "#b71c1c",
              transition: "background 0.2s, color 0.2s",
            },
          }}
        >
          <span style={{ marginRight: 8, fontSize: 22 }}>🚪</span> Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileDropdown;
