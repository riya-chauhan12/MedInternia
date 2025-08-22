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
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/profiles'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const router = Router();
// Forgot password routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// OTP routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/profile', authenticate, getProfile);
// Profile image upload
router.post('/profile/upload-picture', authenticate, upload.single('profilePicture'), uploadProfilePicture);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
