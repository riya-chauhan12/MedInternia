
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { Container, Typography, TextField, Button, Box, Alert, MenuItem, Card, Avatar, Fade, Grow, Stack, LinearProgress, IconButton, InputAdornment, Divider } from '@mui/material';
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
    profilePicture: '',
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
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [googleCredential, setGoogleCredential] = useState('');

  const handleGoogleSuccess = async (response: any) => {
    try {
      setError('');
      const res = await api.post('/auth/google', {
        credential: response.credential,
        registerIfNotFound: false
      });
      
      const token = res.data?.data?.token;
      const user = res.data?.data?.user;
      const role = user?.role || user?.userType || '';
      const userId = user?._id || user?.id || '';
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId);
      
      router.push('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 404 && err.response?.data?.code === 'USER_NOT_FOUND') {
        const data = err.response.data.data;
        setForm(prev => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          profilePicture: data.profilePicture || ''
        }));
        setGoogleCredential(response.credential);
        setIsGoogleSignup(true);
      } else {
        setError(err.response?.data?.message || 'Google authentication failed');
      }
    }
  };

  useEffect(() => {
    if (isGoogleSignup || step !== 1) return;

    const initializeGoogleSignIn = () => {
      const google = (window as any).google;
      if (google && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
        });
        google.accounts.id.renderButton(
          document.getElementById('google-signup-button'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: 380,
            text: 'signup_with',
            shape: 'rectangular',
          }
        );
      }
    };

    const interval = setInterval(() => {
      if ((window as any).google) {
        initializeGoogleSignIn();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isGoogleSignup, step]);

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
  const res = await fetch('http://localhost:3000/api/auth/verify-otp', {
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
    const missing = requiredFieldsStep1.filter(f => {
      if (isGoogleSignup && f === 'password') return false;
      return !form[f];
    });
    if (missing.length > 0) {
      setError('Please fill all required fields.');
      return;
    }
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
    try {
      if (isGoogleSignup) {
        const res = await api.post('/auth/google', {
          credential: googleCredential,
          ...form
        });
        const token = res.data?.data?.token;
        const user = res.data?.data?.user;
        const role = user?.role || user?.userType || '';
        const userId = user?._id || user?.id || '';
        
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('userId', userId);
        
        router.push('/dashboard');
      } else {
        await api.post('/auth/register', form);
        router.push('/auth/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
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
        <Card elevation={8} sx={{ p: 4, borderRadius: 5, minWidth: 370, maxWidth: 450, width: '100%', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}>
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
                    {isGoogleSignup && (
                      <Fade in timeout={500}>
                        <Card variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', borderColor: 'primary.main', bgcolor: '#f0f7ff', borderRadius: 3, boxShadow: '0 4px 12px rgba(21, 147, 176, 0.08)' }}>
                          <Avatar src={form.profilePicture || ''} sx={{ width: 45, height: 45, mr: 2, border: '2px solid #2193b0' }} />
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main">Linked with Google</Typography>
                            <Typography variant="caption" color="text.secondary">{form.email}</Typography>
                          </Box>
                        </Card>
                      </Fade>
                    )}
                    <TextField label="First Name" name="firstName" fullWidth margin="normal" value={form.firstName} onChange={handleChange} required autoFocus disabled={isGoogleSignup} />
                    <TextField label="Last Name" name="lastName" fullWidth margin="normal" value={form.lastName} onChange={handleChange} required disabled={isGoogleSignup} />
                    <TextField label="Email" name="email" type="email" fullWidth margin="normal" value={form.email} onChange={handleChange} required disabled={isGoogleSignup} />
                    {!isGoogleSignup && (
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
                    )}
                    <TextField select label="User Type" name="userType" fullWidth margin="normal" value={form.userType} onChange={handleChange} required>
                      <MenuItem value="patient">Patient</MenuItem>
                      <MenuItem value="doctor">Doctor</MenuItem>
                      <MenuItem value="intern">Intern</MenuItem>
                    </TextField>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2, py: 1.3, fontWeight: 700, fontSize: '1.1rem', borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(31, 38, 135, 0.10)', transition: 'all 0.2s', '&:hover': { background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)', transform: 'scale(1.03)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' } }}
                    >
                      Next
                    </Button>
                    {!isGoogleSignup && (
                      <>
                        <Divider sx={{ my: 3 }}>or</Divider>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <div id="google-signup-button" style={{ width: '100%', maxWidth: '380px' }} />
                        </Box>
                      </>
                    )}
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
                            <TextField label="Year of Study" name="yearOfStudy" type="number" fullWidth margin="normal" value={form.yearOfStudy} onChange={handleChange} required />
                            <TextField label="Interests (comma separated)" name="interests" fullWidth margin="normal" value={form.interests} onChange={handleChange} />
                            <TextField label="Mentor Doctor ID (optional)" name="mentorDoctor" fullWidth margin="normal" value={form.mentorDoctor} onChange={handleChange} />
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
                          <TextField label="Emergency Contact Relationship" name="emergencyContactRelationship" fullWidth margin="normal" value={form.emergencyContactRelationship} onChange={handleChange} />
                          <TextField label="Medical History (comma separated)" name="medicalHistory" fullWidth margin="normal" value={form.medicalHistory} onChange={handleChange} />
                          <TextField label="Allergies (comma separated)" name="allergies" fullWidth margin="normal" value={form.allergies} onChange={handleChange} />
                        </Box>
                      </Fade>
                    )}
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Button variant="outlined" color="primary" onClick={handleBack} sx={{ flex: 1, py: 1.3, fontWeight: 700, fontSize: '1.1rem', borderRadius: 3 }}>Back</Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{
                          flex: 1,
                          py: 1.3,
                          fontWeight: 800,
                          fontSize: '1.13rem',
                          borderRadius: 3,
                          letterSpacing: 1,
                          background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)',
                          boxShadow: '0 4px 20px 0 rgba(33,147,176,0.13)',
                          transition: 'all 0.18s',
                          textTransform: 'uppercase',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #1565c0 0%, #2193b0 100%)',
                            transform: 'scale(1.04)',
                            boxShadow: '0 8px 32px 0 rgba(33,147,176,0.18)'
                          }
                        }}
                      >
                        Register
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
