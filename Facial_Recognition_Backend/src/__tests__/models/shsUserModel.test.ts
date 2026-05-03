import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ShsUserModel } from '../../models/shsUserModel.js';
import * as db from '../../db/index.js';

describe('SHS User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findByEmail', () => {
    it('should find SHS user by email', async () => {
      const mockUser = { id: 1, email: 'jane@test.com', name: 'Jane Doe' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const result = await ShsUserModel.findByEmail('jane@test.com');

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), ['jane@test.com']);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      const result = await ShsUserModel.findByEmail('notfound@test.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find SHS user by id', async () => {
      const mockUser = { id: 1, name: 'Jane Doe' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const result = await ShsUserModel.findById(1);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      const result = await ShsUserModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should get all SHS users with pagination', async () => {
      const mockUsers = [
        { id: 1, name: 'Jane Doe' },
        { id: 2, name: 'John Doe' },
      ];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockUsers } as any);

      const result = await ShsUserModel.getAll(10, 0);

      expect(result).toEqual(mockUsers);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [10, 0]);
    });

    it('should apply filters', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      await ShsUserModel.getAll(10, 0, { strand_id: 3, grade_id: 11, search: 'test' } as any);

      expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([3, 11, '%test%', '%test%', 10, 0]));
    });
  });

  describe('getTotalCount', () => {
    it('should get total count of SHS users', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [{ count: '30' }] } as any);

      const result = await ShsUserModel.getTotalCount();

      expect(result).toBe(30);
    });
  });

  describe('create', () => {
    it('should create a new SHS user', async () => {
      const userData = {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@test.com',
        password: 'hashed',
        strand_id: 1,
        grade_id: 11,
      };
      const mockUser = { id: 1, ...userData };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const result = await ShsUserModel.create(userData as any);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update SHS user', async () => {
      const mockUser = { id: 1, first_name: 'Jane', last_name: 'Doe', middle_initial: 'A' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const result = await ShsUserModel.update(1, { first_name: 'Jane Updated' } as any);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete SHS user', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      await ShsUserModel.delete(1, 10);

      expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 10]);
    });
  });

  describe('search', () => {
    it('should search SHS users', async () => {
      const mockUsers = [{ id: 1, name: 'Jane Doe' }];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockUsers } as any);

      const result = await ShsUserModel.search('jane', 10);

      expect(result).toEqual(mockUsers);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), ['%jane%', 10]);
    });
  });
});





