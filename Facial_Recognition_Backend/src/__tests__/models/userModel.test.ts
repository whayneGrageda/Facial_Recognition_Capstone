import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UserModel } from '../../models/userModel.js';
import * as db from '../../db/index.js';

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        course_name: 'Computer Science',
        year_name: '3rd Year',
      };

      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const result = await UserModel.findByEmail('john@example.com');

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.*, c.name as course_name'),
        ['john@example.com']
      );
    });

    it('should return null when user not found', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      const result = await UserModel.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const result = await UserModel.findById(1);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      const result = await UserModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByStudentId', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        student_id: '2024-001',
        name: 'John Doe',
      };

      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const result = await UserModel.findByStudentId('2024-001');

      expect(result).toEqual(mockUser);
    });
  });

  describe('getAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ];

      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockUsers } as any);

      const result = await UserModel.getAll(10, 0);

      expect(result).toEqual(mockUsers);
      expect(db.query).toHaveBeenCalled();
    });

    it('should apply filters when provided', async () => {
      const mockUsers = [{ id: 1, name: 'John Doe' }];

      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockUsers } as any);

      const filters = { course_id: 1, year_id: 2, search: 'john' };
      await UserModel.getAll(10, 0, filters);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('course_id'),
        expect.arrayContaining([1, 2])
      );
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'hashed_password',
        student_id: '2024-001',
      };

      const result = await UserModel.create(userData);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['John', 'Doe', 'john@example.com'])
      );
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        middle_initial: 'A',
      };

      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

      const updateData = {
        first_name: 'John',
        last_name: 'Updated',
      };

      const result = await UserModel.update(1, updateData);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete user', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      await UserModel.delete(1, 2);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'archived'"),
        [1, 2]
      );
    });
  });

  describe('search', () => {
    it('should search users by query', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
      ];

      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockUsers } as any);

      const result = await UserModel.search('john', 10);

      expect(result).toEqual(mockUsers);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        ['%john%', 10]
      );
    });
  });
});

