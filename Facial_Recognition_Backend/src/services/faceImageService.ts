import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const rmdir = promisify(fs.rm);

const KNOWN_FACES_BASE = process.env.KNOWN_FACES_PATH || '../Facial_Recognition_Logic/known_faces';

// Subfolders for active/inactive recognition
const ACTIVE_DIR = 'is_active';
const INACTIVE_DIR = 'is_inactive';

function getActiveDir(): string {
  return path.join(process.cwd(), KNOWN_FACES_BASE, ACTIVE_DIR);
}

function getInactiveDir(): string {
  return path.join(process.cwd(), KNOWN_FACES_BASE, INACTIVE_DIR);
}

function getUserDir(userId: string, subfolder: 'is_active' | 'is_inactive'): string {
  const base = subfolder === 'is_active' ? getActiveDir() : getInactiveDir();
  return path.join(base, userId);
}

/**
 * Find which subfolder a user's face images currently live in.
 * Returns 'is_active', 'is_inactive', or null if not found.
 */
function findUserFolder(userId: string): 'is_active' | 'is_inactive' | null {
  if (fs.existsSync(getUserDir(userId, 'is_active'))) return 'is_active';
  if (fs.existsSync(getUserDir(userId, 'is_inactive'))) return 'is_inactive';
  return null;
}

export const FaceImageService = {
  /**
   * Save face images for a user into is_active/ (new enrollments are always active)
   */
  saveFaceImages: async (userId: string, images: string[]): Promise<void> => {
    try {
      const userDir = getUserDir(userId, 'is_active');

      if (!fs.existsSync(userDir)) {
        await mkdir(userDir, { recursive: true });
      }

      const savePromises = images.map(async (imageData, index) => {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `frame_${String(index + 1).padStart(3, '0')}.jpg`;
        const filepath = path.join(userDir, filename);
        await writeFile(filepath, buffer);
      });

      await Promise.all(savePromises);
      console.log(`[FaceImageService] Saved ${images.length} images for: ${userId} → is_active/`);
    } catch (error) {
      console.error('[FaceImageService] Error saving face images:', error);
      throw new Error('Failed to save face images');
    }
  },

  /**
   * Move face images between is_active/ and is_inactive/.
   * Used when deactivating or reactivating a user.
   */
  moveFaceImages: async (
    userId: string,
    from: 'is_active' | 'is_inactive',
    to: 'is_active' | 'is_inactive'
  ): Promise<void> => {
    try {
      const srcDir = getUserDir(userId, from);
      const dstDir = getUserDir(userId, to);

      if (!fs.existsSync(srcDir)) {
        console.warn(`[FaceImageService] Source folder not found for ${userId} in ${from}/`);
        return;
      }

      // Ensure destination parent exists
      await mkdir(path.dirname(dstDir), { recursive: true });

      // fs.rename works across same filesystem; use copy+delete for safety
      if (!fs.existsSync(dstDir)) {
        await mkdir(dstDir, { recursive: true });
      }

      const files = fs.readdirSync(srcDir);
      for (const file of files) {
        const src = path.join(srcDir, file);
        const dst = path.join(dstDir, file);
        fs.copyFileSync(src, dst);
      }

      // Remove source after successful copy
      await rmdir(srcDir, { recursive: true, force: true });

      console.log(`[FaceImageService] Moved ${userId}: ${from}/ → ${to}/`);
    } catch (error) {
      console.error(`[FaceImageService] Error moving face images for ${userId}:`, error);
      throw new Error('Failed to move face images');
    }
  },

  /**
   * Delete face images permanently (used for permanent delete only).
   * Checks both subfolders.
   */
  deleteFaceImages: async (userId: string): Promise<void> => {
    try {
      for (const subfolder of ['is_active', 'is_inactive'] as const) {
        const userDir = getUserDir(userId, subfolder);
        if (fs.existsSync(userDir)) {
          await rmdir(userDir, { recursive: true, force: true });
          console.log(`[FaceImageService] Deleted ${userId} from ${subfolder}/`);
        }
      }
    } catch (error) {
      console.error('[FaceImageService] Error deleting face images:', error);
      throw new Error('Failed to delete face images');
    }
  },

  /**
   * Move to is_inactive/ when archiving (preserves images for restore).
   */
  archiveFaceImages: async (userId: string): Promise<void> => {
    const current = findUserFolder(userId);
    if (current === 'is_active') {
      await FaceImageService.moveFaceImages(userId, 'is_active', 'is_inactive');
    }
    // Already inactive or not found — nothing to do
  },

  /**
   * Move back to is_active/ when restoring from archive.
   */
  restoreFaceImages: async (userId: string): Promise<void> => {
    const current = findUserFolder(userId);
    if (current === 'is_inactive') {
      await FaceImageService.moveFaceImages(userId, 'is_inactive', 'is_active');
    }
  },

  /**
   * Check if user has face images in either folder.
   */
  hasFaceImages: async (userId: string): Promise<boolean> => {
    return findUserFolder(userId) !== null;
  },

  /**
   * Get count of face images for a user (checks both folders).
   */
  getFaceImageCount: async (userId: string): Promise<number> => {
    try {
      const subfolder = findUserFolder(userId);
      if (!subfolder) return 0;
      const userDir = getUserDir(userId, subfolder);
      const files = fs.readdirSync(userDir);
      return files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg')).length;
    } catch {
      return 0;
    }
  },

  /**
   * Returns which subfolder the user is currently in.
   */
  getUserFaceFolder: (userId: string): 'is_active' | 'is_inactive' | null => {
    return findUserFolder(userId);
  },
};
