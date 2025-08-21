import React, { useState, FormEvent, ChangeEvent, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  SelectChangeEvent,
  Tooltip,
  Grid
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import ContactsIcon from '@mui/icons-material/Contacts';
import WorkIcon from '@mui/icons-material/Work';
import KeyIcon from '@mui/icons-material/Key';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Defines the shape of the form data for type safety
interface ProfileFormData {
  name: string;
  bio: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  image: string;
  role: "Intern" | "Doctor" | "Patient";
  // Intern-specific fields
  medicalSchool: string;
  graduationYear: number | string;
  specialtiesOfInterest: string;
  // Doctor-specific fields
  medicalLicenseNumber: string;
  specialtyExpertise: string;
  hospitalAffiliation: string;
  yearsOfExperience: number | string;
  // Shared fields
  linkedInUrl: string;
}

// Custom theme for a cohesive look and feel
const theme = createTheme({
  palette: {
    primary: {
      main: '#2193b0', // A professional, calming blue
    },
    secondary: {
      main: '#00b09b', // An accent green for success
    },
    background: {
      default: '#eef2f5', // A soft, light gray background
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h5: {
      fontWeight: 600,
      color: '#333',
    },
    subtitle1: {
      fontWeight: 600,
      color: '#555',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      mb: 1
    },
    body2: {
      fontWeight: 500,
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.08)',
          borderRadius: '20px',
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)'
          }
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)'
          }
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
          },
        },
      },
    },
  },
});

