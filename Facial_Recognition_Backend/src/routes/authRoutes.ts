import { Router } from 'express';
import * as AuthController from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/verify', AuthController.verifyToken);
router.post('/send-verification', AuthController.sendVerificationCode);
router.post('/verify-email', AuthController.verifyEmailCode);
router.post('/register/college', AuthController.registerCollegeUser);
router.post('/register/shs', AuthController.registerShsUser);
router.post('/register/faculty', AuthController.registerFacultyUser);

// Password reset routes
router.post('/request-password-reset', AuthController.requestPasswordReset);
router.post('/verify-password-reset', AuthController.verifyPasswordResetCode);
router.post('/update-password', AuthController.updatePassword);

// Protected routes
router.get('/profile', authenticateJWT, AuthController.getProfile);
router.post('/deactivate-account', authenticateJWT, AuthController.deactivateAccount);

// Public reactivation (user provides credentials to reactivate)
router.post('/reactivate-account', AuthController.reactivateAccount);

export default router;
