import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuthService } from '../../services/authService.js';
import { AuthModel } from '../../models/authModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../models/authModel.js');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.REFRESH_TOKEN_EXPIRATION = '1d';
  });

  describe('login', () => {
    it('should login admin with username', async () => {
      const mockAdmin = {
        id: 1,
        username: 'admin',
        password: 'hashed_password',
        email: 'admin@example.com',
      };

      jest.spyOn(AuthModel, 'findAdminByUsername').mockResolvedValue(mockAdmin as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('mock-token' as any);
      jest.spyOn(AuthModel, 'storeToken').mockResolvedValue(undefined);

      const result = await AuthService.login({
        username: 'admin',
        password: 'password123',
      });

      expect(result.token).toBe('mock-token');
      expect(result.user.role).toBe('admin');
      expect(result.user.userType).toBe('admin');
      expect(AuthModel.findAdminByUsername).toHaveBeenCalledWith('admin');
    });

    it('should login moderator with username', async () => {
      const mockModerator = {
        id: 2,
        username: 'moderator',
        password: 'hashed_password',
        email: 'mod@example.com',
      };

      jest.spyOn(AuthModel, 'findAdminByUsername').mockResolvedValue(null);
      jest.spyOn(AuthModel, 'findModeratorByUsername').mockResolvedValue(mockModerator as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('mock-token' as any);
      jest.spyOn(AuthModel, 'storeToken').mockResolvedValue(undefined);

      const result = await AuthService.login({
        username: 'moderator',
        password: 'password123',
      });

      expect(result.user.role).toBe('moderator');
      expect(result.user.userType).toBe('moderator');
    });

    it('should login college user with email', async () => {
      const mockUser = {
        id: 3,
        email: 'student@example.com',
        password: 'hashed_password',
        name: 'John Doe',
        role: 'student',
      };

      jest.spyOn(AuthModel, 'findAdminByUsername').mockResolvedValue(null);
      jest.spyOn(AuthModel, 'findModeratorByUsername').mockResolvedValue(null);
      jest.spyOn(AuthModel, 'findUserByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('mock-token' as any);
      jest.spyOn(AuthModel, 'storeToken').mockResolvedValue(undefined);

      const result = await AuthService.login({
        email: 'student@example.com',
        password: 'password123',
        userType: 'college',
      });

      expect(result.user.role).toBe('student');
      expect(result.user.userType).toBe('college');
      expect(AuthModel.findUserByEmail).toHaveBeenCalledWith('student@example.com', 'college');
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(AuthModel, 'findAdminByUsername').mockResolvedValue(null);
      jest.spyOn(AuthModel, 'findModeratorByUsername').mockResolvedValue(null);
      jest.spyOn(AuthModel, 'findUserByEmail').mockResolvedValue(null);

      await expect(
        AuthService.login({
          email: 'notfound@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('should throw error if password is invalid', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        password: 'hashed_password',
      };

      jest.spyOn(AuthModel, 'findUserByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        AuthService.login({
          email: 'user@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('should store token in database', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        password: 'hashed_password',
        role: 'student',
      };

      jest.spyOn(AuthModel, 'findUserByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('mock-token' as any);
      jest.spyOn(AuthModel, 'storeToken').mockResolvedValue(undefined);

      await AuthService.login({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(AuthModel.storeToken).toHaveBeenCalledWith(
        '1',
        'mock-token',
        'college',
        'student',
        expect.any(Date)
      );
    });
  });

  describe('logout', () => {
    it('should invalidate token', async () => {
      jest.spyOn(AuthModel, 'invalidateToken').mockResolvedValue(undefined);

      await AuthService.logout('mock-token');

      expect(AuthModel.invalidateToken).toHaveBeenCalledWith('mock-token');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockDecoded = {
        userId: 1,
        email: 'user@example.com',
        role: 'student',
      };

      jest.spyOn(jwt, 'verify').mockReturnValue(mockDecoded as any);
      jest.spyOn(AuthModel, 'verifyToken').mockResolvedValue({ token: 'mock-token' } as any);

      const result = await AuthService.verifyToken('mock-token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith('mock-token', 'test-secret');
    });

    it('should throw error if token not in database', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({} as any);
      jest.spyOn(AuthModel, 'verifyToken').mockResolvedValue(null);

      await expect(AuthService.verifyToken('invalid-token')).rejects.toThrow('INVALID_TOKEN');
    });

    it('should throw error if jwt verification fails', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(AuthService.verifyToken('bad-token')).rejects.toThrow('INVALID_TOKEN');
    });
  });
});
