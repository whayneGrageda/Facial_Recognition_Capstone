import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ShsUserService } from '../../services/shsUserService.js';
import { ShsUserModel } from '../../models/shsUserModel.js';
import bcrypt from 'bcryptjs';

jest.mock('../../models/shsUserModel.js');
jest.mock('bcryptjs');

describe('SHS User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUsers', () => {
    it('should return users without passwords', async () => {
      const mockUsers = [
        { 
          id: 1, 
          name: 'Jane Doe', 
          email: 'jane@test.com', 
          password: 'hashed',
          role: 'shs_student',
          status: 'active',
          registered_at: new Date('2024-01-01'),
        },
        { 
          id: 2, 
          name: 'John Doe', 
          email: 'john@test.com', 
          password: 'hashed',
          role: 'shs_student',
          status: 'active',
          registered_at: new Date('2024-01-01'),
        },
      ];

      jest.spyOn(ShsUserModel, 'getAll').mockResolvedValue(mockUsers);
      jest.spyOn(ShsUserModel, 'getTotalCount').mockResolvedValue(2);

      const result = await ShsUserService.getUsers(10, 0);

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).not.toHaveProperty('password');
      expect(result.totalCount).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply filters', async () => {
      jest.spyOn(ShsUserModel, 'getAll').mockResolvedValue([]);
      jest.spyOn(ShsUserModel, 'getTotalCount').mockResolvedValue(0);

      const filters = { strand_id: 3, grade_id: 11, search: 'test' };
      await ShsUserService.getUsers(10, 0, filters);

      expect(ShsUserModel.getAll).toHaveBeenCalledWith(10, 0, filters);
      expect(ShsUserModel.getTotalCount).toHaveBeenCalledWith(filters);
    });
  });

  describe('getUserById', () => {
    it('should return user without password', async () => {
      const mockUser = { 
        id: 1, 
        name: 'Jane Doe', 
        email: 'jane@test.com', 
        password: 'hashed',
        role: 'shs_student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
      };
      jest.spyOn(ShsUserModel, 'findById').mockResolvedValue(mockUser);

      const result = await ShsUserService.getUserById(1);

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(1);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(ShsUserModel, 'findById').mockResolvedValue(null);

      await expect(ShsUserService.getUserById(999)).rejects.toThrow('USER_NOT_FOUND');
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@test.com',
        password: 'password123',
        strand_id: 1,
        grade_id: 11,
      };

      jest.spyOn(ShsUserModel, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(ShsUserModel, 'create').mockResolvedValue({
        id: 1,
        ...userData,
        password: 'hashedPassword',
        role: 'shs_student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
      });

      const result = await ShsUserService.createUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error for duplicate email', async () => {
      const userData = { email: 'existing@test.com', password: 'pass' };
      const mockExistingUser = {
        id: 1,
        email: 'existing@test.com',
        role: 'shs_student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
      };
      jest.spyOn(ShsUserModel, 'findByEmail').mockResolvedValue(mockExistingUser);

      await expect(ShsUserService.createUser(userData as any)).rejects.toThrow('DUPLICATE_EMAIL');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const existingUser = { 
        id: 1, 
        email: 'jane@test.com', 
        password: 'hashed',
        role: 'shs_student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
      };
      const updateData = { first_name: 'Jane Updated' };

      jest.spyOn(ShsUserModel, 'findById').mockResolvedValue(existingUser);
      jest.spyOn(ShsUserModel, 'update').mockResolvedValue({
        ...existingUser,
        ...updateData,
      });

      const result = await ShsUserService.updateUser(1, updateData);

      expect(result).not.toHaveProperty('password');
      expect(ShsUserModel.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(ShsUserModel, 'findById').mockResolvedValue(null);

      await expect(ShsUserService.updateUser(999, {})).rejects.toThrow('USER_NOT_FOUND');
    });

    it('should throw error for duplicate email', async () => {
      const existingUser = { 
        id: 1, 
        email: 'jane@test.com',
        role: 'shs_student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
      };
      jest.spyOn(ShsUserModel, 'findById').mockResolvedValue(existingUser);
      jest.spyOn(ShsUserModel, 'findByEmail').mockResolvedValue({ 
        id: 2, 
        email: 'existing@test.com',
        role: 'shs_student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
      });

      await expect(
        ShsUserService.updateUser(1, { email: 'existing@test.com' })
      ).rejects.toThrow('DUPLICATE_EMAIL');
    });

    it('should hash password if provided', async () => {
      const existingUser = { 
        id: 1, 
        email: 'jane@test.com', 
        password: 'old',
        role: 'shs_student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
      };
      jest.spyOn(ShsUserModel, 'findById').mockResolvedValue(existingUser);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newHashedPassword' as never);
      jest.spyOn(ShsUserModel, 'update').mockResolvedValue(existingUser);

      await ShsUserService.updateUser(1, { password: 'newPassword' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockUser = { 
        id: 1,
        role: 'shs_student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        email: 'jane@test.com'
      };
      jest.spyOn(ShsUserModel, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(ShsUserModel, 'delete').mockResolvedValue(undefined);

      await ShsUserService.deleteUser(1, 10);

      expect(ShsUserModel.delete).toHaveBeenCalledWith(1, 10);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(ShsUserModel, 'findById').mockResolvedValue(null);

      await expect(ShsUserService.deleteUser(999)).rejects.toThrow('USER_NOT_FOUND');
    });
  });

  describe('searchUsers', () => {
    it('should return search results without passwords', async () => {
      const mockUsers = [
        { 
          id: 1, 
          name: 'Jane Doe', 
          email: 'jane@test.com', 
          password: 'hashed',
          role: 'shs_student',
          status: 'active',
          registered_at: new Date('2024-01-01'),
        },
      ];

      jest.spyOn(ShsUserModel, 'search').mockResolvedValue(mockUsers);

      const result = await ShsUserService.searchUsers('jane', 10);

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
      expect(ShsUserModel.search).toHaveBeenCalledWith('jane', 10);
    });
  });
});
