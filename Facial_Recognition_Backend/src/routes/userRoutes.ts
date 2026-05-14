import { Router } from 'express';
import * as UserController from '../controllers/userController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Admin and moderator only
router.get('/', authorizeRoles('admin', 'moderator'), UserController.getUsers);
router.get('/export', authorizeRoles('admin', 'moderator'), UserController.exportToCSV);
router.get('/archived', authorizeRoles('admin', 'moderator'), UserController.getArchivedUsers);
router.get('/search', authorizeRoles('admin', 'moderator'), UserController.searchUsers);
router.get('/:id', authorizeRoles('admin', 'moderator'), UserController.getUserById);
router.post('/', authorizeRoles('admin', 'moderator'), UserController.createUser);
router.put('/:id', authorizeRoles('admin', 'moderator'), UserController.updateUser);
router.delete('/:id', authorizeRoles('admin'), UserController.deleteUser);
router.delete('/:id/permanent', authorizeRoles('admin'), UserController.permanentDeleteUser);
router.patch('/:id/restore', authorizeRoles('admin', 'moderator'), UserController.restoreUser);
router.patch('/:id/deactivate', authorizeRoles('admin', 'moderator'), UserController.deactivateUser);
router.patch('/:id/reactivate', authorizeRoles('admin', 'moderator'), UserController.reactivateUser);
router.post('/bulk-archive', authorizeRoles('admin'), UserController.bulkArchiveUsers);
router.post('/bulk-restore', authorizeRoles('admin', 'moderator'), UserController.bulkRestoreUsers);
router.post('/bulk-delete', authorizeRoles('admin'), UserController.bulkDeleteUsers);

export default router;
