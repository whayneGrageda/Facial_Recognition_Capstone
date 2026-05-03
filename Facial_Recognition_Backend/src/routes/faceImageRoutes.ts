import express from 'express';
import { uploadFaceImages, deleteFaceImages, checkFaceImages } from '../controllers/faceImageController.js';

const router = express.Router();

// Upload face images during registration
router.post('/upload', uploadFaceImages);

// Delete face images for a user
router.delete('/:userId', deleteFaceImages);

// Check if user has face images
router.get('/:userId/check', checkFaceImages);

export default router;
