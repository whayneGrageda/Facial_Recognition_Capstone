import bcrypt from 'bcryptjs';
import { ShsUserModel } from '../models/shsUserModel.js';
import { CreateShsUserRequest, UpdateShsUserRequest } from '../types/shsUserEntity.js';
import { FaceImageService } from './faceImageService.js';
import { SeedGeneratorService } from './seedGeneratorService.js';

export const ShsUserService = {
  getUsers: async (limit: number, offset: number, filters?: any) => {
    const users = await ShsUserModel.getAll(limit, offset, filters);
    const totalCount = await ShsUserModel.getTotalCount(filters);
    
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
    const user = await ShsUserModel.findById(id);
    if (!user) throw new Error('USER_NOT_FOUND');

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  createUser: async (userData: CreateShsUserRequest) => {
    if (userData.email) {
      const existingEmail = await ShsUserModel.findByEmail(userData.email);
      if (existingEmail) throw new Error('DUPLICATE_EMAIL');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;

    const user = await ShsUserModel.create(userData);
    const { password, ...userWithoutPassword } = user;
    // Regenerate seed file for disaster recovery backup
    SeedGeneratorService.regenerate().catch(() => {});
    return userWithoutPassword;
  },

  updateUser: async (id: number, userData: UpdateShsUserRequest) => {
    const existing = await ShsUserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');

    if (userData.email && userData.email !== existing.email) {
      const existingEmail = await ShsUserModel.findByEmail(userData.email);
      if (existingEmail) throw new Error('DUPLICATE_EMAIL');
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = await ShsUserModel.update(id, userData);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  deleteUser: async (id: number, archivedBy?: number) => {
    const existing = await ShsUserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    
    await ShsUserModel.delete(id, archivedBy);
    
    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try {
        await FaceImageService.archiveFaceImages(fullName);
      } catch (error) {
        console.error(`Failed to archive face images for SHS user ${fullName}:`, error);
      }
    }
  },

  searchUsers: async (query: string, limit: number = 10) => {
    const users = await ShsUserModel.search(query, limit);
    
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return usersWithoutPasswords;
  },

  // Archive-related functions
  getArchivedUsers: async (limit: number, offset: number, filters?: any) => {
    const users = await ShsUserModel.getArchived(limit, offset, filters);
    const totalCount = await ShsUserModel.getArchivedCount(filters);
    
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
    const existing = await ShsUserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    if (existing.status !== 'archived') throw new Error('USER_NOT_ARCHIVED');
    
    await ShsUserModel.restore(id);

    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try {
        await FaceImageService.restoreFaceImages(fullName);
      } catch (error) {
        console.error(`Failed to restore face images for SHS user ${fullName}:`, error);
      }
    }
  },

  permanentDeleteUser: async (id: number) => {
    const existing = await ShsUserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    
    await ShsUserModel.permanentDelete(id);
    
    // Delete face images if user has a name
    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try {
        await FaceImageService.deleteFaceImages(fullName);
        console.log(`Deleted face images for SHS user: ${fullName}`);
      } catch (error) {
        console.error(`Failed to delete face images for SHS user ${fullName}:`, error);
      }
    }
  },

  bulkArchiveUsers: async (ids: number[], archivedBy?: number) => {
    const users = await Promise.all(ids.map(id => ShsUserModel.findById(id)));
    await ShsUserModel.bulkArchive(ids, archivedBy);
    for (const user of users) {
      if (user?.first_name && user?.last_name) {
        const fullName = `${user.first_name}${user.middle_initial ? ' ' + user.middle_initial : ''} ${user.last_name}`.trim();
        try { await FaceImageService.archiveFaceImages(fullName); } catch {}
      }
    }
  },

  bulkRestoreUsers: async (ids: number[]) => {
    const users = await Promise.all(ids.map(id => ShsUserModel.findById(id)));
    await ShsUserModel.bulkRestore(ids);
    for (const user of users) {
      if (user?.first_name && user?.last_name) {
        const fullName = `${user.first_name}${user.middle_initial ? ' ' + user.middle_initial : ''} ${user.last_name}`.trim();
        try { await FaceImageService.restoreFaceImages(fullName); } catch {}
      }
    }
  },

  bulkDeleteUsers: async (ids: number[]) => {
    // Get all users first to delete their face images
    const users = await Promise.all(ids.map(id => ShsUserModel.findById(id)));
    
    await ShsUserModel.bulkDelete(ids);
    
    // Delete face images for all users
    for (const user of users) {
      if (user && user.first_name && user.last_name) {
        const fullName = `${user.first_name}${user.middle_initial ? ' ' + user.middle_initial : ''} ${user.last_name}`.trim();
        try {
          await FaceImageService.deleteFaceImages(fullName);
          console.log(`Deleted face images for SHS user: ${fullName}`);
        } catch (error) {
          console.error(`Failed to delete face images for SHS user ${fullName}:`, error);
        }
      }
    }
  },

  deactivateUser: async (id: number, deactivatedBy: number) => {
    const existing = await ShsUserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    if (existing.status !== 'active') throw new Error('USER_NOT_ACTIVE');
    await ShsUserModel.deactivate(id, deactivatedBy);
    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try { await FaceImageService.moveFaceImages(fullName, 'is_active', 'is_inactive'); } catch {}
    }
  },

  reactivateUser: async (id: number) => {
    const existing = await ShsUserModel.findById(id);
    if (!existing) throw new Error('USER_NOT_FOUND');
    if (existing.status !== 'deactivated') throw new Error('USER_NOT_DEACTIVATED');
    await ShsUserModel.reactivate(id);
    if (existing.first_name && existing.last_name) {
      const fullName = `${existing.first_name}${existing.middle_initial ? ' ' + existing.middle_initial : ''} ${existing.last_name}`.trim();
      try { await FaceImageService.moveFaceImages(fullName, 'is_inactive', 'is_active'); } catch {}
    }
  },

  exportToCSV: async (filters?: any) => {
    const { CSVExport } = await import('../utils/csvExport.js');
    
    // Fetch all users (max 10000 for safety)
    const users = await ShsUserModel.getAll(10000, 0, filters);
    const totalCount = await ShsUserModel.getTotalCount(filters);
    
    // Define CSV headers
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'student_id', label: 'Student ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'strand_name', label: 'Strand' },
      { key: 'year_name', label: 'Grade Level' },
      { key: 'created_at', label: 'Registered Date' },
    ];
    
    // Format data for CSV
    const data = users.map((user: any) => ({
      id: user.id,
      student_id: user.student_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      strand_name: user.strand_name || 'N/A',
      year_name: user.year_name || 'N/A',
      created_at: new Date(user.created_at).toLocaleDateString(),
    }));
    
    // Generate summary
    const summary = [
      { label: 'Total Users', value: totalCount },
      { label: 'Export Date', value: new Date().toLocaleString() },
      { label: 'User Type', value: 'SHS Students' },
    ];
    
    return CSVExport.generateCSVWithSummary(data, headers, summary);
  },
};
