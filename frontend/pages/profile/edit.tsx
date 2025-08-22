import React, { useState, FormEvent, ChangeEvent, useRef, useEffect } from "react";
import { useRouter } from 'next/router';
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
  name: "",
  bio: "",
  email: "",
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

  const router = useRouter();
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
        image: prevForm.image || ROLE_AVATARS[prevForm.role],
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
   React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (!token || !userId) return;
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data && data.data.user) {
          const user = data.data.user;
            setForm(prevForm => ({
              ...prevForm,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              bio: user.bio || "",
              email: user.email || "",
              phone: user.phone || "",
              address: {
                street: user.address?.street || "",
                city: user.address?.city || "",
                state: user.address?.state || "",
                zip: user.address?.zipCode || user.address?.zip || "",
              },
              image: user.profilePicture || ROLE_AVATARS[user.userType === "doctor" ? "Doctor" : user.userType === "intern" ? "Intern" : "Patient"],
              role: user.userType === "doctor" ? "Doctor" : user.userType === "intern" ? "Intern" : "Patient",
              medicalSchool: user.medicalSchool || "",
              graduationYear: user.yearOfStudy || user.graduationYear || "",
              specialtiesOfInterest: user.interests ? Array.isArray(user.interests) ? user.interests.join(', ') : user.interests : "",
              linkedInUrl: user.linkedInProfile || user.linkedInUrl || "",
              medicalLicenseNumber: user.licenseNumber || user.medicalLicenseNumber || "",
              specialtyExpertise: user.specialization || user.specialtyExpertise || "",
              hospitalAffiliation: user.hospitalAffiliation || user.hospital || "",
              yearsOfExperience: user.experience || user.yearsOfExperience || "",
            }));
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchProfile();
  }, []);

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

  // Handles the change in profile picture from file input (store file in state, don't upload yet)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setForm({ ...form, image: e.target.result as string });
          setHasCustomImage(true);
        }
      };
      reader.readAsDataURL(file);
      setOpenImageMenu(false);
    }
  };

  // Handles removing the profile picture
  const handleRemoveImage = () => {
    setForm({ ...form, image: ROLE_AVATARS[form.role] }); // Revert to role-based avatar
    setHasCustomImage(false); // No custom image anymore
    setOpenImageMenu(false); // Close the menu after removing
  };

  // Handles form submission, uploads image if selected, then updates profile
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
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) throw new Error('Missing auth');
      let profilePictureUrl = (typeof form.image === 'string' && /^https?:\/\//.test(form.image)) ? form.image : '';
      // If a new image file is selected, upload it first
      if (selectedImageFile) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
        const formData = new FormData();
        formData.append('profilePicture', selectedImageFile);
        const resImg = await fetch(`${API_BASE_URL}/auth/profile/upload-picture`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const dataImg = await resImg.json();
        if (dataImg.success && dataImg.data && dataImg.data.user && dataImg.data.user.profilePicture) {
          profilePictureUrl = dataImg.data.user.profilePicture;
        } else {
          setMessage(dataImg.message || 'Failed to upload image.');
          setLoading(false);
          return;
        }
      }
      // Prepare payload for backend
      const payload = {
        firstName: form.name.split(' ')[0] || '',
        lastName: form.name.split(' ').slice(1).join(' ') || '',
        bio: form.bio,
        phone: form.phone,
        address: {
          street: form.address.street,
          city: form.address.city,
          state: form.address.state,
          zipCode: form.address.zip,
        },
        profilePicture: profilePictureUrl,
        medicalSchool: form.medicalSchool,
        yearOfStudy: form.graduationYear ? Number(form.graduationYear) : undefined,
        interests: Array.isArray(form.specialtiesOfInterest)
          ? form.specialtiesOfInterest
          : (typeof form.specialtiesOfInterest === 'string' && form.specialtiesOfInterest.length > 0
              ? form.specialtiesOfInterest.split(',').map(s => s.trim()).filter(Boolean)
              : []),
        licenseNumber: form.medicalLicenseNumber,
        specialization: form.specialtyExpertise,
        hospitalAffiliation: form.hospitalAffiliation,
        experience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        linkedInProfile: form.linkedInUrl,
      };
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
      const res = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Profile updated successfully!");
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        setSelectedImageFile(null); // Clear selected image after save
      } else {
        setMessage(data.message || "Failed to update profile.");
      }
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
          <Box display="flex" alignItems="center" flexDirection="column" gap={3} mb={5}>
            <Box sx={{ position: 'relative', width: 130, height: 130, mb: 1 }}>
              <Avatar
                src={
                  form.image && !form.image.startsWith('data:image/svg+xml') && form.image !== ''
                  ? form.image
                  : undefined
                }
                sx={{
                  width: 130,
                  height: 130,
                  border: '5px solid #fff',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                  fontSize: 44,
                  bgcolor: '#2193b0',
                  color: '#fff',
                  transition: 'box-shadow 0.3s',
                }}
              >
                {(!form.image || form.image.startsWith('data:image/svg+xml') || form.image === '') &&
                  form.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
              </Avatar>
              <Tooltip title="Change profile picture">
                <Box
                  component="div"
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    bgcolor: 'primary.main',
                    color: 'white',
                    p: 1.5,
                    borderRadius: '50%',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.12)'
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
            <Box display="flex" flexDirection="column" alignItems="center" mt={1}>
              <Typography variant="h5" sx={{ mb: 0.5, letterSpacing: 0.5, fontWeight: 700 }}>
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
              <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={() => router.push('/auth/change-password')}
                >
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