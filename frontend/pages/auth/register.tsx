
import { useState, useEffect } from 'react';
import {
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  MenuItem,
  Fade,
  Grow,
  Stack,
  LinearProgress,
  CircularProgress,
  IconButton,
  InputAdornment,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { medicalColleges } from "../../utils/medicalColleges";
import api from '../../utils/api';
import { useRouter } from 'next/router';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AuthLayout, { AuthCard, AuthBackLink } from '../../components/auth/AuthLayout';
import { useAuth, setGlobalToken } from '../../context/AuthContext';


export default function Register() {
  const { login: authLogin } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'patient',
    phone: '',
    dateOfBirth: '',
    gender: '',
    // Doctor fields
    specialization: '',
    licenseNumber: '',
    experience: '',
    qualifications: '',
    // Intern fields
    medicalSchool: '',
    yearOfStudy: '',
    interests: '',
    mentorDoctor: '',
    // Patient fields
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    medicalHistory: '',
    allergies: '',
  });
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emergencyPhoneError, setEmergencyPhoneError] = useState('');
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  // GSSoC: Loading state for submit button
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [otherRelation, setotherRelation] = useState(false);
  const [otherRelationValue, setotherRelationValue] = useState('');
  const [othermedicalHistory, setothermedicalHistory] = useState(false);
  const [otherMedicalHistoryValue, setotherMedicalHistoryValue] = useState('');
  const [otherAllergies, setotherAllergies] = useState(false);
  const [otherAllergiesValue, setotherAllergiesValue] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const authFieldSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'background.paper',
    },
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  // OTP verification states
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  // For progress bar
  const requiredFieldsStep1: (keyof typeof form)[] = ['firstName', 'lastName', 'email', 'password', 'userType'];
  const requiredFieldsStep2: Record<string, (keyof typeof form)[]> = {
    doctor: ['specialization', 'licenseNumber'],
    intern: ['medicalSchool', 'yearOfStudy'],
    patient: [],
  };
  function getStep2Fields(): (keyof typeof form)[] {
    if (form.userType === 'doctor') return requiredFieldsStep2.doctor;
    if (form.userType === 'intern') return requiredFieldsStep2.intern;
    return [];
  }

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');

        console.log('Doctors:', res.data.data.doctors);

        setDoctors(res.data.data.doctors || []);
      } catch (err) {
        console.error('Failed to fetch doctors', err);
      }
    };

    fetchDoctors();
  }, []);


  function getProgress() {
    if (step === 1) {
      const filled = requiredFieldsStep1.filter(f => form[f]);
      return Math.round((filled.length / requiredFieldsStep1.length) * 100);
    } else {
      const fields = getStep2Fields();
      if (fields.length === 0) return 100;
      const filled = fields.filter(f => form[f]);
      return Math.round((filled.length / fields.length) * 100);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    const { name, value } = e.target;
    switch (name) {
      case 'otherRelationship':
        setotherRelationValue(value);
        break;
      case 'emergencyContactRelationship':
        if (value === 'Other') {
          setotherRelation(true);
        } else {
          setotherRelation(false);
          setotherRelationValue('');
        }
        break;

      case 'otherMedicalHistory':
        setotherMedicalHistoryValue(value);
        break;

      case 'medicalHistory':
        if (value === 'Other') {
          setothermedicalHistory(true);
        }
        else {
          setothermedicalHistory(false);
          setotherMedicalHistoryValue('');
        }
        break;

      case 'otherAllergies':
        setotherAllergiesValue(value);
        break;
      case 'allergies':
        if (value === 'Other') {
          setotherAllergies(true);
        }
        else {
          setotherAllergies(false);
          setotherAllergiesValue('');
        }
        break;

      default:
        break;
    }
  };

  const validatePhone = (value: string) => /^\d{10}$/.test(value);

  const getOptionalPhoneError = (value: string, label = 'mobile number') => {
    if (!value) return '';
    return validatePhone(value) ? '' : `Enter a valid 10-digit ${label}.`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setForm({ ...form, [name]: digits });

    const errorMessage = getOptionalPhoneError(digits);

    if (name === 'phone') {
      setPhoneError(errorMessage);
    } else if (name === 'emergencyContactPhone') {
      setEmergencyPhoneError(errorMessage);
    }
  };

  const handleEmailChange = (e: any) => {
    handleChange(e);
    if (emailVerified) {
      setEmailVerified(false);
      setVerificationToken('');
    }
  };

  const handleSendOtp = async () => {
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError('Please enter a valid email address before verifying.');
      return;
    }
    setSendingOtp(true);
    setError('');
    setOtpError('');
    try {
      const res = await api.post('/auth/send-otp', { email: form.email });
      const data = res.data;
      if (data.success) {
        setOtpModalOpen(true);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP');
    }
    setSendingOtp(false);
  };

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/verify-otp', { email: form.email, otp });
      const data = res.data;
      if (data.success) {
        setEmailVerified(true);
        setVerificationToken(data.verificationToken);
        setOtpModalOpen(false);
      } else {
        setOtpError('Invalid OTP');
      }
    } catch (err) {
      setOtpError('Verification failed');
    }
    setVerifyingOtp(false);
  };

  function getPasswordRequirements(password: string) {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One digit', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
    ];
  }

  function isPasswordValid(password: string): boolean {
    return getPasswordRequirements(password).every(r => r.met);
  }
  const handleNext = (e: any) => {
    e.preventDefault();
    setError('');
    // Check all required fields in step 1 are filled
    const missing = requiredFieldsStep1.filter(f => !form[f]);
    if (missing.length > 0) {
      setError('Please fill all required fields.');
      return;
    }
    if (!emailVerified) {
      setError('Please verify your email address to proceed.');
      return;
    }
    if (!isPasswordValid(form.password)) {
      setPasswordError('Please meet all password requirements.');
      return;
    }
    setPasswordError('');
    if (confirmPassword !== form.password) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }
    setConfirmPasswordError('');
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    const phoneValidationError = getOptionalPhoneError(form.phone);
    const emergencyPhoneValidationError = getOptionalPhoneError(form.emergencyContactPhone, 'emergency contact number');
    const dob = form.dateOfBirth ? new Date(form.dateOfBirth) : null;
    const today = new Date();
    if (form.userType === 'patient' && form.phone === form.emergencyContactPhone) {
      setError('Phone number and emergency contact number cannot be the same.');
      return;
    }
    if (form.userType === 'doctor') {
      if (parseInt(form.experience, 10) < 0) {
        setError('Experience cannot be a negative number.');
        return;
      }
      if (!/^[A-Za-z0-9\/\- ]{4,30}$/.test(form.licenseNumber)) {
        setError('Enter a valid License Number');
        return;
      }
      let age = today.getFullYear() - (dob ? dob.getFullYear() : today.getFullYear());
      if (dob && (age < 22)) {
        setError('Minimum age requirement not met.');
        return;
      }
    }
    if (form.userType === "intern") {
      const isValidCollege = medicalColleges.some(
        (college) => college.name === form.medicalSchool
      );

      if (!isValidCollege) {
        setError("Please select a valid medical school from the list.");
        return;
      }
    }

    if (dob && dob > today) {
      setError('Date of birth cannot be in the future.');
      return;
    }
    setPhoneError(phoneValidationError);
    setEmergencyPhoneError(emergencyPhoneValidationError);

    if (phoneValidationError) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (emergencyPhoneValidationError) {
      setError('Please enter a valid 10-digit emergency contact number.');
      return;
    }

    // Check all required fields in step 2 are filled
    const fields = getStep2Fields();
    const missing = fields.filter(f => !form[f]);
    if (missing.length > 0) {
      setError('Please fill all required fields.');
      return;
    }
    // GSSoC: Show loading spinner while request is in-flight
    setLoading(true);
    try {
      // Build payload — omit empty optional fields
      const payload: Record<string, any> = {
        ...form,
        verificationToken,
        medicalHistory:
          form.medicalHistory === 'Other'
            ? otherMedicalHistoryValue
            : form.medicalHistory,

        allergies:
          form.allergies === 'Other'
            ? otherAllergiesValue
            : form.allergies,
      };

      if (form.userType === 'patient') {
        payload.emergencyContact = {
          name: form.emergencyContactName,
          phone: form.emergencyContactPhone,
          relationship:
            form.emergencyContactRelationship === 'Other'
              ? otherRelationValue
              : form.emergencyContactRelationship,
        };
        // Remove flat keys from root of payload
        delete payload.emergencyContactName;
        delete payload.emergencyContactPhone;
        delete payload.emergencyContactRelationship;
        delete payload.emergencyContactRelationshipOther;
      }

      if (!payload.mentorDoctor) delete payload.mentorDoctor;
      if (!payload.phone) delete payload.phone;
      if (!payload.dateOfBirth) delete payload.dateOfBirth;
      if (!payload.gender) delete payload.gender;
      const res = await api.post('/auth/register', payload);
      const token = res.data.data.token;
      const user = res.data.data.user;
      setGlobalToken(token);
      authLogin(token, user._id || user.id, user);

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      wide
      title="Join MedInternia"
      subtitle="Create your account and connect with doctors, interns, and students. Start learning from real cases today."
    >
      <Box sx={{ animation: 'fadeIn 0.9s ease-out', width: '100%' }}>
        <AuthCard
          sx={{
            maxHeight: { xs: 'calc(100vh - 112px)', md: 'none' },
            overflowY: { xs: 'auto', md: 'visible' },
            '& .MuiTextField-root': {
              my: { xs: 1, sm: 1.25 },
            },
          }}
        >
          <AuthBackLink />
          <Typography variant="h4" fontWeight={800} color="primary.main" gutterBottom align="center">
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Step {step} of 2 — {step === 1 ? 'Basic information' : 'Profile details'}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {/* Loader removed as requested */}
          <form onSubmit={step === 1 ? handleNext : handleSubmit}>
            <Box>
              <Box>
                {step === 1 && (
                  <>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        columnGap: 2,
                      }}
                    >
                      <TextField label="First Name" name="firstName" fullWidth margin="normal" value={form.firstName} onChange={handleChange} required autoFocus sx={authFieldSx} />
                      <TextField label="Last Name" name="lastName" fullWidth margin="normal" value={form.lastName} onChange={handleChange} required sx={authFieldSx} />
                      <TextField 
                        label="Email" 
                        name="email" 
                        type="email" 
                        fullWidth 
                        margin="normal" 
                        value={form.email} 
                        onChange={handleEmailChange} 
                        required 
                        sx={{ ...authFieldSx, gridColumn: '1 / -1' }} 
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button 
                                variant="contained" 
                                size="small" 
                                onClick={handleSendOtp}
                                disabled={sendingOtp || emailVerified || !form.email}
                                color={emailVerified ? "success" : "primary"}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                              >
                                {emailVerified ? "Verified" : sendingOtp ? "Sending..." : "Verify"}
                              </Button>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        margin="normal"
                        value={form.password}
                        onChange={handleChange}
                        required
                        sx={{
                          ...authFieldSx,
                          '& .MuiInputBase-input': {
                            animation: showPassword
                              ? 'revealPassword 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                              : 'hidePassword 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                            '@keyframes revealPassword': {
                              '0%': {
                                filter: 'blur(5px)',
                                letterSpacing: '0.12em',
                                opacity: 0,
                                clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
                              },
                              '40%': {
                                opacity: 0.6,
                              },
                              '100%': {
                                filter: 'blur(0)',
                                letterSpacing: 'normal',
                                opacity: 1,
                                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                              }
                            },
                            '@keyframes hidePassword': {
                              '0%': {
                                filter: 'blur(5px)',
                                letterSpacing: '0.12em',
                                opacity: 0,
                                clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
                              },
                              '40%': {
                                opacity: 0.6,
                              },
                              '100%': {
                                filter: 'blur(0)',
                                letterSpacing: 'normal',
                                opacity: 1,
                                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                              }
                            }
                          },
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                aria-pressed={showPassword}
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                                sx={{
                                  color: 'text.secondary',
                                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    transform: 'scale(1.12)',
                                    color: 'primary.main',
                                  },
                                  '&:active': {
                                    transform: 'scale(0.93)',
                                  },
                                  mr: 0.5,
                                }}
                              >
                                {showPassword ? (
                                  <VisibilityOff
                                    sx={{
                                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                      animation: 'premiumRotateOut 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                                      '@keyframes premiumRotateOut': {
                                        '0%': { opacity: 0, transform: 'rotate(-25deg) scale(0.8)' },
                                        '100%': { opacity: 1, transform: 'rotate(0deg) scale(1)' }
                                      }
                                    }}
                                  />
                                ) : (
                                  <Visibility
                                    sx={{
                                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                      animation: 'premiumRotateIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                                      '@keyframes premiumRotateIn': {
                                        '0%': { opacity: 0, transform: 'rotate(25deg) scale(0.8)' },
                                        '100%': { opacity: 1, transform: 'rotate(0deg) scale(1)' }
                                      }
                                    }}
                                  />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        error={Boolean(passwordError)}
                      />
                      {form.password && (
                        <Box sx={{ mt: -1, mb: 1, gridColumn: '1 / -1' }}>
                          {getPasswordRequirements(form.password).map((req) => (
                            <Box
                              key={req.label}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                fontSize: '0.75rem',
                                color: req.met ? 'success.main' : 'text.secondary',
                              }}
                            >
                              {req.met ? '✓' : '○'} {req.label}
                            </Box>
                          ))}
                        </Box>
                      )}
                      <TextField
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        fullWidth
                        margin="normal"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (e.target.value !== form.password) {
                            setConfirmPasswordError('Passwords do not match');
                          } else {
                            setConfirmPasswordError('');
                          }
                        }}
                        required
                        error={Boolean((confirmPassword && confirmPassword !== form.password) || (!confirmPassword && confirmPasswordError))}
                        helperText={
                          confirmPassword && confirmPassword !== form.password
                            ? 'Passwords do not match'
                            : !confirmPassword
                              ? confirmPasswordError
                              : ''
                        }
                        sx={authFieldSx}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                aria-pressed={showConfirmPassword}
                                onClick={() => setShowConfirmPassword((show) => !show)}
                                edge="end"
                                sx={{ color: 'text.secondary' }}
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField select label="User Type" name="userType" fullWidth margin="normal" value={form.userType} onChange={handleChange} required sx={{ ...authFieldSx, gridColumn: '1 / -1' }}>
                        <MenuItem value="patient">Patient</MenuItem>
                        <MenuItem value="doctor">Doctor</MenuItem>
                        <MenuItem value="intern">Intern</MenuItem>
                      </TextField>
                    </Box>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2, py: 1.3, fontWeight: 700, borderRadius: 3, textTransform: 'none' }}
                    >
                      Next
                    </Button>
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <span style={{ color: '#888', fontSize: 15 }}>Already registered? </span>
                      <Button variant="text" color="primary" size="small" sx={{ fontWeight: 700, textTransform: 'none', fontSize: 15, ml: 0.5, p: 0 }} onClick={() => window.location.href = '/auth/login'}>
                        Login
                      </Button>
                    </Box>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        columnGap: 2,
                      }}
                    >
                      <TextField
                        label="Phone"
                        name="phone"
                        fullWidth
                        margin="normal"
                        value={form.phone}
                        onChange={handlePhoneChange}
                        error={Boolean(phoneError)}
                        helperText={phoneError || 'Enter a 10-digit mobile number'}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
                        sx={authFieldSx}
                      />
                      <TextField label="Date of Birth" name="dateOfBirth" type="date" fullWidth margin="normal" value={form.dateOfBirth} onChange={handleChange} InputLabelProps={{ shrink: true }} sx={authFieldSx} />
                      <TextField select label="Gender" name="gender" fullWidth margin="normal" value={form.gender} onChange={handleChange} sx={{ ...authFieldSx, gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </TextField>
                    </Box>

                    {/* Doctor-specific fields */}
                    {form.userType === 'doctor' && (
                      <Fade in timeout={600}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2 }}>
                          <TextField label="Specialization" name="specialization" fullWidth margin="normal" value={form.specialization} onChange={handleChange} required sx={authFieldSx} />
                          <TextField label="License Number" name="licenseNumber" fullWidth margin="normal" value={form.licenseNumber} onChange={handleChange} required sx={authFieldSx} />
                          <TextField label="Experience (years)" name="experience" type="number" fullWidth margin="normal" value={form.experience} onChange={handleChange} sx={authFieldSx} />
                          <TextField label="Qualifications (comma separated)" name="qualifications" fullWidth margin="normal" value={form.qualifications} onChange={handleChange} sx={authFieldSx} />
                        </Box>
                      </Fade>
                    )}

                    {/* Intern-specific fields */}
                    {form.userType === 'intern' && (
                      <Fade in timeout={600}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2 }}>
                          <Autocomplete
                            sx={{ width: "100%" }}
                            options={medicalColleges}
                            clearOnBlur={false}
                            selectOnFocus
                            getOptionLabel={(option) =>
                              `${option.name} (${option.state})`
                            }
                            isOptionEqualToValue={(option, value) =>
                              option.id === value.id}
                            value={
                              medicalColleges.find(
                                (college) => college.name === form.medicalSchool
                              ) || null
                            }
                            onChange={(_, value) =>
                              setForm({
                                ...form,
                                medicalSchool: value?.name || "",
                              })
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Medical School"
                                required
                                margin="normal"
                                fullWidth
                                sx={authFieldSx}
                              />
                            )}
                          />
                          <TextField
                            select
                            label="Year of Study"
                            required
                            name="yearOfStudy"
                            fullWidth
                            margin="normal"
                            value={form.yearOfStudy}
                            onChange={handleChange}
                            sx={authFieldSx}
                          >
                            <MenuItem value="">Select year</MenuItem>
                            <MenuItem value="1">1st Year</MenuItem>
                            <MenuItem value="2">2nd Year</MenuItem>
                            <MenuItem value="3">3rd Year</MenuItem>
                            <MenuItem value="4">4th Year</MenuItem>
                            <MenuItem value="5">5th Year</MenuItem>
                            <MenuItem value="6+">6th Year+</MenuItem>
                          </TextField>
                          <TextField label="Interests (comma separated)" name="interests" fullWidth margin="normal" value={form.interests} onChange={handleChange} sx={authFieldSx} />
                          <TextField
                            select
                            label="Mentor Doctor (Optional)"
                            name="mentorDoctor"
                            fullWidth
                            margin="normal"
                            value={form.mentorDoctor}
                            onChange={handleChange}
                            sx={authFieldSx}
                          >
                            <MenuItem value="">
                              No Mentor Selected
                            </MenuItem>

                            {doctors.map((doctor) => (
                              <MenuItem key={doctor._id} value={doctor._id}>
                                Dr. {doctor.firstName} {doctor.lastName}
                                {doctor.specialization
                                  ? ` - ${doctor.specialization}`
                                  : ''}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Box>
                      </Fade>
                    )}

                    {/* Patient-specific fields */}
                    {form.userType === 'patient' && (
                      <Fade in timeout={600}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2 }}>
                          <TextField label="Emergency Contact Name" name="emergencyContactName" fullWidth margin="normal" value={form.emergencyContactName} onChange={handleChange} sx={authFieldSx} />
                          <TextField
                            label="Emergency Contact Phone"
                            name="emergencyContactPhone"
                            fullWidth
                            margin="normal"
                            value={form.emergencyContactPhone}
                            onChange={handlePhoneChange}
                            error={Boolean(emergencyPhoneError)}
                            helperText={emergencyPhoneError || 'Enter a 10-digit mobile number'}
                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
                            sx={authFieldSx}
                          />
                          <TextField
                            select
                            label="Emergency Contact Relationship"
                            name="emergencyContactRelationship"
                            fullWidth
                            margin="normal"
                            value={form.emergencyContactRelationship}
                            onChange={handleChange}
                            sx={authFieldSx}
                          >
                            <MenuItem value="">Select relationship</MenuItem>
                            <MenuItem value="Spouse">Spouse</MenuItem>
                            <MenuItem value="Parent">Parent</MenuItem>
                            <MenuItem value="Sibling">Sibling</MenuItem>
                            <MenuItem value="Child">Child</MenuItem>
                            <MenuItem value="Friend">Friend</MenuItem>
                            <MenuItem value="Guardian">Guardian</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </TextField>
                          {otherRelation && (
                            <TextField
                              label="Please specify relationship"
                              name="otherRelationship"
                              fullWidth
                              margin="normal"
                              value={otherRelationValue}
                              onChange={handleChange}
                              sx={authFieldSx}
                            />
                          )}
                          <TextField
                            select
                            label="Medical History"
                            name="medicalHistory"
                            fullWidth
                            margin="normal"
                            value={form.medicalHistory}
                            onChange={handleChange}
                            sx={authFieldSx}
                          >
                            <MenuItem value="">Select medical history</MenuItem>
                            <MenuItem value="None">None</MenuItem>
                            <MenuItem value="Hypertension">Hypertension</MenuItem>
                            <MenuItem value="Diabetes">Diabetes</MenuItem>
                            <MenuItem value="Asthma">Asthma</MenuItem>
                            <MenuItem value="Heart Disease">Heart Disease</MenuItem>
                            <MenuItem value="Thyroid Disorder">Thyroid Disorder</MenuItem>
                            <MenuItem value="Kidney Disease">Kidney Disease</MenuItem>
                            <MenuItem value="Cancer">Cancer</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </TextField>
                          {othermedicalHistory && (
                            <TextField
                              label="Please specify medical history"
                              name="otherMedicalHistory"
                              fullWidth
                              margin="normal"
                              value={otherMedicalHistoryValue}
                              onChange={handleChange}
                              sx={authFieldSx}
                            />
                          )}
                          <TextField
                            select
                            label="Allergies"
                            name="allergies"
                            fullWidth
                            margin="normal"
                            value={form.allergies}
                            onChange={handleChange}
                            sx={authFieldSx}
                          >
                            <MenuItem value="">Select allergies</MenuItem>
                            <MenuItem value="None">None</MenuItem>
                            <MenuItem value="Penicillin">Penicillin</MenuItem>
                            <MenuItem value="Latex">Latex</MenuItem>
                            <MenuItem value="Peanuts">Peanuts</MenuItem>
                            <MenuItem value="Shellfish">Shellfish</MenuItem>
                            <MenuItem value="Dust">Dust</MenuItem>
                            <MenuItem value="Pollen">Pollen</MenuItem>
                            <MenuItem value="Animal Dander">Animal Dander</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </TextField>
                          {otherAllergies && (
                            <TextField
                              label="Please specify allergies"
                              name="otherAllergies"
                              fullWidth
                              margin="normal"
                              value={otherAllergiesValue}
                              onChange={handleChange}
                              sx={authFieldSx}
                            />
                          )}
                        </Box>
                      </Fade>
                    )}
                    <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                      <Button
                        variant="text"
                        color="primary"
                        onClick={handleBack}
                        sx={{ flex: 1, py: 1.3, fontWeight: 600, borderRadius: 3 }}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        aria-label="Register"
                        sx={{ flex: 1, py: 1.3, fontWeight: 700, borderRadius: 3, textTransform: 'none' }}
                      >
                        {loading ? <CircularProgress size={22} color="inherit" /> : 'Register'}
                      </Button>
                    </Stack>
                  </>
                )}
              </Box>
            </Box>
          </form>
        </AuthCard>
      </Box>
      <Dialog open={otpModalOpen} onClose={() => setOtpModalOpen(false)}>
        <DialogTitle>Verify Email</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            An OTP has been sent to {form.email}. Please enter it below.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="OTP Code"
            type="text"
            fullWidth
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            error={!!otpError}
            helperText={otpError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpModalOpen(false)}>Cancel</Button>
          <Button onClick={handleVerifyOtp} variant="contained" disabled={!otp || verifyingOtp}>
            {verifyingOtp ? <CircularProgress size={20} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </AuthLayout>
  );
}
