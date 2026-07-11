import { sendOtp, verifyOtp, forgotPassword, resetPassword, uploadProfilePicture, logout } from '../controllers/authController';
import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  syncOrcidPublications
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { otpRequestLimiter, otpVerifyLimiter, loginLimiter, registerLimiter } from '../middleware/otpRateLimiter';
import multer from 'multer';
import { isAllowedUpload } from '../utils/uploadValidation';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    // Allowlist-based check (not just startsWith('image/')): that check
    // let image/svg+xml through, which enables stored XSS via <script>
    // tags embedded in an uploaded SVG (issue #409).
    if (!isAllowedUpload(file.originalname, file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WEBP, and GIF image files are allowed'));
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
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
// Profile image upload
router.post(
  '/profile/upload-picture',
  authenticate,
  upload.single('profilePicture'),
  uploadProfilePicture
);
router.put('/profile', authenticate, updateProfile);
router.post('/profile/orcid/sync', authenticate, syncOrcidPublications);
router.put('/change-password', authenticate, changePassword);
router.get('/validate-token', authenticate, (req, res) => {
  res.json({ valid: true, user: (req as any).user });
});

export default router;
