import { apiService } from './api';

export const faceImageService = {
  /**
   * Upload face images for a user
   */
  uploadFaceImages: async (userId: string, images: string[]) => {
    return await apiService.post('/face-images/upload', {
      userId,
      images
    });
  },

  /**
   * Delete face images for a user
   */
  deleteFaceImages: async (userId: string) => {
    return await apiService.delete(`/face-images/${userId}`);
  },

  /**
   * Check if user has face images
   */
  checkFaceImages: async (userId: string) => {
    return await apiService.get(`/face-images/${userId}/check`);
  }
};
