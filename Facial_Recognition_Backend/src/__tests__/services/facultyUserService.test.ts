import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { FacultyUserService } from '../../services/facultyUserService.js';
import { FacultyUserModel } from '../../models/facultyUserModel.js';
import bcrypt from 'bcryptjs';

jest.mock('../../models/facultyUserModel.js');
jest.mock('bcryptjs');

describe('Faculty User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUsers', () => {
    it('should return users without passwords', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@test.com', password: 'hashed' },
        { id: 2, name: 'Jane Doe', email: 'jane@test.com', password: 'hashed' },
      ];

      jest.spyOn(FacultyUserModel, 'getAll').mockResolvedValue(mockUsers as any);
      jest.spyOn(FacultyUserModel, 'getTotalCount').mockResolvedValue(2);

      const result = await FacultyUserService.getUsers(10, 0);

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).not.toHaveProperty('password');
      expect(result.totalCount).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply filters', async () => {
      jest.spyOn(FacultyUserModel, 'getAll').mockResolvedValue([]);
      jest.spyOn(FacultyUserModel, 'getTotalCount').mockResolvedValue(0);

      const filters = { department_id: 5, search: 'test' };
      await FacultyUserService.getUsers(10, 0, filters);

      expect(FacultyUserModel.getAll).toHaveBeenCalledWith(10, 0, filters);
      expect(FacultyUserModel.getTotalCount).toHaveBeenCalledWith(filters);
    });
  });

  describe('getUserById', () => {
    it('should return user without password', async () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@test.com', password: 'hashed' };
      jest.spyOn(FacultyUserModel, 'findById').mockResolvedValue(mockUser as any);

      const result = await FacultyUserService.getUserById(1);

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(1);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(FacultyUserModel, 'findById').mockResolvedValue(null);

      await expect(FacultyUserService.getUserById(999)).rejects.toThrow('USER_NOT_FOUND');
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        password: 'password123',
      };

      jest.spyOn(FacultyUserModel, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(FacultyUserModel, 'create').mockResolvedValue({
        id: 1,
        ...userData,
        password: 'hashedPassword',
      } as any);

      const result = await FacultyUserService.createUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error for duplicate email', async () => {
      const userData = { email: 'existing@test.com', password: 'pass' };
      jest.spyOn(FacultyUserModel, 'findByEmail').mockResolvedValue({ id: 1 } as any);

      await expect(FacultyUserService.createUser(userData as any)).rejects.toThrow('DUPLICATE_EMAIL');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const existingUser = { id: 1, email: 'john@test.com', password: 'hashed' };
      const updateData = { first_name: 'John Updated' };

      jest.spyOn(FacultyUserModel, 'findById').mockResolvedValue(existingUser as any);
      jest.spyOn(FacultyUserModel, 'update').mockResolvedValue({
        ...existingUser,
        ...updateData,
      } as any);

      const result = await FacultyUserService.updateUser(1, updateData);

      expect(result).not.toHaveProperty('password');
      expect(FacultyUserModel.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(FacultyUserModel, 'findById').mockResolvedValue(null);

      await expect(FacultyUserService.updateUser(999, {})).rejects.toThrow('USER_NOT_FOUND');
    });

    it('should throw error for duplicate email', async () => {
      const existingUser = { id: 1, email: 'john@test.com' };
      jest.spyOn(FacultyUserModel, 'findById').mockResolvedValue(existingUser as any);
      jest.spyOn(FacultyUserModel, 'findByEmail').mockResolvedValue({ id: 2 } as any);

      await expect(
        FacultyUserService.updateUser(1, { email: 'existing@test.com' })
      ).rejects.toThrow('DUPLICATE_EMAIL');
    });

    it('should hash password if provided', async () => {
      const existingUser = { id: 1, email: 'john@test.com', password: 'old' };
      jest.spyOn(FacultyUserModel, 'findById').mockResolvedValue(existingUser as any);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newHashedPassword' as never);
      jest.spyOn(FacultyUserModel, 'update').mockResolvedValue(existingUser as any);

      await FacultyUserService.updateUser(1, { password: 'newPassword' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      jest.spyOn(FacultyUserModel, 'findById').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(FacultyUserModel, 'delete').mockResolvedValue(undefined);

      await FacultyUserService.deleteUser(1, 10);

      expect(FacultyUserModel.delete).toHaveBeenCalledWith(1, 10);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(FacultyUserModel, 'findById').mockResolvedValue(null);

      await expect(FacultyUserService.deleteUser(999)).rejects.toThrow('USER_NOT_FOUND');
    });
  });

  describe('searchUsers', () => {
    it('should return search results without passwords', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@test.com', password: 'hashed' },
      ];

      jest.spyOn(FacultyUserModel, 'search').mockResolvedValue(mockUsers as any);

      const result = await FacultyUserService.searchUsers('john', 10);

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
      expect(FacultyUserModel.search).toHaveBeenCalledWith('john', 10);
    });
  });
});
