import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from 'express';
import {
  getFacultyUsers,
  getFacultyUserById,
  createFacultyUser,
  updateFacultyUser,
  deleteFacultyUser,
  searchFacultyUsers,
} from '../controllers/facultyUserController.js';
import { FacultyUserService } from '../services/facultyUserService.js';
import { API_MESSAGES } from '../constants/messages.js';

jest.mock('../services/facultyUserService.js');

describe('Faculty User Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    
    // For easier spying if needed
    statusMock = mockResponse.status as jest.Mock;
    jsonMock = mockResponse.json as jest.Mock;
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getFacultyUsers', () => {
    it('should return faculty users list successfully', async () => {
      const mockResult = {
        users: [{ 
          id: 1, 
          name: 'John Doe', 
          email: 'john@test.com',
          role: 'faculty',
          status: 'active',
          registered_at: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        }],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      };

      jest.spyOn(FacultyUserService, 'getUsers').mockResolvedValue(mockResult);

      mockRequest = {
        query: { limit: '10', offset: '0' },
      };

      await getFacultyUsers(mockRequest as Request, mockResponse as Response);

      expect(FacultyUserService.getUsers).toHaveBeenCalledWith(10, 0, {
        department_id: undefined,
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

      jest.spyOn(FacultyUserService, 'getUsers').mockResolvedValue(mockResult);

      mockRequest = {
        query: { limit: '20', offset: '10', department_id: '5', search: 'test' },
      };

      await getFacultyUsers(mockRequest as Request, mockResponse as Response);

      expect(FacultyUserService.getUsers).toHaveBeenCalledWith(20, 10, {
        department_id: 5,
        search: 'test',
      });
    });

    it('should handle errors', async () => {
      jest.spyOn(FacultyUserService, 'getUsers').mockRejectedValue(new Error('Database error'));

      mockRequest = { query: {} };

      await getFacultyUsers(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR.status);
    });
  });

  describe('getFacultyUserById', () => {
    it('should return faculty user by id successfully', async () => {
      const mockUser = { 
        id: 1, 
        name: 'John Doe', 
        email: 'john@test.com',
        role: 'faculty',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };
      jest.spyOn(FacultyUserService, 'getUserById').mockResolvedValue(mockUser);

      mockRequest = { params: { id: '1' } };

      await getFacultyUserById(mockRequest as Request, mockResponse as Response);

      expect(FacultyUserService.getUserById).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.FETCH_SUCCESS.status);
    });

    it('should return error for invalid id', async () => {
      mockRequest = { params: { id: 'invalid' } };

      await getFacultyUserById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.INVALID_ID.status);
    });

    it('should handle user not found', async () => {
      jest.spyOn(FacultyUserService, 'getUserById').mockRejectedValue(new Error('USER_NOT_FOUND'));

      mockRequest = { params: { id: '999' } };

      await getFacultyUserById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.NOT_FOUND.status);
    });
  });

  describe('createFacultyUser', () => {
    it('should create faculty user successfully', async () => {
      const mockUser = { 
        id: 1, 
        name: 'John Doe', 
        email: 'john@test.com',
        role: 'faculty',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };
      jest.spyOn(FacultyUserService, 'createUser').mockResolvedValue(mockUser);

      mockRequest = {
        body: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@test.com',
          password: 'password123',
        },
      };

      await createFacultyUser(mockRequest as Request, mockResponse as Response);

      expect(FacultyUserService.createUser).toHaveBeenCalledWith(mockRequest.body);
      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.CREATE_SUCCESS.status);
    });

    it('should handle duplicate email error', async () => {
      jest.spyOn(FacultyUserService, 'createUser').mockRejectedValue(new Error('DUPLICATE_EMAIL'));

      mockRequest = { body: { email: 'existing@test.com' } };

      await createFacultyUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.DUPLICATE_EMAIL.status);
    });
  });

  describe('updateFacultyUser', () => {
    it('should update faculty user successfully', async () => {
      const mockUser = { 
        id: 1, 
        name: 'John Updated', 
        email: 'john@test.com',
        role: 'faculty',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };
      jest.spyOn(FacultyUserService, 'updateUser').mockResolvedValue(mockUser);

      mockRequest = {
        params: { id: '1' },
        body: { first_name: 'John Updated' },
      };

      await updateFacultyUser(mockRequest as Request, mockResponse as Response);

      expect(FacultyUserService.updateUser).toHaveBeenCalledWith(1, mockRequest.body);
      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.UPDATE_SUCCESS.status);
    });

    it('should return error for invalid id', async () => {
      mockRequest = { params: { id: 'invalid' }, body: {} };

      await updateFacultyUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.INVALID_ID.status);
    });

    it('should handle user not found', async () => {
      jest.spyOn(FacultyUserService, 'updateUser').mockRejectedValue(new Error('USER_NOT_FOUND'));

      mockRequest = { params: { id: '999' }, body: {} };

      await updateFacultyUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.NOT_FOUND.status);
    });

    it('should handle duplicate email error', async () => {
      jest.spyOn(FacultyUserService, 'updateUser').mockRejectedValue(new Error('DUPLICATE_EMAIL'));

      mockRequest = { params: { id: '1' }, body: { email: 'existing@test.com' } };

      await updateFacultyUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.DUPLICATE_EMAIL.status);
    });
  });

  describe('deleteFacultyUser', () => {
    it('should delete faculty user successfully', async () => {
      jest.spyOn(FacultyUserService, 'deleteUser').mockResolvedValue(undefined);

      mockRequest = {
        params: { id: '1' },
        user: { userId: 10 },
      } as any;

      await deleteFacultyUser(mockRequest as Request, mockResponse as Response);

      expect(FacultyUserService.deleteUser).toHaveBeenCalledWith(1, 10);
      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.DELETE_SUCCESS.status);
    });

    it('should return error for invalid id', async () => {
      mockRequest = { params: { id: 'invalid' } };

      await deleteFacultyUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.INVALID_ID.status);
    });

    it('should handle user not found', async () => {
      jest.spyOn(FacultyUserService, 'deleteUser').mockRejectedValue(new Error('USER_NOT_FOUND'));

      mockRequest = { params: { id: '999' } };

      await deleteFacultyUser(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.NOT_FOUND.status);
    });
  });

  describe('searchFacultyUsers', () => {
    it('should search faculty users successfully', async () => {
      const mockUsers = [{ 
        id: 1, 
        name: 'John Doe', 
        email: 'john@test.com',
        role: 'faculty',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      }];
      jest.spyOn(FacultyUserService, 'searchUsers').mockResolvedValue(mockUsers);

      mockRequest = { query: { q: 'john', limit: '10' } };

      await searchFacultyUsers(mockRequest as Request, mockResponse as Response);

      expect(FacultyUserService.searchUsers).toHaveBeenCalledWith('john', 10);
      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.USER.LIST_SUCCESS.status);
    });

    it('should return error for short query', async () => {
      mockRequest = { query: { q: 'a' } };

      await searchFacultyUsers(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.GENERAL.BAD_REQUEST.status);
    });

    it('should return error for missing query', async () => {
      mockRequest = { query: {} };

      await searchFacultyUsers(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(API_MESSAGES.GENERAL.BAD_REQUEST.status);
    });
  });
});

