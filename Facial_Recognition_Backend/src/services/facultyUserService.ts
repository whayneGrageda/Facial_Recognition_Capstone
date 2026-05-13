import bcrypt from 'bcryptjs';
import { FacultyUserModel } from '../models/facultyUserModel.js';
import { CreateFacultyUserRequest, UpdateFacultyUserRequest } from '../types/facultyUserEntity.js';
import { FaceImageService } from './faceImageService.js';
import { SeedGeneratorService } from './seedGeneratorService.js';

export const FacultyUserService = {
  getUsers: async (limit: number, offset: number, filters?: any) => {
    const users = await FacultyUserModel.getAll(limit, offset, filters);
    const totalCount = await FacultyUserModel.getTotalCount(filters);
    
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
    const user = await FacultyUserModel.findById(id);
    if (!user) throw new Error('USER_NOT_FOUND');

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  createUser: async (userData: CreateFacultyUserRequest) => {
    if (userData.email) {
      const existingEmail = await FacultyUserModel.findByEmail(userData.email);
      if (existingEmail) throw new Error('DUPLICATE_EMAIL');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;

    const user = await FacultyUserModel.create(userData);
    const { password, ...userWithoutPassword } = user;
    // Regenerate seed file for disaster recovery backup
    SeedGeneratorService.regenerate().catch(() => {});
    return userWithoutPassword;
  },

  updateUser: async (id: number, userData: UpdateFacultyUserRequest) => {
    const existing = await FacultyUserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');

    if (userData.email && userData.email !== existing.email) {
      const existingEmail = await FacultyUserModel.findByEmail(userData.email);
      if (existingEmail) throw new Error('DUPLICATE_EMAIL');
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = await FacultyUserModel.update(id, userData);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  deleteUser: async (id: number, archivedBy?: number) => {
    const existing = await FacultyUserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    
    await FacultyUserModel.delete(id, archivedBy);
    
    // Delete face images if user has a name
    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try {
        await FaceImageService.deleteFaceImages(fullName);
        console.log(`Deleted face images for faculty user: ${fullName}`);
      } catch (error) {
        console.error(`Failed to delete face images for faculty user ${fullName}:`, error);
      }
    }
  },

  searchUsers: async (query: string, limit: number = 10) => {
    const users = await FacultyUserModel.search(query, limit);
    
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return usersWithoutPasswords;
  },

  // Archive-related functions
  getArchivedUsers: async (limit: number, offset: number, filters?: any) => {
    const users = await FacultyUserModel.getArchived(limit, offset, filters);
    const totalCount = await FacultyUserModel.getArchivedCount(filters);
    
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
    const existing = await FacultyUserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    if (existing.status !== 'archived') throw new Error('USER_NOT_ARCHIVED');
    
    await FacultyUserModel.restore(id);
  },

  permanentDeleteUser: async (id: number) => {
    const existing = await FacultyUserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    
    await FacultyUserModel.permanentDelete(id);
    
    // Delete face images if user has a name
    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try {
        await FaceImageService.deleteFaceImages(fullName);
        console.log(`Deleted face images for faculty user: ${fullName}`);
      } catch (error) {
        console.error(`Failed to delete face images for faculty user ${fullName}:`, error);
      }
    }
  },

  bulkArchiveUsers: async (ids: number[], archivedBy?: number) => {
    await FacultyUserModel.bulkArchive(ids, archivedBy);
  },

  bulkRestoreUsers: async (ids: number[]) => {
    await FacultyUserModel.bulkRestore(ids);
  },

  bulkDeleteUsers: async (ids: number[]) => {
    // Get all users first to delete their face images
    const users = await Promise.all(ids.map(id => FacultyUserModel.findById(id)));
    
    await FacultyUserModel.bulkDelete(ids);
    
    // Delete face images for all users
    for (const user of users) {
      if (user && user.first_name && user.last_name) {
        const fullName = `${user.first_name}${user.middle_initial ? ' ' + user.middle_initial : ''} ${user.last_name}`.trim();
        try {
          await FaceImageService.deleteFaceImages(fullName);
          console.log(`Deleted face images for faculty user: ${fullName}`);
        } catch (error) {
          console.error(`Failed to delete face images for faculty user ${fullName}:`, error);
        }
      }
    }
  },

  exportToCSV: async (filters?: any) => {
    const { CSVExport } = await import('../utils/csvExport.js');
    
    // Fetch all users (max 10000 for safety)
    const users = await FacultyUserModel.getAll(10000, 0, filters);
    const totalCount = await FacultyUserModel.getTotalCount(filters);
    
    // Define CSV headers
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'department_name', label: 'Department' },
      { key: 'created_at', label: 'Registered Date' },
    ];
    
    // Format data for CSV
    const data = users.map((user: any) => ({
      id: user.id,
      employee_id: user.employee_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      department_name: user.department_name || 'N/A',
      created_at: new Date(user.created_at).toLocaleDateString(),
    }));
    
    // Generate summary
    const summary = [
      { label: 'Total Users', value: totalCount },
      { label: 'Export Date', value: new Date().toLocaleString() },
      { label: 'User Type', value: 'Faculty' },
    ];
    
    return CSVExport.generateCSVWithSummary(data, headers, summary);
  },
};
