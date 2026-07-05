
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { Container, Typography, TextField, Button, Box, Alert, MenuItem, Card, Avatar, Fade, Grow, Stack, LinearProgress, IconButton, InputAdornment } from '@mui/material';
import api from '../../utils/api';
import { useRouter } from 'next/router';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';


export default function Register() {
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

  // Email change triggers OTP send
  // const handleEmailChange = async (e: any) => {
  //   handleChange(e);
  //   setEmailVerified(false);
  //   setOtp('');
  //   setOtpError('');
  //   if (e.target.value && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.target.value)) {
  //     setSendingOtp(true);
  //     try {
  //       const res = await fetch('http://localhost:3000/api/auth/send-otp', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ email: e.target.value })
  //       });
  //       const data = await res.json();
  //       if (data.success) {
  //         setOtpModalOpen(true);
  //       } else {
  //         setOtpError(data.message || 'Failed to send OTP');
  //       }
  //     } catch (err) {
  //       setOtpError('Failed to send OTP');
  //     }
  //     setSendingOtp(false);
  //   }
  // };
  const handleEmailChange = (e: any) => {
    handleChange(e);
    // Email verification logic skipped
  };

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    setOtpError('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      const res = await fetch(`${backendUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp })
      });
      const data = await res.json();
      if (data.success) {
        setEmailVerified(true);
        setOtpModalOpen(false);
      } else {
        setOtpError('Invalid OTP');
      }
    } catch (err) {
      setOtpError('Verification failed');
    }
    setVerifyingOtp(false);
  };


  const handleNext = (e: any) => {
    e.preventDefault();
    setError('');
    // Check all required fields in step 1 are filled
    const missing = requiredFieldsStep1.filter(f => !form[f]);
    if (missing.length > 0) {
      setError('Please fill all required fields.');
      return;
    }
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
    if (form.userType === 'intern') {
      if (!/^[A-Za-z\s.,'-]{3,100}$/.test(form.medicalSchool)) {
        setError('Enter a valid Medical School name');
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
      // Build payload — omit empty optional ObjectId fields so Mongoose doesn't
      // try to cast an empty string to an ObjectId and throw a 400.
      const payload: Record<string, any> = {
        ...form,
        emergencyContactRelationship:
          form.emergencyContactRelationship === 'Other'
            ? otherRelationValue
            : form.emergencyContactRelationship,

        medicalHistory:
          form.medicalHistory === 'Other'
            ? otherMedicalHistoryValue
            : form.medicalHistory,

        allergies:
          form.allergies === 'Other'
            ? otherAllergiesValue
            : form.allergies,
      };
      if (!payload.mentorDoctor) delete payload.mentorDoctor;
      if (!payload.phone) delete payload.phone;
      if (!payload.dateOfBirth) delete payload.dateOfBirth;
      if (!payload.gender) delete payload.gender;
      const res = await api.post('/auth/register', payload);
      const user = res.data.data.user;
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('userId', user._id || user.id);
      localStorage.setItem('user', JSON.stringify(user));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 6
    }}>
      <Fade in timeout={900}>
        {/* GSSoC: card-enter adds fade-in-up; mobile width improved */}
        <Card elevation={8} className="card-enter" sx={{ p: { xs: 3, sm: 4 }, borderRadius: 5, minWidth: { xs: 0, sm: 370 }, maxWidth: 450, width: '100%', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'white', width: 80, height: 80, mb: 1, boxShadow: 3 }}>
              <img src="/med-internia-logo.jpg" alt="MedInternia Logo" style={{ width: '100%', height: '100%' }} />
            </Avatar>
            <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
              Join MedInternia
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 1 }}>
              Create your account and start your journey in the medical community.
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {/* Loader removed as requested */}
          <form onSubmit={step === 1 ? handleNext : handleSubmit}>
            <Grow in timeout={700}>
              <Box>
                {step === 1 && (
                  <>
                    <TextField label="First Name" name="firstName" fullWidth margin="normal" value={form.firstName} onChange={handleChange} required autoFocus />
                    <TextField label="Last Name" name="lastName" fullWidth margin="normal" value={form.lastName} onChange={handleChange} required />
                    <TextField label="Email" name="email" type="email" fullWidth margin="normal" value={form.email} onChange={handleChange} required />
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
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              onClick={handleClickShowPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                              sx={{
                                color: 'text.secondary',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  transform: 'scale(1.12)',
                                  color: '#1565c0',
                                  filter: 'drop-shadow(0 0 4px rgba(21, 147, 176, 0.4))',
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
                    />
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
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
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
                    <TextField select label="User Type" name="userType" fullWidth margin="normal" value={form.userType} onChange={handleChange} required>
                      <MenuItem value="patient">Patient</MenuItem>
                      <MenuItem value="doctor">Doctor</MenuItem>
                      <MenuItem value="intern">Intern</MenuItem>
                    </TextField>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{
                        mt: 2,
                        py: 1.3,
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        borderRadius: 3,
                        letterSpacing: 0.5,
                        background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)',
                        color: '#ffffff',
                        boxShadow: '0 4px 20px 0 rgba(33, 147, 176, 0.13)',
                        transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        textTransform: 'uppercase',
                        '&:hover': {
                          background: 'linear-gradient(90deg, #1565c0 0%, #2193b0 100%)',
                          transform: 'scale(1.03)',
                          boxShadow: '0 8px 32px 0 rgba(33, 147, 176, 0.18)',
                          color: '#ffffff'
                        }
                      }}
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
                    />
                    <TextField label="Date of Birth" name="dateOfBirth" type="date" fullWidth margin="normal" value={form.dateOfBirth} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    <TextField select label="Gender" name="gender" fullWidth margin="normal" value={form.gender} onChange={handleChange}>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>

                    {/* Doctor-specific fields */}
                    {form.userType === 'doctor' && (
                      <Fade in timeout={600}>
                        <Box>
                          <TextField label="Specialization" name="specialization" fullWidth margin="normal" value={form.specialization} onChange={handleChange} required />
                          <TextField label="License Number" name="licenseNumber" fullWidth margin="normal" value={form.licenseNumber} onChange={handleChange} required />
                          <TextField label="Experience (years)" name="experience" type="number" fullWidth margin="normal" value={form.experience} onChange={handleChange} />
                          <TextField label="Qualifications (comma separated)" name="qualifications" fullWidth margin="normal" value={form.qualifications} onChange={handleChange} />
                        </Box>
                      </Fade>
                    )}

                    {/* Intern-specific fields */}
                    {form.userType === 'intern' && (
                      <Fade in timeout={600}>
                        <Box>
                          <TextField label="Medical School" name="medicalSchool" fullWidth margin="normal" value={form.medicalSchool} onChange={handleChange} required />
                          <TextField
                            select
                            label="Year of Study"
                            name="yearOfStudy"
                            fullWidth
                            margin="normal"
                            value={form.yearOfStudy}
                            onChange={handleChange}
                          >
                            <MenuItem value="">Select year</MenuItem>
                            <MenuItem value="1">1st Year</MenuItem>
                            <MenuItem value="2">2nd Year</MenuItem>
                            <MenuItem value="3">3rd Year</MenuItem>
                            <MenuItem value="4">4th Year</MenuItem>
                            <MenuItem value="5">5th Year</MenuItem>
                            <MenuItem value="6+">6th Year+</MenuItem>
                          </TextField>
                          <TextField label="Interests (comma separated)" name="interests" fullWidth margin="normal" value={form.interests} onChange={handleChange} />
                          <TextField
                            select
                            label="Mentor Doctor (Optional)"
                            name="mentorDoctor"
                            fullWidth
                            margin="normal"
                            value={form.mentorDoctor}
                            onChange={handleChange}
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
                        <Box>
                          <TextField label="Emergency Contact Name" name="emergencyContactName" fullWidth margin="normal" value={form.emergencyContactName} onChange={handleChange} />
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
                          />
                          <TextField
                            select
                            label="Emergency Contact Relationship"
                            name="emergencyContactRelationship"
                            fullWidth
                            margin="normal"
                            value={form.emergencyContactRelationship}
                            onChange={handleChange}
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
                            />
                          )}
                        </Box>
                      </Fade>
                    )}
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleBack}
                        sx={{
                          flex: 1,
                          py: 1.3,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          borderRadius: 3,
                          border: '2px solid #2193b0',
                          color: '#2193b0',
                          transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                          '&:hover': {
                            border: '2px solid #1565c0',
                            background: 'rgba(33, 147, 176, 0.05)',
                            color: '#1565c0',
                            transform: 'scale(1.02)'
                          }
                        }}
                      >
                        Back
                      </Button>
                      {/* GSSoC: Disabled + spinner when loading */}
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        aria-label="Register"
                        sx={{
                          flex: 1,
                          py: 1.3,
                          fontWeight: 800,
                          fontSize: '1.13rem',
                          borderRadius: 3,
                          letterSpacing: 1,
                          background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)',
                          color: '#ffffff',
                          boxShadow: '0 4px 20px 0 rgba(33,147,176,0.13)',
                          transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                          textTransform: 'uppercase',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #1565c0 0%, #2193b0 100%)',
                            transform: 'scale(1.04)',
                            boxShadow: '0 8px 32px 0 rgba(33,147,176,0.18)',
                            color: '#ffffff'
                          }
                        }}
                      >
                        {loading ? <CircularProgress size={22} color="inherit" /> : 'Register'}
                      </Button>
                    </Stack>
                  </>
                )}
              </Box>
            </Grow>
          </form>
        </Card>
      </Fade>
    </Box>
  );
}
