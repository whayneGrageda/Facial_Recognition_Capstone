import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from 'express';
import {
  getShsUsers,
  getShsUserById,
  createShsUser,
  updateShsUser,
  deleteShsUser,
  searchShsUsers,
} from '../controllers/shsUserController.js';
import { ShsUserService } from '../services/shsUserService.js';
import { API_MESSAGES } from '../constants/messages.js';

jest.mock('../services/shsUserService.js');

describe('SHS User Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockResponse = {
      status: statusMock as any,
      json: jsonMock as any,
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getShsUsers', () => {
    it('should return SHS users list successfully', async () => {
      const mockResult = {
        users: [{ 
          id: 1, 
          name: 'Jane Doe', 
          email: 'jane@test.com',
          role: 'student',
          registered_at: new Date('2024-01-01'),
          status: 'active'
        }],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      };

      jest.spyOn(ShsUserService, 'getUsers').mockResolvedValue(mockResult);

      mockRequest = {
        query: { limit: '10', offset: '0' },
      };

      await getShsUsers(mockRequest as Request, mockResponse as Response);

      expect(ShsUserService.getUsers).toHaveBeenCalledWith(10, 0, {
        strand_id: undefined,
        grade_id: undefined,
        search: undefined,
      });
      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.LIST_SUCCESS.status);
    });

    it('should handle filters correctly', async () => {
      const mockResult = {
        users: [],
        totalCount: 0,
        page: 1,
        totalPages: 0,
      };

      jest.spyOn(ShsUserService, 'getUsers').mockResolvedValue(mockResult);

      mockRequest = {
        query: { limit: '20', offset: '10', strand_id: '3', grade_id: '11', search: 'test' },
      };

      await getShsUsers(mockRequest as Request, mockResponse as Response);

      expect(ShsUserService.getUsers).toHaveBeenCalledWith(20, 10, {
        strand_id: 3,
        grade_id: 11,
        search: 'test',
      });
    });

    it('should handle errors', async () => {
      jest.spyOn(ShsUserService, 'getUsers').mockRejectedValue(new Error('Database error'));

      mockRequest = { query: {} };

      await getShsUsers(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR.status);
    });
  });

  describe('getShsUserById', () => {
    it('should return SHS user by id successfully', async () => {
      const mockUser = { 
        id: 1, 
        name: 'Jane Doe', 
        email: 'jane@test.com',
        role: 'student',
        registered_at: new Date('2024-01-01'),
        status: 'active'
      };
      jest.spyOn(ShsUserService, 'getUserById').mockResolvedValue(mockUser);

      mockRequest = { params: { id: '1' } };

      await getShsUserById(mockRequest as Request, mockResponse as Response);

      expect(ShsUserService.getUserById).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.FETCH_SUCCESS.status);
    });

    it('should return error for invalid id', async () => {
      mockRequest = { params: { id: 'invalid' } };

      await getShsUserById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.INVALID_ID.status);
    });

    it('should handle user not found', async () => {
      jest.spyOn(ShsUserService, 'getUserById').mockRejectedValue(new Error('USER_NOT_FOUND'));

      mockRequest = { params: { id: '999' } };

      await getShsUserById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.NOT_FOUND.status);
    });
  });

  describe('createShsUser', () => {
    it('should create SHS user successfully', async () => {
      const mockUser = { 
        id: 1, 
        name: 'Jane Doe', 
        email: 'jane@test.com',
        role: 'student',
        registered_at: new Date('2024-01-01'),
        status: 'active'
      };
      jest.spyOn(ShsUserService, 'createUser').mockResolvedValue(mockUser);

      mockRequest = {
        body: {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@test.com',
          password: 'password123',
          strand_id: 1,
          grade_id: 11,
        },
      };

      await createShsUser(mockRequest as Request, mockResponse as Response);

      expect(ShsUserService.createUser).toHaveBeenCalledWith(mockRequest.body);
      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.CREATE_SUCCESS.status);
    });

    it('should handle duplicate email error', async () => {
      jest.spyOn(ShsUserService, 'createUser').mockRejectedValue(new Error('DUPLICATE_EMAIL'));

      mockRequest = { body: { email: 'existing@test.com' } };

      await createShsUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.DUPLICATE_EMAIL.status);
    });

    it('should handle duplicate student id error', async () => {
      jest.spyOn(ShsUserService, 'createUser').mockRejectedValue(new Error('DUPLICATE_STUDENT_ID'));

      mockRequest = { body: { student_id: '12345' } };

      await createShsUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.DUPLICATE_STUDENT_ID.status);
    });
  });

  describe('updateShsUser', () => {
    it('should update SHS user successfully', async () => {
      const mockUser = { 
        id: 1, 
        name: 'Jane Updated', 
        email: 'jane@test.com',
        role: 'student',
        registered_at: new Date('2024-01-01'),
        status: 'active'
      };
      jest.spyOn(ShsUserService, 'updateUser').mockResolvedValue(mockUser);

      mockRequest = {
        params: { id: '1' },
        body: { first_name: 'Jane Updated' },
      };

      await updateShsUser(mockRequest as Request, mockResponse as Response);

      expect(ShsUserService.updateUser).toHaveBeenCalledWith(1, mockRequest.body);
      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.UPDATE_SUCCESS.status);
    });

    it('should return error for invalid id', async () => {
      mockRequest = { params: { id: 'invalid' }, body: {} };

      await updateShsUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.INVALID_ID.status);
    });

    it('should handle user not found', async () => {
      jest.spyOn(ShsUserService, 'updateUser').mockRejectedValue(new Error('USER_NOT_FOUND'));

      mockRequest = { params: { id: '999' }, body: {} };

      await updateShsUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.NOT_FOUND.status);
    });

    it('should handle duplicate email error', async () => {
      jest.spyOn(ShsUserService, 'updateUser').mockRejectedValue(new Error('DUPLICATE_EMAIL'));

      mockRequest = { params: { id: '1' }, body: { email: 'existing@test.com' } };

      await updateShsUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.DUPLICATE_EMAIL.status);
    });
  });

  describe('deleteShsUser', () => {
    it('should delete SHS user successfully', async () => {
      jest.spyOn(ShsUserService, 'deleteUser').mockResolvedValue(undefined);

      mockRequest = {
        params: { id: '1' },
        user: { userId: 10 },
      } as any;

      await deleteShsUser(mockRequest as Request, mockResponse as Response);

      expect(ShsUserService.deleteUser).toHaveBeenCalledWith(1, 10);
      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.DELETE_SUCCESS.status);
    });

    it('should return error for invalid id', async () => {
      mockRequest = { params: { id: 'invalid' } };

      await deleteShsUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.INVALID_ID.status);
    });

    it('should handle user not found', async () => {
      jest.spyOn(ShsUserService, 'deleteUser').mockRejectedValue(new Error('USER_NOT_FOUND'));

      mockRequest = { params: { id: '999' } };

      await deleteShsUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.NOT_FOUND.status);
    });
  });

  describe('searchShsUsers', () => {
    it('should search SHS users successfully', async () => {
      const mockUsers = [{ 
        id: 1, 
        name: 'Jane Doe', 
        email: 'jane@test.com',
        role: 'student',
        registered_at: new Date('2024-01-01'),
        status: 'active'
      }];
      jest.spyOn(ShsUserService, 'searchUsers').mockResolvedValue(mockUsers);

      mockRequest = { query: { q: 'jane', limit: '10' } };

      await searchShsUsers(mockRequest as Request, mockResponse as Response);

      expect(ShsUserService.searchUsers).toHaveBeenCalledWith('jane', 10);
      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.LIST_SUCCESS.status);
    });

    it('should return error for short query', async () => {
      mockRequest = { query: { q: 'a' } };

      await searchShsUsers(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.GENERAL.BAD_REQUEST.status);
    });

    it('should return error for missing query', async () => {
      mockRequest = { query: {} };

      await searchShsUsers(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.GENERAL.BAD_REQUEST.status);
    });
  });
});

