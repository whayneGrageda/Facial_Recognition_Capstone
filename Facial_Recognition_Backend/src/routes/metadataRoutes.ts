import { Router } from 'express';
import * as MetadataController from '../controllers/metadataController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes for dropdowns (read-only)
router.get('/all', MetadataController.getAllMetadata);
router.get('/courses', MetadataController.getCourses);
router.get('/years', MetadataController.getYears);
router.get('/strands', MetadataController.getStrands);
router.get('/shs-strands', MetadataController.getStrands); // Alias for frontend
router.get('/grades', MetadataController.getGrades);
router.get('/departments', MetadataController.getDepartments);
router.get('/faculty-departments', MetadataController.getDepartments); // Alias for frontend

// Protected routes for CRUD operations (admin only)
router.use(authenticateJWT);

// Courses CRUD
router.post('/courses', MetadataController.createCourse);
router.put('/courses/:id', MetadataController.updateCourse);
router.patch('/courses/:id/toggle', MetadataController.toggleCourseStatus);
router.delete('/courses/:id', MetadataController.deleteCourse);

// Strands CRUD
router.post('/strands', MetadataController.createStrand);
router.put('/strands/:id', MetadataController.updateStrand);
router.patch('/strands/:id/toggle', MetadataController.toggleStrandStatus);
router.delete('/strands/:id', MetadataController.deleteStrand);

// Departments CRUD
router.post('/departments', MetadataController.createDepartment);
router.put('/departments/:id', MetadataController.updateDepartment);
router.patch('/departments/:id/toggle', MetadataController.toggleDepartmentStatus);
router.delete('/departments/:id', MetadataController.deleteDepartment);

export default router;
