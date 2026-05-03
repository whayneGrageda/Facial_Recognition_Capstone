import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ModeratorService } from '../../services/moderatorService.js';
import { ModeratorModel } from '../../models/moderatorModel.js';
import bcrypt from 'bcryptjs';

jest.mock('../../models/moderatorModel.js');
jest.mock('bcryptjs');

describe('ModeratorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getModerators', () => {
    it('should return moderators without passwords', async () => {
      const mockModerators = [
        { id: 1, username: 'mod1', password: 'hashed', email: 'mod1@example.com' },
        { id: 2, username: 'mod2', password: 'hashed', email: 'mod2@example.com' },
      ];

      jest.spyOn(ModeratorModel, 'getAll').mockResolvedValue(mockModerators as any);
      jest.spyOn(ModeratorModel, 'getTotalCount').mockResolvedValue(2);

      const result = await ModeratorService.getModerators(10, 0);

      expect(result.moderators).toHaveLength(2);
      expect(result.moderators[0]).not.toHaveProperty('password');
      expect(result.totalCount).toBe(2);
    });
  });

  describe('getModeratorById', () => {
    it('should return moderator without password', async () => {
      const mockModerator = { id: 1, username: 'mod1', password: 'hashed' };

      jest.spyOn(ModeratorModel, 'findById').mockResolvedValue(mockModerator as any);

      const result = await ModeratorService.getModeratorById(1);

      expect(result).not.toHaveProperty('password');
      expect(result.username).toBe('mod1');
    });

    it('should throw error if not found', async () => {
      jest.spyOn(ModeratorModel, 'findById').mockResolvedValue(null);

      await expect(ModeratorService.getModeratorById(999)).rejects.toThrow('MODERATOR_NOT_FOUND');
    });
  });

  describe('createModerator', () => {
    it('should create moderator with hashed password', async () => {
      const mockModerator = { id: 1, username: 'newmod', password: 'hashed' };

      jest.spyOn(ModeratorModel, 'findByUsername').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);
      jest.spyOn(ModeratorModel, 'create').mockResolvedValue(mockModerator as any);

      const modData = { username: 'newmod', password: 'password123', email: 'mod@example.com' };
      const result = await ModeratorService.createModerator(modData);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if username exists', async () => {
      jest.spyOn(ModeratorModel, 'findByUsername').mockResolvedValue({ id: 1 } as any);

      await expect(
        ModeratorService.createModerator({ username: 'existing', password: 'pass' })
      ).rejects.toThrow('DUPLICATE_USERNAME');
    });
  });

  describe('updateModerator', () => {
    it('should update moderator successfully', async () => {
      const existingMod = { id: 1, username: 'mod1', password: 'old_hash' };
      const updatedMod = { id: 1, username: 'mod1_updated', password: 'new_hash' };

      jest.spyOn(ModeratorModel, 'findById').mockResolvedValue(existingMod as any);
      jest.spyOn(ModeratorModel, 'findByUsername').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hash' as never);
      jest.spyOn(ModeratorModel, 'update').mockResolvedValue(updatedMod as any);

      const result = await ModeratorService.updateModerator(1, {
        username: 'mod1_updated',
        password: 'newpass',
      });

      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if moderator not found', async () => {
      jest.spyOn(ModeratorModel, 'findById').mockResolvedValue(null);

      await expect(ModeratorService.updateModerator(999, {})).rejects.toThrow(
        'MODERATOR_NOT_FOUND'
      );
    });

    it('should throw error if new username exists', async () => {
      const existingMod = { id: 1, username: 'mod1' };
      const anotherMod = { id: 2, username: 'taken' };

      jest.spyOn(ModeratorModel, 'findById').mockResolvedValue(existingMod as any);
      jest.spyOn(ModeratorModel, 'findByUsername').mockResolvedValue(anotherMod as any);

      await expect(
        ModeratorService.updateModerator(1, { username: 'taken' })
      ).rejects.toThrow('DUPLICATE_USERNAME');
    });
  });

  describe('deleteModerator', () => {
    it('should delete moderator successfully', async () => {
      jest.spyOn(ModeratorModel, 'findById').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(ModeratorModel, 'delete').mockResolvedValue(undefined);

      await ModeratorService.deleteModerator(1, 2);

      expect(ModeratorModel.delete).toHaveBeenCalledWith(1, 2);
    });

    it('should throw error if moderator not found', async () => {
      jest.spyOn(ModeratorModel, 'findById').mockResolvedValue(null);

      await expect(ModeratorService.deleteModerator(999)).rejects.toThrow('MODERATOR_NOT_FOUND');
    });
  });
});
