import { Router } from 'express';
import * as AttendanceController from '../controllers/attendanceController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Record attendance (all authenticated users)
router.post('/', AttendanceController.recordAttendance);

// User-specific routes (students and faculty can view their own data)
router.get('/user/:userId/stats', AttendanceController.getUserStats);
router.get('/user/:userId', AttendanceController.getUserAttendanceHistory);

// View attendance (admin and moderator only)
router.get('/', AttendanceController.getAttendance);
router.get('/today', authorizeRoles('admin', 'moderator'), AttendanceController.getTodayAttendance);
router.get('/stats', authorizeRoles('admin', 'moderator'), AttendanceController.getAttendanceStats);
router.get('/report', authorizeRoles('admin', 'moderator'), AttendanceController.downloadReports);
router.get('/date-range', authorizeRoles('admin', 'moderator'), AttendanceController.getAttendanceByDateRange);
router.get('/analytics/monthly', authorizeRoles('admin', 'moderator'), AttendanceController.getMonthlyTrends);
router.get('/analytics/daily', authorizeRoles('admin', 'moderator'), AttendanceController.getDailyTrends);
router.get('/analytics/peak-hours', authorizeRoles('admin', 'moderator'), AttendanceController.getPeakHours);
router.get('/analytics/department', authorizeRoles('admin', 'moderator'), AttendanceController.getDepartmentDistribution);
router.get('/analytics/weekly', authorizeRoles('admin', 'moderator'), AttendanceController.getWeeklyPerformance);
router.get('/:id', authorizeRoles('admin', 'moderator'), AttendanceController.getAttendanceById);

export default router;
