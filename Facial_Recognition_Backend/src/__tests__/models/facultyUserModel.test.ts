import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { FacultyUserModel } from '../../models/facultyUserModel.js';
import * as db from '../../db/index.js';

describe('Faculty User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findByEmail', () => {
    it('should find faculty user by email', async () => {
      const mockUser = { id: 1, email: 'john@test.com', name: 'John Doe' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const result = await FacultyUserModel.findByEmail('john@test.com');

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), ['john@test.com']);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      const result = await FacultyUserModel.findByEmail('notfound@test.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find faculty user by id', async () => {
      const mockUser = { id: 1, name: 'John Doe' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const result = await FacultyUserModel.findById(1);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      const result = await FacultyUserModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should get all faculty users with pagination', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Doe' },
      ];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockUsers } as any);

      const result = await FacultyUserModel.getAll(10, 0);

      expect(result).toEqual(mockUsers);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [10, 0]);
    });

    it('should apply filters', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      await FacultyUserModel.getAll(10, 0, { department_id: 5, search: 'test' });

      expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([5, '%test%', '%test%', 10, 0]));
    });
  });

  describe('getTotalCount', () => {
    it('should get total count of faculty users', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [{ count: '25' }] } as any);

      const result = await FacultyUserModel.getTotalCount();

      expect(result).toBe(25);
    });
  });

  describe('create', () => {
    it('should create a new faculty user', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        password: 'hashed',
        department_id: 1,
      };
      const mockUser = { id: 1, ...userData };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const result = await FacultyUserModel.create(userData as any);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update faculty user', async () => {
      const mockUser = { id: 1, first_name: 'John', last_name: 'Doe', middle_initial: 'A' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const result = await FacultyUserModel.update(1, { first_name: 'John Updated' });

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete faculty user', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      await FacultyUserModel.delete(1, 10);

      expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 10]);
    });
  });

  describe('search', () => {
    it('should search faculty users', async () => {
      const mockUsers = [{ id: 1, name: 'John Doe' }];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockUsers } as any);

      const result = await FacultyUserModel.search('john', 10);

      expect(result).toEqual(mockUsers);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), ['%john%', 10]);
    });
  });
});
