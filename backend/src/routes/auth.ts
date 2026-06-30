import { sendOtp, verifyOtp, forgotPassword, resetPassword, uploadProfilePicture } from '../controllers/authController';
import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { otpRequestLimiter, otpVerifyLimiter, loginLimiter, registerLimiter } from '../middleware/otpRateLimiter';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  }
});

const router = Router();
// Forgot password routes
router.post('/forgot-password', otpRequestLimiter, forgotPassword);
router.post('/reset-password', otpVerifyLimiter, resetPassword);

// OTP routes
router.post('/send-otp', otpRequestLimiter, sendOtp);
router.post('/verify-otp', otpVerifyLimiter, verifyOtp);

// Public routes
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);

// Protected routes (require authentication)
router.get('/profile', authenticate, getProfile);
// Profile image upload
router.post(
  '/profile/upload-picture',
  authenticate,
  upload.single('profilePicture'),
  uploadProfilePicture
);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
