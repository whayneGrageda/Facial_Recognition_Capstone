import { Router } from 'express';
import * as FacultyUserController from '../controllers/facultyUserController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Admin and moderator only
router.get('/', authorizeRoles('admin', 'moderator'), FacultyUserController.getFacultyUsers);
router.get('/archived', authorizeRoles('admin', 'moderator'), FacultyUserController.getArchivedFacultyUsers);
router.get('/search', authorizeRoles('admin', 'moderator'), FacultyUserController.searchFacultyUsers);
router.get('/:id', authorizeRoles('admin', 'moderator'), FacultyUserController.getFacultyUserById);
router.post('/', authorizeRoles('admin', 'moderator'), FacultyUserController.createFacultyUser);
router.put('/:id', authorizeRoles('admin', 'moderator'), FacultyUserController.updateFacultyUser);
router.delete('/:id', authorizeRoles('admin'), FacultyUserController.deleteFacultyUser);
router.delete('/:id/permanent', authorizeRoles('admin'), FacultyUserController.permanentDeleteFacultyUser);
router.patch('/:id/restore', authorizeRoles('admin', 'moderator'), FacultyUserController.restoreFacultyUser);
router.post('/bulk-archive', authorizeRoles('admin'), FacultyUserController.bulkArchiveFacultyUsers);
router.post('/bulk-restore', authorizeRoles('admin', 'moderator'), FacultyUserController.bulkRestoreFacultyUsers);
router.post('/bulk-delete', authorizeRoles('admin'), FacultyUserController.bulkDeleteFacultyUsers);

export default router;
