import { Router, Request, Response, NextFunction } from 'express';
import * as SecurityAlertController from '../controllers/securityAlertController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Camera API key middleware for camera system authentication
const authenticateCameraKey = (req: Request, res: Response, next: NextFunction) => {
  const cameraKey = req.headers['x-camera-key'] as string;
  const expectedKey = process.env.CAMERA_API_KEY;

  if (!expectedKey) {
    console.warn('⚠️ CAMERA_API_KEY not configured — camera endpoint is rejecting all requests');
    return res.status(503).json({ status: 503, message: 'Camera authentication not configured' });
  }

  if (!cameraKey || cameraKey !== expectedKey) {
    return res.status(401).json({ status: 401, message: 'Invalid or missing camera API key' });
  }

  next();
};

// Camera endpoint - requires API key in X-Camera-Key header
router.post('/from-camera', authenticateCameraKey, SecurityAlertController.createAlert);

// All other routes require authentication and admin/moderator role
router.use(authenticateJWT);
router.use(authorizeRoles('admin', 'moderator'));

// Get all alerts with pagination and filters
router.get('/', SecurityAlertController.getAlerts);

// Get recent unresolved alerts (for dashboard)
router.get('/recent-unresolved', SecurityAlertController.getRecentUnresolved);

// Get alert statistics
router.get('/stats', SecurityAlertController.getStats);

// Get alert by ID
router.get('/:id', SecurityAlertController.getAlertById);

// Mark alert as resolved
router.patch('/:id/resolve', SecurityAlertController.resolveAlert);

// Delete alert (admin only)
router.delete('/:id', authorizeRoles('admin'), SecurityAlertController.deleteAlert);

export default router;
