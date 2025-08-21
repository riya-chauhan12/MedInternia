import React, { useState, FormEvent, ChangeEvent } from "react";
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
  Tooltip // Added Tooltip for better UX
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // New icon for personal info
import ContactsIcon from '@mui/icons-material/Contacts'; // New icon for contact address
import WorkIcon from '@mui/icons-material/Work'; // New icon for role details
import KeyIcon from '@mui/icons-material/Key'; // New icon for password
import DeleteIcon from '@mui/icons-material/Delete'; // New icon for account management
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
      main: '#42a5f5', // A slightly softer blue
    },
    background: {
      default: '#f4f6f8',
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
      color: '#42a5f5',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    body2: {
      fontWeight: 500,
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
  },
});

export default function EditProfilePage() {
  // State to manage form data, initialized with placeholder values
  const [form, setForm] = useState<ProfileFormData>({
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
    image: "https://placehold.co/100x100/42a5f5/ffffff?text=User",
    role: "Doctor",
    medicalSchool: "",
    graduationYear: "",
    specialtiesOfInterest: "",
    linkedInUrl: "",
    medicalLicenseNumber: "",
    specialtyExpertise: "",
    hospitalAffiliation: "",
    yearsOfExperience: "",
  });

  // State to manage UI feedback and dialogs
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [errors, setErrors] = useState({
    email: '',
    phone: '',
    zip: '',
  });

  // Function to validate form fields
  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', phone: '', zip: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/; // Simple 10-digit check
    const zipRegex = /^\d{5}$/; // Simple 5-digit check

    if (!emailRegex.test(form.email)) {
      newErrors.email = 'Enter a valid email address.';
      isValid = false;
    }
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

  // Handles the change in profile picture
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setForm({ ...form, image: e.target.result as string });
        }
      };
      reader.readAsDataURL(event.target.files[0]);
    }
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box maxWidth={600} mx="auto" my={4}>
        <Card sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Avatar src={form.image} sx={{ width: 80, height: 80 }} />
            <Box>
              <Typography variant="h5">Edit Profile</Typography>
              <Box mt={1}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload-button"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="avatar-upload-button">
                  <Tooltip title="Upload a new profile picture">
                    <Button variant="outlined" component="span">
                      Change Picture
                    </Button>
                  </Tooltip>
                </label>
              </Box>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                <AccountCircleIcon /> Personal Information
              </Typography>
            </Box>
            <Stack spacing={2}>
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

            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                <ContactsIcon /> Contact Address
              </Typography>
            </Box>
            <Stack spacing={2}>
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

            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                <WorkIcon /> Role & Professional Details
              </Typography>
            </Box>
            <Stack spacing={2}>
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

            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                <KeyIcon /> Password & Privacy
              </Typography>
            </Box>
            <Stack spacing={2}>
                <Button variant="outlined" color="primary" fullWidth>
                  Change Password
                </Button>
            </Stack>

            <Divider sx={{ my: 4 }} />

            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                <DeleteIcon /> Account Management
              </Typography>
            </Box>
            <Stack spacing={2}>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => setOpenDeleteDialog(true)}
                >
                  Delete Profile
                </Button>
            </Stack>

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
              {loading && <CircularProgress size={24} sx={{ color: "#2193b0" }} />}
              {message && !loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, gap: '8px' }}>
                  <CheckCircleIcon color="success" />
                  <Typography
                    variant="body2"
                    color={message.includes("success") ? "success.main" : "error.main"}
                  >
                    {message}
                  </Typography>
                </Box>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ ml: 'auto' }}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </form>
        </Card>
      </Box>

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