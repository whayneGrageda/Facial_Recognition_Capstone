import { Router } from 'express';
import * as MetadataController from '../controllers/metadataController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Metadata is public for dropdowns
// router.use(authenticateJWT);

router.get('/all', MetadataController.getAllMetadata);
router.get('/courses', MetadataController.getCourses);
router.get('/years', MetadataController.getYears);
router.get('/strands', MetadataController.getStrands);
router.get('/shs-strands', MetadataController.getStrands); // Alias for frontend
router.get('/grades', MetadataController.getGrades);
router.get('/departments', MetadataController.getDepartments);
router.get('/faculty-departments', MetadataController.getDepartments); // Alias for frontend

export default router;
