import bcrypt from 'bcryptjs';
import { ModeratorModel } from '../models/moderatorModel.js';
import { CreateModeratorRequest, UpdateModeratorRequest } from '../types/moderatorEntity.js';
import { SeedGeneratorService } from './seedGeneratorService.js';

export const ModeratorService = {
  getModerators: async (limit: number, offset: number) => {
    const moderators = await ModeratorModel.getAll(limit, offset);
    const totalCount = await ModeratorModel.getTotalCount();
    
    const moderatorsWithoutPasswords = moderators.map(mod => {
      const { password, ...modWithoutPassword } = mod;
      return modWithoutPassword;
    });

    return {
      moderators: moderatorsWithoutPasswords,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
    };
  },

  getModeratorById: async (id: number) => {
    const moderator = await ModeratorModel.findById(id);
    if (!moderator) throw new Error('MODERATOR_NOT_FOUND');

    const { password, ...modWithoutPassword } = moderator;
    return modWithoutPassword;
  },

  createModerator: async (modData: CreateModeratorRequest) => {
    const existing = await ModeratorModel.findByUsername(modData.username);
    if (existing) throw new Error('DUPLICATE_USERNAME');

    const hashedPassword = await bcrypt.hash(modData.password, 10);
    modData.password = hashedPassword;

    const moderator = await ModeratorModel.create(modData);
    const { password, ...modWithoutPassword } = moderator;
    // Regenerate seed file for disaster recovery backup
    SeedGeneratorService.regenerate().catch(() => {});
    return modWithoutPassword;
  },

  updateModerator: async (id: number, modData: UpdateModeratorRequest) => {
    const existing = await ModeratorModel.findById(id);
    if (!existing) throw new Error('MODERATOR_NOT_FOUND');

    if (modData.username && modData.username !== existing.username) {
      const existingUser = await ModeratorModel.findByUsername(modData.username);
      if (existingUser) throw new Error('DUPLICATE_USERNAME');
    }

    if (modData.password) {
      modData.password = await bcrypt.hash(modData.password, 10);
    }

    const moderator = await ModeratorModel.update(id, modData);
    const { password, ...modWithoutPassword } = moderator;
    return modWithoutPassword;
  },

  deleteModerator: async (id: number, archivedBy?: number) => {
    const existing = await ModeratorModel.findById(id);
    if (!existing) throw new Error('MODERATOR_NOT_FOUND');
    
    await ModeratorModel.delete(id, archivedBy);
  },

  // Archive-related functions
  getArchivedModerators: async (limit: number, offset: number, filters?: any) => {
    const moderators = await ModeratorModel.getArchived(limit, offset, filters);
    const totalCount = await ModeratorModel.getArchivedCount(filters);
    
    const moderatorsWithoutPasswords = moderators.map(mod => {
      const { password, ...modWithoutPassword } = mod;
      return modWithoutPassword;
    });

    return {
      moderators: moderatorsWithoutPasswords,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
    };
  },

  restoreModerator: async (id: number) => {
    const existing = await ModeratorModel.findById(id);
    if (!existing) throw new Error('MODERATOR_NOT_FOUND');
    if (existing.status !== 'archived') throw new Error('MODERATOR_NOT_ARCHIVED');
    
    await ModeratorModel.restore(id);
  },

  permanentDeleteModerator: async (id: number) => {
    const existing = await ModeratorModel.findById(id);
    if (!existing) throw new Error('MODERATOR_NOT_FOUND');
    
    await ModeratorModel.permanentDelete(id);
  },

  bulkArchiveModerators: async (ids: number[], archivedBy?: number) => {
    await ModeratorModel.bulkArchive(ids, archivedBy);
  },

  bulkRestoreModerators: async (ids: number[]) => {
    await ModeratorModel.bulkRestore(ids);
  },

  bulkDeleteModerators: async (ids: number[]) => {
    await ModeratorModel.bulkDelete(ids);
  },
};
