import { Router } from 'express';
import * as ModeratorController from '../controllers/moderatorController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Admin only for moderator management
router.get('/', authorizeRoles('admin'), ModeratorController.getModerators);
router.get('/archived', authorizeRoles('admin'), ModeratorController.getArchivedModerators);
router.get('/:id', authorizeRoles('admin'), ModeratorController.getModeratorById);
router.post('/', authorizeRoles('admin'), ModeratorController.createModerator);
router.put('/:id', authorizeRoles('admin'), ModeratorController.updateModerator);
router.delete('/:id', authorizeRoles('admin'), ModeratorController.deleteModerator);
router.delete('/:id/permanent', authorizeRoles('admin'), ModeratorController.permanentDeleteModerator);
router.patch('/:id/restore', authorizeRoles('admin'), ModeratorController.restoreModerator);
router.post('/bulk-archive', authorizeRoles('admin'), ModeratorController.bulkArchiveModerators);
router.post('/bulk-restore', authorizeRoles('admin'), ModeratorController.bulkRestoreModerators);
router.post('/bulk-delete', authorizeRoles('admin'), ModeratorController.bulkDeleteModerators);

export default router;
