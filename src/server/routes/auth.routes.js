import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  updatePassword,
  getUserActivities,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  initiateGoogleOAuth,
  googleOAuthCallback,
  unlinkGoogle,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  skipSuccessfulRequests: true, // Only count failed attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.', success: false }
});

router.route('/register').post(upload.single('avatar'), registerUser);
router.route('/login').post(loginLimiter, loginUser);
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/current-user').get(verifyJWT, getCurrentUser);

// Google OAuth
router.route('/google').get(initiateGoogleOAuth);
router.route('/google/callback').get(googleOAuthCallback);
router.route('/google/unlink').post(verifyJWT, unlinkGoogle);

// Password Recovery
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').post(resetPassword);

// Profile & Security & Sessions
router.route('/profile').put(verifyJWT, upload.single('avatar'), updateProfile);
router.route('/password').put(verifyJWT, updatePassword);
router.route('/activities').get(verifyJWT, getUserActivities);

router.route('/sessions').get(verifyJWT, getActiveSessions);
router.route('/sessions/other').delete(verifyJWT, revokeAllOtherSessions);
router.route('/sessions/:sessionId').delete(verifyJWT, revokeSession);

export default router;
