import { Request, Response } from 'express';
import { FaceImageService } from '../services/faceImageService.js';

/**
 * Upload face images for a user during registration
 */
export const uploadFaceImages = async (req: Request, res: Response) => {
  try {
    const { userId, images } = req.body;

    if (!userId || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User ID and images array are required'
      });
    }

    // Validate that we have a reasonable number of images (e.g., 20-50)
    if (images.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'At least 10 face images are required for training'
      });
    }

    if (images.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 face images allowed'
      });
    }

    await FaceImageService.saveFaceImages(userId, images);

    return res.status(200).json({
      success: true,
      message: `Successfully saved ${images.length} face images`,
      data: {
        userId,
        imageCount: images.length
      }
    });
  } catch (error) {
    console.error('Error uploading face images:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload face images'
    });
  }
};

/**
 * Delete face images for a user
 */
export const deleteFaceImages = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    await FaceImageService.deleteFaceImages(userId);

    return res.status(200).json({
      success: true,
      message: 'Successfully deleted face images'
    });
  } catch (error) {
    console.error('Error deleting face images:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete face images'
    });
  }
};

/**
 * Check if user has face images
 */
export const checkFaceImages = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const hasFaces = await FaceImageService.hasFaceImages(userId);
    const count = await FaceImageService.getFaceImageCount(userId);

    return res.status(200).json({
      success: true,
      data: {
        hasFaces,
        imageCount: count
      }
    });
  } catch (error) {
    console.error('Error checking face images:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check face images'
    });
  }
};
