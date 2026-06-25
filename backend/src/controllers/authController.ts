import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import Otp from '../models/Otp';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { uploadProfileImage } from '../utils/cloudinary';
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

// --- OTP configuration -----------------------------------------------------
const OTP_TTL_MS = 10 * 60 * 1000; // OTP valid for 10 minutes
const OTP_MAX_ATTEMPTS = 5; // after 5 wrong tries the OTP is invalidated

const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const issueOtp = async (email: string, purpose: 'signup' | 'reset') => {
  const otp = generateOtpCode();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await Otp.findOneAndUpdate(
    { email, purpose },
    { otpHash, expiresAt, attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return otp;
};

const consumeOtp = async (
  email: string,
  purpose: 'signup' | 'reset',
  submittedOtp: string
): Promise<{ valid: boolean; message?: string }> => {
  const record = await Otp.findOne({ email, purpose });

  if (!record) {
    return { valid: false, message: 'OTP not found or already used. Please request a new one.' };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(submittedOtp, record.otpHash);

  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    return { valid: false, message: 'Invalid OTP' };
  }

  await Otp.deleteOne({ _id: record._id });
  return { valid: true };
};

// Upload profile picture
export const uploadProfilePicture = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const uploadResult = await uploadProfileImage(
      req.file,
      String(req.user._id),
    );

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: uploadResult.secure_url },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      data: {
        user: updatedUser,
        profilePicture: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        },
      },
    });
  },
);

// Register a new user (patient or doctor)
export const register = asyncHandler(async (req: Request, res: Response) => {
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
    allergies,
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  // Validate required fields based on user type
  if (userType === "doctor") {
    if (!specialization || !licenseNumber) {
      throw new AppError(
        "Specialization and license number are required for doctors",
        400,
      );
    }

    // Check if license number already exists
    const existingLicense = await User.findOne({ licenseNumber });
    if (existingLicense) {
      throw new AppError("Doctor with this license number already exists", 400);
    }
  }

  if (userType === "intern") {
    if (!medicalSchool || !yearOfStudy) {
      throw new AppError(
        "Medical school and year of study are required for interns",
        400,
      );
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
    address,
  };

  // Add doctor-specific fields
  if (userType === "doctor") {
    userData.specialization = specialization;
    userData.licenseNumber = licenseNumber;
    userData.experience = experience;
    userData.qualifications = qualifications;
  }

  // Add intern-specific fields
  if (userType === "intern") {
    userData.medicalSchool = medicalSchool;
    userData.yearOfStudy = yearOfStudy;
    userData.interests = interests;
    userData.mentorDoctor = mentorDoctor;
  }

  // Add patient-specific fields
  if (userType === "patient") {
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
    userType: user.userType,
  });

  // Remove password from response
  const userResponse = user.toObject() as any;
  delete userResponse.password;

  // If the user is an intern, create notifications for all future webinars
  if (user.userType === "intern") {
    const Webinar = require("../models/Webinar").default;
    const Notification = require("../models/Notification").default;
    // Find all webinars (past and future)
    const webinars = await Webinar.find({});
    const notifications = [];
    for (const webinar of webinars) {
      // Populate host for message
      await webinar.populate("host", "firstName lastName");
      const host = webinar.host as any;
      notifications.push({
        recipient: user._id,
        message: `New webinar scheduled: ${webinar.title} by Dr. ${host.firstName} ${host.lastName}`,
        type: "webinar",
        link: webinar.meetingLink,
      });
    }
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  }

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: userResponse,
      token,
    },
  });
});

export const sendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });
  const otp = await issueOtp(email, 'signup');
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
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('Send OTP email error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new AppError('Email and OTP required', 400);
  }

  const result = await consumeOtp(email, 'signup', otp);
  if (!result.valid) {
    throw new AppError(result.message || 'Invalid OTP', 400);
  }
  res.json({ success: true });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError("Account is deactivated. Please contact support.", 401);
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // Generate JWT token
  const token = generateToken({
    userId: (user._id as any).toString(),
    email: user.email,
    userType: user.userType,
  });

  // Remove password from response
  const userResponse = user.toObject() as any;
  delete userResponse.password;

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: userResponse,
      token,
    },
  });
});

// Get current user profile
export const getProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  },
);

// Update user profile
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const updates = req.body;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    // Remove sensitive fields that shouldn't be updated this way
    delete updates.password;
    delete updates.email;
    delete updates.userType;
    delete updates.isActive;
    delete updates.isVerified;

    const updatedUser = await User.findByIdAndUpdate(user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  },
);

// Change password
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    if (!currentPassword || !newPassword) {
      throw new AppError("Current password and new password are required", 400);
    }

    if (newPassword.length < 6) {
      throw new AppError(
        "New password must be at least 6 characters long",
        400,
      );
    }

    // Get user with password
    const userWithPassword = await User.findById(user._id).select("+password");

    if (!userWithPassword) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isCurrentPasswordValid =
      await userWithPassword.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      throw new AppError("Current password is incorrect", 400);
    }

    // Update password
    userWithPassword.password = newPassword;
    await userWithPassword.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  },
);

// Forgot Password: Send OTP
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      throw new AppError("Email required", 400);
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    // Generate OTP
    const otp = await issueOtp(email, 'reset');

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.ethereal.email",
      port: Number(process.env.EMAIL_PORT) || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "MedInternia Password Reset OTP",
        text: `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`,
      });
    } catch (err) {
      throw new AppError("Failed to send OTP", 500);
    }

    res.json({ success: true });
  },
);

// Reset Password
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      throw new AppError("All fields required", 400);
    }
    if (newPassword.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }
    const result = await consumeOtp(email, 'reset', otp);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = newPassword;
    await user.save();
    return res.json({ success: true, message: 'Password reset successfully' });
  },
);
