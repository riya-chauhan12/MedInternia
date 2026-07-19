import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Otp from "../models/Otp";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { OAuth2Client } from "google-auth-library";
import { generateToken, generateRefreshToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const sendTokenCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax",
  });
};

// ==========================================
// REGISTER
// ==========================================
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName, userType, verificationToken } = req.body;

  let verifiedEmail = email;
  if (verificationToken) {
    const decoded: any = jwt.verify(verificationToken, JWT_SECRET);
    if (!decoded?.email || decoded.purpose !== "signup") {
      throw new AppError("Invalid or expired verification token", 400);
    }
    verifiedEmail = decoded.email;
  }

  const existingUser = await User.findOne({ email: verifiedEmail });
  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  const user = new User({
    email: verifiedEmail,
    password,
    firstName,
    lastName,
    userType: userType || "patient",
    isVerified: true,
  });
  await user.save();

  const token = generateToken({
    userId: String(user._id),
    email: user.email,
    userType: user.userType,
  });
  const refreshToken = generateRefreshToken({
    userId: String(user._id),
    email: user.email,
    userType: user.userType,
  });
  sendTokenCookie(res, token);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  const userData = typeof (user as any).toObject === "function" ? (user as any).toObject() : user;

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: { user: userData },
  });
});

// ==========================================
// LOGIN
// ==========================================
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if ((user as any).lockoutUntil && new Date((user as any).lockoutUntil) > new Date()) {
    throw new AppError("Account is locked. Please try again later.", 423);
  }

  const isMatch = await (user as any).comparePassword(password);
  if (!isMatch) {
    const newAttempts = ((user as any).loginAttempts || 0) + 1;
    const update: any = { $inc: { loginAttempts: 1 } };
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      update.$set = { lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) };
    }
    await User.findByIdAndUpdate((user as any)._id, update);
    throw new AppError("Invalid email or password", 401);
  }

  await User.findByIdAndUpdate((user as any)._id, {
    $set: { loginAttempts: 0, lockoutUntil: null },
  });

  const token = generateToken({
    userId: String((user as any)._id),
    email: (user as any).email,
    userType: (user as any).userType,
  });
  sendTokenCookie(res, token);

  const userData = typeof (user as any).toObject === "function" ? (user as any).toObject() : user;

  res.json({
    success: true,
    message: "Logged in successfully",
    data: { user: userData },
  });
});

// ==========================================
// LOGOUT
// ==========================================
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.cookie("token", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.json({ success: true, message: "Logged out successfully" });
});

// ==========================================
// GOOGLE OAUTH / SIGN-IN
// ==========================================
export const googleLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { idToken } = req.body;
  if (!idToken) {
    throw new AppError("Google ID Token is required", 400);
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError("Invalid Google token payload", 400);
  }

  let user = await User.findOne({ email: payload.email });
  if (!user) {
    user = await User.create({
      email: payload.email,
      firstName: payload.given_name || "GoogleUser",
      lastName: payload.family_name || "",
      avatar: payload.picture,
      isVerified: true,
      googleId: payload.sub,
      userType: "patient",
    });
  }

  const token = generateToken({
    userId: String(user._id),
    email: user.email,
    userType: user.userType,
  });
  sendTokenCookie(res, token);

  res.json({
    success: true,
    message: "Google authentication successful",
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
    },
  });
});

// ==========================================
// OTP / PASSWORD FLOWS
// ==========================================

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw new AppError("Email is required", 400);
  res.json({ success: true, message: "OTP sent successfully" });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, purpose } = req.body;
  if (!email || !otp) throw new AppError("Email and OTP are required", 400);

  const otpRecord = await Otp.findOne({ email, purpose: purpose || "signup" });
  if (!otpRecord || (otpRecord.expiresAt && new Date(otpRecord.expiresAt) < new Date())) {
    throw new AppError("OTP not found", 400);
  }

  const isValid = await bcrypt.compare(otp, (otpRecord as any).otpHash);
  if (!isValid) {
    (otpRecord as any).attempts = ((otpRecord as any).attempts || 0) + 1;
    await (otpRecord as any).save();
    throw new AppError("Invalid OTP", 400);
  }

  res.json({ success: true, message: "OTP verified successfully" });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw new AppError("Email is required", 400);

  const user = await User.findOne({ email });
  if (!user) throw new AppError("No user found with that email", 404);

  res.json({ success: true, message: "Reset link sent" });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    throw new AppError("Email, OTP, and new password are required", 400);
  }

  const otpRecord = await Otp.findOne({ email, purpose: "reset" });
  if (!otpRecord || (otpRecord.expiresAt && new Date(otpRecord.expiresAt) < new Date())) {
    throw new AppError("OTP not found", 400);
  }

  const isValid = await bcrypt.compare(otp, (otpRecord as any).otpHash);
  if (!isValid) {
    (otpRecord as any).attempts = ((otpRecord as any).attempts || 0) + 1;
    await (otpRecord as any).save();
    throw new AppError("Invalid OTP", 400);
  }

  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  (user as any).password = newPassword;
  await (user as any).save();

  await Otp.deleteOne({ _id: (otpRecord as any)._id });

  res.json({ success: true, message: "Password reset completed" });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const authUser = req.user;
  if (!authUser) throw new AppError("User not authenticated", 401);

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError("Both fields are required", 400);
  }

  const user = await User.findById(authUser._id).select("+password");
  if (!user) throw new AppError("User not found", 404);

  const isMatch = await (user as any).comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 401);
  }

  (user as any).password = newPassword;
  await (user as any).save();

  res.json({ success: true, message: "Password updated successfully" });
});