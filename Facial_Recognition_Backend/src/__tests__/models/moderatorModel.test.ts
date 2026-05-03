import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ModeratorModel } from '../../models/moderatorModel.js';
import * as db from '../../db/index.js';

describe('Moderator Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findByUsername', () => {
    it('should find moderator by username', async () => {
      const mockModerator = { id: 1, username: 'admin', email: 'admin@test.com' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockModerator] } as any);

      const result = await ModeratorModel.findByUsername('admin');

      expect(result).toEqual(mockModerator);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), ['admin']);
    });

    it('should return null if moderator not found', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      const result = await ModeratorModel.findByUsername('notfound');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find moderator by id', async () => {
      const mockModerator = { id: 1, username: 'admin' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockModerator] } as any);

      const result = await ModeratorModel.findById(1);

      expect(result).toEqual(mockModerator);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it('should return null if moderator not found', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      const result = await ModeratorModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should get all moderators with pagination', async () => {
      const mockModerators = [
        { id: 1, username: 'admin1' },
        { id: 2, username: 'admin2' },
      ];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockModerators } as any);

      const result = await ModeratorModel.getAll(10, 0);

      expect(result).toEqual(mockModerators);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [10, 0]);
    });
  });

  describe('getTotalCount', () => {
    it('should get total count of moderators', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [{ count: '5' }] } as any);

      const result = await ModeratorModel.getTotalCount();

      expect(result).toBe(5);
    });
  });

  describe('create', () => {
    it('should create a new moderator', async () => {
      const moderatorData = {
        username: 'newadmin',
        email: 'admin@test.com',
        password: 'hashed',
        role: 'moderator',
      };
      const mockModerator = { id: 1, ...moderatorData };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockModerator] } as any);

      const result = await ModeratorModel.create(moderatorData as any);

      expect(result).toEqual(mockModerator);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update moderator', async () => {
      const mockModerator = { id: 1, username: 'admin', email: 'admin@test.com' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockModerator] } as any);

      const result = await ModeratorModel.update(1, { email: 'newemail@test.com' });

      expect(result).toEqual(mockModerator);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete moderator', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      await ModeratorModel.delete(1, 10);

      expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 10]);
    });
  });
});
