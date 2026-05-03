import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const rmdir = promisify(fs.rm);

const KNOWN_FACES_PATH = process.env.KNOWN_FACES_PATH || '../Facial_Recognition_Logic/known_faces';

export const FaceImageService = {
  /**
   * Save multiple face images for a user
   * @param userId - User identifier (student_id, employee_id, or username)
   * @param images - Array of base64 encoded images
   * @returns Promise<void>
   */
  saveFaceImages: async (userId: string, images: string[]): Promise<void> => {
    try {
      // Create user directory path
      const userDir = path.join(process.cwd(), KNOWN_FACES_PATH, userId);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(userDir)) {
        await mkdir(userDir, { recursive: true });
      }

      // Save each image
      const savePromises = images.map(async (imageData, index) => {
        // Remove data:image/jpeg;base64, prefix if present
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Format: frame_001.jpg, frame_002.jpg, etc.
        const filename = `frame_${String(index + 1).padStart(3, '0')}.jpg`;
        const filepath = path.join(userDir, filename);
        
        await writeFile(filepath, buffer);
      });

      await Promise.all(savePromises);
      console.log(`Saved ${images.length} face images for user: ${userId}`);
    } catch (error) {
      console.error('Error saving face images:', error);
      throw new Error('Failed to save face images');
    }
  },

  /**
   * Delete all face images for a user
   * @param userId - User identifier
   * @returns Promise<void>
   */
  deleteFaceImages: async (userId: string): Promise<void> => {
    try {
      const userDir = path.join(process.cwd(), KNOWN_FACES_PATH, userId);
      
      if (fs.existsSync(userDir)) {
        await rmdir(userDir, { recursive: true, force: true });
        console.log(`Deleted face images for user: ${userId}`);
      }
    } catch (error) {
      console.error('Error deleting face images:', error);
      throw new Error('Failed to delete face images');
    }
  },

  /**
   * Check if user has face images
   * @param userId - User identifier
   * @returns Promise<boolean>
   */
  hasFaceImages: async (userId: string): Promise<boolean> => {
    try {
      const userDir = path.join(process.cwd(), KNOWN_FACES_PATH, userId);
      return fs.existsSync(userDir);
    } catch (error) {
      console.error('Error checking face images:', error);
      return false;
    }
  },

  /**
   * Get the count of face images for a user
   * @param userId - User identifier
   * @returns Promise<number>
   */
  getFaceImageCount: async (userId: string): Promise<number> => {
    try {
      const userDir = path.join(process.cwd(), KNOWN_FACES_PATH, userId);
      
      if (!fs.existsSync(userDir)) {
        return 0;
      }

      const files = fs.readdirSync(userDir);
      return files.filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg')).length;
    } catch (error) {
      console.error('Error getting face image count:', error);
      return 0;
    }
  }
};
