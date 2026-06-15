import nodemailer from 'nodemailer';
const otpStore: Record<string, string> = {};
import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { uploadProfileImage } from '../utils/cloudinary';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

// Upload profile picture
export const uploadProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const uploadResult = await uploadProfileImage(req.file, String(req.user._id));

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: uploadResult.secure_url },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        user: updatedUser,
        profilePicture: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        }
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

// Register a new user (patient or doctor)
export const register = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      userType,
      phone,
      dateOfBirth,
      gender,
      address,
      // Doctor specific
      specialization,
      licenseNumber,
      experience,
      qualifications,
      // Intern specific
      medicalSchool,
      yearOfStudy,
      interests,
      mentorDoctor,
      // Patient specific
      emergencyContact,
      medicalHistory,
      allergies
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate required fields based on user type
    if (userType === 'doctor') {
      if (!specialization || !licenseNumber) {
        return res.status(400).json({
          success: false,
          message: 'Specialization and license number are required for doctors'
        });
      }

      // Check if license number already exists
      const existingLicense = await User.findOne({ licenseNumber });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: 'Doctor with this license number already exists'
        });
      }
    }

    if (userType === 'intern') {
      if (!medicalSchool || !yearOfStudy) {
        return res.status(400).json({
          success: false,
          message: 'Medical school and year of study are required for interns'
        });
      }
    }

    // Create user object
    const userData: Partial<IUser> = {
      firstName,
      lastName,
      email,
      password,
      userType,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      address
    };

    // Add doctor-specific fields
    if (userType === 'doctor') {
      userData.specialization = specialization;
      userData.licenseNumber = licenseNumber;
      userData.experience = experience;
      userData.qualifications = qualifications;
    }

    // Add intern-specific fields
    if (userType === 'intern') {
      userData.medicalSchool = medicalSchool;
      userData.yearOfStudy = yearOfStudy;
      userData.interests = interests;
      userData.mentorDoctor = mentorDoctor;
    }

    // Add patient-specific fields
    if (userType === 'patient') {
      userData.emergencyContact = emergencyContact;
      userData.medicalHistory = medicalHistory;
      userData.allergies = allergies;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: (user._id as any).toString(),
      email: user.email,
      userType: user.userType
    });

    // Remove password from response
    const userResponse = user.toObject() as any;
    delete userResponse.password;
    // If the user is an intern, create notifications for all future webinars
    if (user.userType === 'intern') {
      const Webinar = require('../models/Webinar').default;
      const Notification = require('../models/Notification').default;
  // Find all webinars (past and future)
  const webinars = await Webinar.find({});
      const notifications = [];
      for (const webinar of webinars) {
        // Populate host for message
        await webinar.populate('host', 'firstName lastName');
        const host = webinar.host as any;
        notifications.push({
          recipient: user._id,
          message: `New webinar scheduled: ${webinar.title} by Dr. ${host.firstName} ${host.lastName}`,
          type: 'webinar',
          link: webinar.meetingLink
        });
      }
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;
  // Send OTP via email (simple nodemailer example)
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: Number(process.env.EMAIL_PORT) || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'MedInternia Email Verification OTP',
      text: `Your OTP is: ${otp}`
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const verifyOtp = (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });
  if (otpStore[email] === otp) {
    delete otpStore[email];
    return res.json({ success: true });
  }
  return res.json({ success: false, message: 'Invalid OTP' });
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: (user._id as any).toString(),
      email: user.email,
      userType: user.userType
    });

    // Remove password from response
    const userResponse = user.toObject() as any;
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const updates = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Remove sensitive fields that shouldn't be updated this way
    delete updates.password;
    delete updates.email;
    delete updates.userType;
    delete updates.isActive;
    delete updates.isVerified;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const userWithPassword = await User.findById(user._id).select('+password');
    
    if (!userWithPassword) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    userWithPassword.password = newPassword;
    await userWithPassword.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Forgot Password: Send OTP
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email + '_reset'] = otp;
  // Send OTP via email
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: Number(process.env.EMAIL_PORT) || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'MedInternia Password Reset OTP',
      text: `Your password reset OTP is: ${otp}`
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'All fields required' });
  if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  if (otpStore[email + '_reset'] !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.password = newPassword;
  await user.save();
  delete otpStore[email + '_reset'];
  return res.json({ success: true, message: 'Password reset successfully' });
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { credential, registerIfNotFound = true, userType = 'patient', ...otherFields } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential (ID token) is required'
      });
    }

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token payload'
      });
    }

    const { sub: googleId, email, email_verified, given_name: firstName, family_name: lastName, picture: profilePicture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account does not provide an email'
      });
    }

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Google email is not verified'
      });
    }

    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }]
    });

    if (user) {
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (!user.profilePicture && profilePicture) {
        user.profilePicture = profilePicture;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      const token = generateToken({
        userId: (user._id as any).toString(),
        email: user.email,
        userType: user.userType
      });

      const userResponse = user.toObject() as any;
      delete userResponse.password;
      userResponse.role = user.userType;

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });
    }

    if (!registerIfNotFound) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'No user account found. Please complete registration.',
        data: {
          email,
          firstName,
          lastName,
          profilePicture
        }
      });
    }

    const validUserTypes = ['patient', 'doctor', 'intern'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    if (userType === 'doctor') {
      const { specialization, licenseNumber } = otherFields;
      if (!specialization || !licenseNumber) {
        return res.status(400).json({
          success: false,
          message: 'Specialization and license number are required for doctors'
        });
      }
      const existingLicense = await User.findOne({ licenseNumber });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: 'Doctor with this license number already exists'
        });
      }
    }

    if (userType === 'intern') {
      const { medicalSchool, yearOfStudy } = otherFields;
      if (!medicalSchool || !yearOfStudy) {
        return res.status(400).json({
          success: false,
          message: 'Medical school and year of study are required for interns'
        });
      }
    }

    const randomPassword = crypto.randomBytes(16).toString('hex');

    const userData: Partial<IUser> = {
      googleId,
      firstName: firstName || 'GoogleUser',
      lastName: lastName || 'User',
      email: email.toLowerCase(),
      password: randomPassword,
      userType: userType as any,
      profilePicture,
      isVerified: true,
      isActive: true,
      phone: otherFields.phone,
      dateOfBirth: otherFields.dateOfBirth ? new Date(otherFields.dateOfBirth) : undefined,
      gender: otherFields.gender,
    };

    if (userType === 'doctor') {
      userData.specialization = otherFields.specialization;
      userData.licenseNumber = otherFields.licenseNumber;
      userData.experience = otherFields.experience;
      userData.qualifications = otherFields.qualifications ? otherFields.qualifications.split(',').map((q: string) => q.trim()).filter(Boolean) : [];
    }

    if (userType === 'intern') {
      userData.medicalSchool = otherFields.medicalSchool;
      userData.yearOfStudy = otherFields.yearOfStudy;
      userData.interests = otherFields.interests ? otherFields.interests.split(',').map((i: string) => i.trim()).filter(Boolean) : [];
      userData.mentorDoctor = otherFields.mentorDoctor;
    }

    if (userType === 'patient') {
      userData.emergencyContact = {
        name: otherFields.emergencyContactName,
        phone: otherFields.emergencyContactPhone,
        relationship: otherFields.emergencyContactRelationship
      };
      userData.medicalHistory = otherFields.medicalHistory ? otherFields.medicalHistory.split(',').map((h: string) => h.trim()).filter(Boolean) : [];
      userData.allergies = otherFields.allergies ? otherFields.allergies.split(',').map((a: string) => a.trim()).filter(Boolean) : [];
    }

    const newUser = new User(userData);
    await newUser.save();

    if (newUser.userType === 'intern') {
      try {
        const Webinar = require('../models/Webinar').default;
        const Notification = require('../models/Notification').default;
        const webinars = await Webinar.find({});
        const notifications = [];
        for (const webinar of webinars) {
          await webinar.populate('host', 'firstName lastName');
          const host = webinar.host as any;
          notifications.push({
            recipient: newUser._id,
            message: `New webinar scheduled: ${webinar.title} by Dr. ${host.firstName} ${host.lastName}`,
            type: 'webinar',
            link: webinar.meetingLink
          });
        }
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      } catch (err) {
        console.error('Error creating notifications:', err);
      }
    }

    const token = generateToken({
      userId: (newUser._id as any).toString(),
      email: newUser.email,
      userType: newUser.userType
    });

    const userResponse = newUser.toObject() as any;
    delete userResponse.password;
    userResponse.role = newUser.userType;

    res.status(201).json({
      success: true,
      message: 'User registered and logged in successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
