import bcrypt from 'bcryptjs';
import { UserModel } from '../models/userModel.js';
import { CreateUserRequest, UpdateUserRequest } from '../types/userEntity.js';
import { FaceImageService } from './faceImageService.js';
import { SeedGeneratorService } from './seedGeneratorService.js';

export const UserService = {
  getUsers: async (limit: number, offset: number, filters?: any) => {
    const users = await UserModel.getAll(limit, offset, filters);
    const totalCount = await UserModel.getTotalCount(filters);
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      users: usersWithoutPasswords,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
    };
  },

  getUserById: async (id: number) => {
    const user = await UserModel.findById(id);
    if (!user) throw new Error('USER_NOT_FOUND');

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  createUser: async (userData: CreateUserRequest) => {
    // Check if email exists
    const existingEmail = await UserModel.findByEmail(userData.email);
    if (existingEmail) throw new Error('DUPLICATE_EMAIL');

    // Check if student_id exists
    if (userData.student_id) {
      const existingStudentId = await UserModel.findByStudentId(userData.student_id);
      if (existingStudentId) throw new Error('DUPLICATE_STUDENT_ID');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;

    const user = await UserModel.create(userData);
    const { password, ...userWithoutPassword } = user;
    // Regenerate seed file for disaster recovery backup
    SeedGeneratorService.regenerate().catch(() => {});
    return userWithoutPassword;
  },

  updateUser: async (id: number, userData: UpdateUserRequest) => {
    // Check if user exists
    const existing = await UserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');

    // Check email uniqueness if changing
    if (userData.email && userData.email !== existing.email) {
      const existingEmail = await UserModel.findByEmail(userData.email);
      if (existingEmail) throw new Error('DUPLICATE_EMAIL');
    }

    // Hash password if provided
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = await UserModel.update(id, userData);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  deleteUser: async (id: number, archivedBy?: number) => {
    const existing = await UserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    
    await UserModel.delete(id, archivedBy);
    
    // Move face images to is_inactive/ (preserves them for restore)
    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try {
        await FaceImageService.archiveFaceImages(fullName);
      } catch (error) {
        console.error(`Failed to archive face images for user ${fullName}:`, error);
      }
    }
  },

  searchUsers: async (query: string, limit: number = 10) => {
    const users = await UserModel.search(query, limit);
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return usersWithoutPasswords;
  },

  // Archive-related functions
  getArchivedUsers: async (limit: number, offset: number, filters?: any) => {
    const users = await UserModel.getArchived(limit, offset, filters);
    const totalCount = await UserModel.getArchivedCount(filters);
    
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      users: usersWithoutPasswords,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
    };
  },

  restoreUser: async (id: number) => {
    const existing = await UserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    if (existing.status !== 'archived') throw new Error('USER_NOT_ARCHIVED');
    
    await UserModel.restore(id);

    // Move face images back to is_active/
    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try {
        await FaceImageService.restoreFaceImages(fullName);
      } catch (error) {
        console.error(`Failed to restore face images for user ${fullName}:`, error);
      }
    }
  },

  permanentDeleteUser: async (id: number) => {
    const existing = await UserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    
    await UserModel.permanentDelete(id);
    
    // Delete face images if user has a name
    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try {
        await FaceImageService.deleteFaceImages(fullName);
        console.log(`Deleted face images for user: ${fullName}`);
      } catch (error) {
        console.error(`Failed to delete face images for user ${fullName}:`, error);
        // Don't throw error - user is already deleted from DB
      }
    }
  },

  bulkArchiveUsers: async (ids: number[], archivedBy?: number) => {
    // Fetch users first to get their names for face image moves
    const users = await Promise.all(ids.map(id => UserModel.findById(id)));
    await UserModel.bulkArchive(ids, archivedBy);
    for (const user of users) {
      if (user?.first_name && user?.last_name) {
        const fullName = `${user.first_name}${user.middle_initial ? ' ' + user.middle_initial : ''} ${user.last_name}`.trim();
        try {
          await FaceImageService.archiveFaceImages(fullName);
        } catch (error) {
          console.error(`Failed to archive face images for ${fullName}:`, error);
        }
      }
    }
  },

  bulkRestoreUsers: async (ids: number[]) => {
    const users = await Promise.all(ids.map(id => UserModel.findById(id)));
    await UserModel.bulkRestore(ids);
    for (const user of users) {
      if (user?.first_name && user?.last_name) {
        const fullName = `${user.first_name}${user.middle_initial ? ' ' + user.middle_initial : ''} ${user.last_name}`.trim();
        try {
          await FaceImageService.restoreFaceImages(fullName);
        } catch (error) {
          console.error(`Failed to restore face images for ${fullName}:`, error);
        }
      }
    }
  },

  bulkDeleteUsers: async (ids: number[]) => {
    // Get all users first to delete their face images
    const users = await Promise.all(ids.map(id => UserModel.findById(id)));
    
    await UserModel.bulkDelete(ids);
    
    // Delete face images for all users
    for (const user of users) {
      if (user && user.first_name && user.last_name) {
        const fullName = `${user.first_name}${user.middle_initial ? ' ' + user.middle_initial : ''} ${user.last_name}`.trim();
        try {
          await FaceImageService.deleteFaceImages(fullName);
          console.log(`Deleted face images for user: ${fullName}`);
        } catch (error) {
          console.error(`Failed to delete face images for user ${fullName}:`, error);
          // Continue with other deletions
        }
      }
    }
  },

  deactivateUser: async (id: number, deactivatedBy: number) => {
    const existing = await UserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    if (existing.status !== 'active') throw new Error('USER_NOT_ACTIVE');

    await UserModel.deactivate(id, deactivatedBy);

    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try {
        await FaceImageService.moveFaceImages(fullName, 'is_active', 'is_inactive');
      } catch (error) {
        console.error(`Failed to move face images for ${fullName}:`, error);
      }
    }
  },

  reactivateUser: async (id: number) => {
    const existing = await UserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    if (existing.status !== 'deactivated') throw new Error('USER_NOT_DEACTIVATED');

    await UserModel.reactivate(id);

    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try {
        await FaceImageService.moveFaceImages(fullName, 'is_inactive', 'is_active');
      } catch (error) {
        console.error(`Failed to restore face images for ${fullName}:`, error);
      }
    }
  },

  exportToCSV: async (filters?: any) => {
    const { CSVExport } = await import('../utils/csvExport.js');
    
    // Fetch all users (max 10000 for safety)
    const users = await UserModel.getAll(10000, 0, filters);
    const totalCount = await UserModel.getTotalCount(filters);
    
    // Define CSV headers
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'student_id', label: 'Student ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'course_name', label: 'Course' },
      { key: 'year_name', label: 'Year Level' },
      { key: 'created_at', label: 'Registered Date' },
    ];
    
    // Format data for CSV
    const data = users.map((user: any) => ({
      id: user.id,
      student_id: user.student_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      course_name: user.course_name || 'N/A',
      year_name: user.year_name || 'N/A',
      created_at: new Date(user.created_at).toLocaleDateString(),
    }));
    
    // Generate summary
    const summary = [
      { label: 'Total Users', value: totalCount },
      { label: 'Export Date', value: new Date().toLocaleString() },
      { label: 'User Type', value: 'College Students' },
    ];
    
    return CSVExport.generateCSVWithSummary(data, headers, summary);
  },
};
