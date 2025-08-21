
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { Container, Typography, TextField, Button, Box, Alert, MenuItem, Card, Avatar, Fade, Grow, Stack, LinearProgress } from '@mui/material';
import api from '../../utils/api';
import { useRouter } from 'next/router';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

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
  const [step, setStep] = useState(1);
  const router = useRouter();
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

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    const missing = requiredFieldsStep1.filter(f => !form[f]);
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
    // Check all required fields in step 2 are filled
    const fields = getStep2Fields();
    const missing = fields.filter(f => !form[f]);
    if (missing.length > 0) {
      setError('Please fill all required fields.');
      return;
    }
    try {
      await api.post('/auth/register', form);
      router.push('/auth/login');
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
        <Box>
          <Card elevation={8} sx={{ p: 4, borderRadius: 5, minWidth: 370, maxWidth: 450, width: '100%', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mb: 1, boxShadow: 3 }}>
                <MedicalServicesIcon fontSize="large" />
              </Avatar>
              <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
                Join MedInternia
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 1 }}>
                Create your account and start your journey in the medical community.
              </Typography>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={getProgress()} sx={{ height: 8, borderRadius: 5 }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>{getProgress()}% complete</Typography>
            </Box>
            <form onSubmit={step === 1 ? handleNext : handleSubmit}>
              <Grow in timeout={700}>
                <Box>
                  {step === 1 && (
                    <>
                      <TextField label="First Name" name="firstName" fullWidth margin="normal" value={form.firstName} onChange={handleChange} required autoFocus />
                      <TextField label="Last Name" name="lastName" fullWidth margin="normal" value={form.lastName} onChange={handleChange} required />
                      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                        <TextField label="Email" name="email" type="email" fullWidth margin="normal" value={form.email} onChange={handleEmailChange} required sx={{ flex: 1 }} />
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ mb: 1, ml: 2, py: 1.3, fontWeight: 700, fontSize: '1.1rem', borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(31, 38, 135, 0.10)', transition: 'all 0.2s', minWidth: '90px', height: '56px', '&:hover': { background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)', transform: 'scale(1.03)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' } }}
                          disabled={!form.email}
                          onClick={() => {}}
                        >
                          Verify
                        </Button>
                      </Box>
                      <TextField label="Password" name="password" type="password" fullWidth margin="normal" value={form.password} onChange={handleChange} required />
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
                        // Next button is always enabled now
                      >
                        Next
                      </Button>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <TextField label="Phone" name="phone" fullWidth margin="normal" value={form.phone} onChange={handleChange} />
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
                            <TextField label="Emergency Contact Phone" name="emergencyContactPhone" fullWidth margin="normal" value={form.emergencyContactPhone} onChange={handleChange} />
                            <TextField label="Emergency Contact Relationship" name="emergencyContactRelationship" fullWidth margin="normal" value={form.emergencyContactRelationship} onChange={handleChange} />
                            <TextField label="Medical History (comma separated)" name="medicalHistory" fullWidth margin="normal" value={form.medicalHistory} onChange={handleChange} />
                            <TextField label="Allergies (comma separated)" name="allergies" fullWidth margin="normal" value={form.allergies} onChange={handleChange} />
                          </Box>
                        </Fade>
                      )}
                      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                        <Button variant="outlined" color="primary" onClick={handleBack} sx={{ flex: 1, py: 1.3, fontWeight: 700, fontSize: '1.1rem', borderRadius: 3 }}>Back</Button>
                        <Button type="submit" variant="contained" color="primary" sx={{ flex: 1, py: 1.3, fontWeight: 700, fontSize: '1.1rem', borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(31, 38, 135, 0.10)', background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)', transition: 'all 0.2s', '&:hover': { background: 'linear-gradient(90deg, #1565c0 0%, #2193b0 100%)', transform: 'scale(1.03)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' } }}>Register</Button>
                      </Stack>
                    </>
                  )}
                </Box>
              </Grow>
            </form>
          </Card>
          {/* OTP Modal */}
          <Dialog open={otpModalOpen}>
            <DialogTitle>Email Verification</DialogTitle>
            <DialogContent>
              <TextField label="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} fullWidth margin="normal" />
              {otpError && <div style={{ color: 'red' }}>{otpError}</div>}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleVerifyOtp} disabled={verifyingOtp || !otp} variant="contained" color="primary">
                {verifyingOtp ? <CircularProgress size={20} /> : 'Verify'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Box>
  );
}
