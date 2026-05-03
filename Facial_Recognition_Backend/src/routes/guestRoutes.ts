import { Router } from 'express';
import * as GuestController from '../controllers/guestController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Admin and moderator only
router.get('/', authorizeRoles('admin', 'moderator'), GuestController.getGuests);
router.get('/archived', authorizeRoles('admin', 'moderator'), GuestController.getArchivedGuests);
router.get('/today', authorizeRoles('admin', 'moderator'), GuestController.getTodayGuests);
router.get('/search', authorizeRoles('admin', 'moderator'), GuestController.searchGuests);
router.get('/:id', authorizeRoles('admin', 'moderator'), GuestController.getGuestById);
router.post('/', authorizeRoles('admin', 'moderator'), GuestController.createGuest);
router.put('/:id', authorizeRoles('admin', 'moderator'), GuestController.updateGuest);
router.delete('/:id', authorizeRoles('admin'), GuestController.deleteGuest);
router.delete('/:id/permanent', authorizeRoles('admin'), GuestController.permanentDeleteGuest);
router.patch('/:id/restore', authorizeRoles('admin', 'moderator'), GuestController.restoreGuest);
router.post('/bulk-archive', authorizeRoles('admin'), GuestController.bulkArchiveGuests);
router.post('/bulk-restore', authorizeRoles('admin', 'moderator'), GuestController.bulkRestoreGuests);
router.post('/bulk-delete', authorizeRoles('admin'), GuestController.bulkDeleteGuests);

export default router;