// Function to generate a Base64 encoded SVG for avatars
const getAvatarSvg = (svgContent: string, bgColor: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="58" fill="${bgColor}"/>
    ${svgContent}
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// SVG for the universal human silhouette
const HUMAN_SILHOUETTE_SVG = `
  <path fill="#fff" d="M60 20c-16.568 0-30 13.432-30 30s13.432 30 30 30 30-13.432 30-30-13.432-30-30-30zM75 90c0 8.284-6.716 15-15 15s-15-6.716-15-15h30z"/>
`;

// Updated: Map roles to the single silhouette avatar with lighter background colors
const ROLE_AVATARS = {
  Doctor: getAvatarSvg(HUMAN_SILHOUETTE_SVG, '#A3CCEC'), // A light, calming blue
  Intern: getAvatarSvg(HUMAN_SILHOUETTE_SVG, '#C8F0E8'), // A light minty green
  Patient: getAvatarSvg(HUMAN_SILHOUETTE_SVG, '#F8C8D0'), // A soft pastel pink
};

// Define the initial state of the form
const initialFormState: ProfileFormData = {
  name: "Dr. Me",
  bio: "Passionate about medicine.",
  email: "me@medinternia.com",
  phone: "",
  address: {
    street: "",
    city: "",
    state: "",
    zip: "",
  },
  image: ROLE_AVATARS.Doctor,
  role: "Doctor",
  medicalSchool: "",
  graduationYear: "",
  specialtiesOfInterest: "",
  linkedInUrl: "",
  medicalLicenseNumber: "",
  specialtyExpertise: "",
  hospitalAffiliation: "",
  yearsOfExperience: "",
};

export default function EditProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State to manage form data, initialized with placeholder values
  const [form, setForm] = useState<ProfileFormData>(initialFormState);

  // New state to track if a custom image has been uploaded
  const [hasCustomImage, setHasCustomImage] = useState<boolean>(false);
  
  // State to manage UI feedback and dialogs
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [openImageMenu, setOpenImageMenu] = useState<boolean>(false);
  const [errors, setErrors] = useState({
    email: '',
    phone: '',
    zip: '',
  });

  // Use useEffect to change the avatar whenever the role changes
  useEffect(() => {
    // Only update the image if a custom image has not been uploaded
    if (!hasCustomImage) {
      setForm(prevForm => ({
        ...prevForm,
        image: ROLE_AVATARS[prevForm.role],
      }));
    }
  }, [form.role, hasCustomImage]);

  // Function to validate form fields
  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', phone: '', zip: '' };
    const phoneRegex = /^\d{10}$/; // Simple 10-digit check
    const zipRegex = /^\d{5}$/; // Simple 5-digit check

    if (form.phone && !phoneRegex.test(form.phone)) {
      newErrors.phone = 'Enter a valid 10-digit phone number.';
      isValid = false;
    }
    if (form.address.zip && !zipRegex.test(form.address.zip)) {
      newErrors.zip = 'Enter a valid 5-digit zip code.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handles input changes for top-level form fields
  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  // Handles input changes for nested address fields
  const handleAddressChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm({
      ...form,
      address: {
        ...form.address,
        [name]: value,
      },
    });
  };

  // Handles change in user role via the Select component
  const handleRoleChange = (event: SelectChangeEvent<"Intern" | "Doctor" | "Patient">) => {
    const role = event.target.value as "Intern" | "Doctor" | "Patient";
    setForm({ ...form, role });
  };

  // Handles the change in profile picture from file input
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setForm({ ...form, image: e.target.result as string });
          setHasCustomImage(true); // A custom image has been uploaded
        }
      };
      reader.readAsDataURL(event.target.files[0]);
      setOpenImageMenu(false); // Close the menu after selecting
    }
  };

  // Handles removing the profile picture
  const handleRemoveImage = () => {
    setForm({ ...form, image: ROLE_AVATARS[form.role] }); // Revert to role-based avatar
    setHasCustomImage(false); // No custom image anymore
    setOpenImageMenu(false); // Close the menu after removing
  };

  // Handles form submission, with validation and a simulated API call
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsSaved(false);

    if (!validateForm()) {
      setMessage("Please correct the errors in the form.");
      return;
    }

    setLoading(true);
    try {
      // Simulates an API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setMessage("Profile updated successfully!");
      setIsSaved(true);
      // Clears the "Saved" checkmark after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Update failed:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handles profile deletion, with a simulated API call
  const handleDeleteProfile = async () => {
    setOpenDeleteDialog(false);
    setLoading(true);
    setMessage("");

    try {
      // Simulates account deletion
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setMessage("Profile has been successfully deleted.");
      // In a real app, you would redirect the user here
    } catch (error) {
      console.error("Deletion failed:", error);
      setMessage("An error occurred during deletion.");
    } finally {
      setLoading(false);
    }
  };

  // Resets the form to its initial state
  const handleCancel = () => {
    setForm(initialFormState);
    setHasCustomImage(false);
    setMessage("");
    setIsSaved(false);
    setErrors({ email: '', phone: '', zip: '' });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #eef2f5 0%, #f7f9fc 100%)',
          p: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <Card sx={{ p: 4, width: '100%', maxWidth: 650, borderRadius: '20px' }}>
          {/* Profile Header Section */}
          <Box display="flex" alignItems="center" flexDirection="column" gap={2} mb={4}>
            <Box sx={{ position: 'relative', width: 120, height: 120 }}>
              <Avatar
                src={form.image}
                sx={{ width: 120, height: 120, border: '4px solid #fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
              />
              <Tooltip title="Change profile picture">
                <Box
                  component="div"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    p: 1.5,
                    borderRadius: '50%',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                  onClick={() => setOpenImageMenu(true)}
                >
                  <PhotoCameraIcon fontSize="small" />
                </Box>
              </Tooltip>
              <input
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload-button"
                type="file"
                onChange={handleImageChange}
              />
            </Box>
            
            <Box display="flex" flexDirection="column" alignItems="center">
              <Typography variant="h5" sx={{ mb: 0.5 }}>
                Edit Profile
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Personal Information Section */}
            <Typography variant="subtitle1" gutterBottom>
              <PersonIcon /> Personal Information
            </Typography>
            <Stack spacing={2} mb={4}>
              <TextField
                label="Name"
                name="name"
                fullWidth
                value={form.name}
                onChange={handleInputChange}
              />
              <TextField
                label="Bio"
                name="bio"
                fullWidth
                multiline
                minRows={2}
                value={form.bio}
                onChange={handleInputChange}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                fullWidth
                value={form.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                disabled
              />
              <TextField
                label="Phone Number"
                name="phone"
                type="tel"
                fullWidth
                value={form.phone}
                onChange={handleInputChange}
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Stack>

            <Divider sx={{ my: 4 }} />

            {/* Contact Address Section */}
            <Typography variant="subtitle1" gutterBottom>
              <ContactsIcon /> Contact Address
            </Typography>
            <Stack spacing={2} mb={4}>
              <TextField
                label="Street"
                name="street"
                fullWidth
                value={form.address.street}
                onChange={handleAddressChange}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="City"
                  name="city"
                  fullWidth
                  value={form.address.city}
                  onChange={handleAddressChange}
                />
                <TextField
                  label="State"
                  name="state"
                  fullWidth
                  value={form.address.state}
                  onChange={handleAddressChange}
                />
                <TextField
                  label="Zip Code"
                  name="zip"
                  fullWidth
                  value={form.address.zip}
                  onChange={handleAddressChange}
                  error={!!errors.zip}
                  helperText={errors.zip}
                />
              </Stack>
            </Stack>

            <Divider sx={{ my: 4 }} />

            {/* Role & Professional Details Section */}
            <Typography variant="subtitle1" gutterBottom>
              <WorkIcon /> Role & Professional Details
            </Typography>
            <Stack spacing={2} mb={4}>
              <FormControl fullWidth>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  id="role-select"
                  value={form.role}
                  label="Role"
                  onChange={handleRoleChange}
                >
                  <MenuItem value="Doctor">Doctor</MenuItem>
                  <MenuItem value="Intern">Intern</MenuItem>
                  <MenuItem value="Patient">Patient</MenuItem>
                </Select>
              </FormControl>
            
              {form.role === "Intern" && (
                <Stack spacing={2}>
                  <TextField
                    label="Medical School/University"
                    name="medicalSchool"
                    fullWidth
                    value={form.medicalSchool}
                    onChange={handleInputChange}
                  />
                  <TextField
                    label="Graduation Year"
                    name="graduationYear"
                    type="number"
                    fullWidth
                    value={form.graduationYear}
                    onChange={handleInputChange}
                  />
                  <TextField
                    label="Specialties of Interest"
                    name="specialtiesOfInterest"
                    fullWidth
                    value={form.specialtiesOfInterest}
                    onChange={handleInputChange}
                  />
                </Stack>
              )}

              {form.role === "Doctor" && (
                <Stack spacing={2}>
                  <TextField
                    label="Medical License Number"
                    name="medicalLicenseNumber"
                    fullWidth
                    value={form.medicalLicenseNumber}
                    onChange={handleInputChange}
                  />
                  <TextField
                    label="Specialty/Expertise"
                    name="specialtyExpertise"
                    fullWidth
                    value={form.specialtyExpertise}
                    onChange={handleInputChange}
                  />
                  <TextField
                    label="Hospital/Clinic Affiliation"
                    name="hospitalAffiliation"
                    fullWidth
                    value={form.hospitalAffiliation}
                    onChange={handleInputChange}
                  />
                  <TextField
                    label="Years of Experience"
                    name="yearsOfExperience"
                    type="number"
                    fullWidth
                    value={form.yearsOfExperience}
                    onChange={handleInputChange}
                  />
                </Stack>
              )}

              {(form.role === "Intern" || form.role === "Doctor") && (
                <TextField
                  label="LinkedIn Profile URL"
                  name="linkedInUrl"
                  fullWidth
                  value={form.linkedInUrl}
                  onChange={handleInputChange}
                />
              )}
            </Stack>

            <Divider sx={{ my: 4 }} />

            {/* Password & Privacy Section */}
            <Typography variant="subtitle1" gutterBottom>
              <KeyIcon /> Password & Privacy
            </Typography>
            <Stack spacing={2} mb={4}>
              <Button variant="outlined" color="primary" fullWidth>
                Change Password
              </Button>
            </Stack>

            <Divider sx={{ my: 4 }} />

            {/* Account Management Section */}
            <Typography variant="subtitle1" gutterBottom>
              <DeleteIcon /> Account Management
            </Typography>
            <Stack spacing={2} mb={4}>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => setOpenDeleteDialog(true)}
              >
                Delete Profile
              </Button>
            </Stack>

            {/* Action Buttons */}
            <Box display="flex" justifyContent="flex-end" alignItems="center" mt={3} gap={2}>
              {loading && <CircularProgress size={24} sx={{ color: "primary.main" }} />}
              {!loading && message && (
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 'auto', gap: '8px' }}>
                  {isSaved ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <Typography variant="body2" color="error">
                      {message}
                    </Typography>
                  )}
                  {isSaved && (
                    <Typography variant="body2" color="text.secondary">
                      {message}
                    </Typography>
                  )}
                </Box>
              )}
              <Button
                variant="outlined"
                color="primary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </form>
        </Card>
      </Box>

      {/* Image Change Options Dialog */}
      <Dialog
        open={openImageMenu}
        onClose={() => setOpenImageMenu(false)}
      >
        <DialogTitle>Change Profile Picture</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              onClick={() => {
                fileInputRef.current?.click();
                setOpenImageMenu(false);
              }}
            >
              Browse from device
            </Button>
            {hasCustomImage && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={handleRemoveImage}
              >
                Remove Photo
              </Button>
            )}
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your profile? This action cannot be undone. All of your data will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteProfile} color="error" variant="contained">
            Delete Profile
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}