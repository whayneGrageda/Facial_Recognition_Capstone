import { Router } from 'express';
import * as ShsUserController from '../controllers/shsUserController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Admin and moderator only
router.get('/', authorizeRoles('admin', 'moderator'), ShsUserController.getShsUsers);
router.get('/archived', authorizeRoles('admin', 'moderator'), ShsUserController.getArchivedShsUsers);
router.get('/search', authorizeRoles('admin', 'moderator'), ShsUserController.searchShsUsers);
router.get('/:id', authorizeRoles('admin', 'moderator'), ShsUserController.getShsUserById);
router.post('/', authorizeRoles('admin', 'moderator'), ShsUserController.createShsUser);
router.put('/:id', authorizeRoles('admin', 'moderator'), ShsUserController.updateShsUser);
router.delete('/:id', authorizeRoles('admin'), ShsUserController.deleteShsUser);
router.delete('/:id/permanent', authorizeRoles('admin'), ShsUserController.permanentDeleteShsUser);
router.patch('/:id/restore', authorizeRoles('admin', 'moderator'), ShsUserController.restoreShsUser);
router.post('/bulk-archive', authorizeRoles('admin'), ShsUserController.bulkArchiveShsUsers);
router.post('/bulk-restore', authorizeRoles('admin', 'moderator'), ShsUserController.bulkRestoreShsUsers);
router.post('/bulk-delete', authorizeRoles('admin'), ShsUserController.bulkDeleteShsUsers);

export default router;
