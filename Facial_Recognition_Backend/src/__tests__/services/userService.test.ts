import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UserService } from '../../services/userService.js';
import { UserModel } from '../../models/userModel.js';
import bcrypt from 'bcryptjs';

jest.mock('../../models/userModel.js');
jest.mock('bcryptjs');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return paginated users without passwords', async () => {
      const mockUsers = [
        { 
          id: 1, 
          name: 'John Doe', 
          email: 'john@example.com', 
          password: 'hashed',
          role: 'student',
          status: 'active',
          registered_at: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        { 
          id: 2, 
          name: 'Jane Smith', 
          email: 'jane@example.com', 
          password: 'hashed',
          role: 'student',
          status: 'active',
          registered_at: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
      ];

      jest.spyOn(UserModel, 'getAll').mockResolvedValue(mockUsers);
      jest.spyOn(UserModel, 'getTotalCount').mockResolvedValue(2);

      const result = await UserService.getUsers(10, 0);

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).not.toHaveProperty('password');
      expect(result.totalCount).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply filters', async () => {
      jest.spyOn(UserModel, 'getAll').mockResolvedValue([]);
      jest.spyOn(UserModel, 'getTotalCount').mockResolvedValue(0);

      const filters = { course_id: 1, year_id: 2 };
      await UserService.getUsers(10, 0, filters);

      expect(UserModel.getAll).toHaveBeenCalledWith(10, 0, filters);
      expect(UserModel.getTotalCount).toHaveBeenCalledWith(filters);
    });
  });

  describe('getUserById', () => {
    it('should return user without password', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed',
        role: 'student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };

      jest.spyOn(UserModel, 'findById').mockResolvedValue(mockUser);

      const result = await UserService.getUserById(1);

      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('John Doe');
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(UserModel, 'findById').mockResolvedValue(null);

      await expect(UserService.getUserById(999)).rejects.toThrow('USER_NOT_FOUND');
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed_password',
        role: 'student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };

      jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(UserModel, 'findByStudentId').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);
      jest.spyOn(UserModel, 'create').mockResolvedValue(mockUser);

      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        student_id: '2024-001',
      };

      const result = await UserService.createUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).not.toHaveProperty('password');
      expect(UserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed_password' })
      );
    });

    it('should throw error if email exists', async () => {
      jest.spyOn(UserModel, 'findByEmail').mockResolvedValue({ id: 1 } as any);

      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
      };

      await expect(UserService.createUser(userData)).rejects.toThrow('DUPLICATE_EMAIL');
    });

    it('should throw error if student_id exists', async () => {
      jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(UserModel, 'findByStudentId').mockResolvedValue({ id: 1 } as any);

      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        student_id: '2024-001',
      };

      await expect(UserService.createUser(userData)).rejects.toThrow('DUPLICATE_STUDENT_ID');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const existingUser = {
        id: 1,
        email: 'john@example.com',
        password: 'old_hash',
        role: 'student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };

      const updatedUser = {
        id: 1,
        email: 'john.updated@example.com',
        password: 'new_hash',
        role: 'student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };

      jest.spyOn(UserModel, 'findById').mockResolvedValue(existingUser);
      jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hash' as never);
      jest.spyOn(UserModel, 'update').mockResolvedValue(updatedUser);

      const updateData = {
        email: 'john.updated@example.com',
        password: 'newpassword123',
      };

      const result = await UserService.updateUser(1, updateData);

      expect(result).not.toHaveProperty('password');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(UserModel, 'findById').mockResolvedValue(null);

      await expect(UserService.updateUser(999, {})).rejects.toThrow('USER_NOT_FOUND');
    });

    it('should throw error if new email exists', async () => {
      const existingUser = { 
        id: 1, 
        email: 'john@example.com',
        role: 'student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };
      const anotherUser = { 
        id: 2, 
        email: 'taken@example.com',
        role: 'student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };

      jest.spyOn(UserModel, 'findById').mockResolvedValue(existingUser);
      jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(anotherUser);

      await expect(
        UserService.updateUser(1, { email: 'taken@example.com' })
      ).rejects.toThrow('DUPLICATE_EMAIL');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockUser = { 
        id: 1,
        email: 'john@example.com',
        role: 'student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };
      jest.spyOn(UserModel, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(UserModel, 'delete').mockResolvedValue(undefined);

      await UserService.deleteUser(1, 2);

      expect(UserModel.delete).toHaveBeenCalledWith(1, 2);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(UserModel, 'findById').mockResolvedValue(null);

      await expect(UserService.deleteUser(999)).rejects.toThrow('USER_NOT_FOUND');
    });
  });

  describe('searchUsers', () => {
    it('should return search results without passwords', async () => {
      const mockUsers = [
        { 
          id: 1, 
          name: 'John Doe', 
          email: 'john@example.com', 
          password: 'hashed',
          role: 'student',
          status: 'active',
          registered_at: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
      ];

      jest.spyOn(UserModel, 'search').mockResolvedValue(mockUsers);

      const result = await UserService.searchUsers('john', 10);

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
    });
  });
});
