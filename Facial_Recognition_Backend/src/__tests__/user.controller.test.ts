import { describe, it, expect, jest, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import * as UserController from '../controllers/userController.js';
import { UserService } from '../services/userService.js';
import { API_MESSAGES } from '../constants/messages.js';

const app = express();
app.use(express.json());

// Routes
app.get('/api/users', UserController.getUsers);
app.get('/api/users/search', UserController.searchUsers);
app.get('/api/users/:id', UserController.getUserById);
app.post('/api/users', UserController.createUser);
app.put('/api/users/:id', UserController.updateUser);
app.delete('/api/users/:id', UserController.deleteUser);

jest.mock('../services/userService.js');

describe('UserController - API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return paginated users list', async () => {
      const mockResult = {
        users: [
          { 
            id: 1, 
            name: 'John Doe', 
            email: 'john@example.com', 
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
            role: 'student',
            status: 'active',
            registered_at: new Date('2024-01-01'),
            created_at: new Date('2024-01-01'),
            updated_at: new Date('2024-01-01')
          },
        ],
        totalCount: 2,
        page: 1,
        totalPages: 1,
      };

      jest.spyOn(UserService, 'getUsers').mockResolvedValue(mockResult);

      const res = await request(app).get('/api/users?limit=10&offset=0');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockResult)));
      expect(res.body.message).toBe(API_MESSAGES.USER.LIST_SUCCESS.message);
    });

    it('should apply filters when provided', async () => {
      const mockResult = {
        users: [{ 
          id: 1, 
          name: 'John Doe', 
          email: 'john@example.com',
          role: 'student',
          status: 'active',
          registered_at: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        }],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      };

      jest.spyOn(UserService, 'getUsers').mockResolvedValue(mockResult);

      const res = await request(app).get('/api/users?course_id=1&year_id=2&search=john');

      expect(res.status).toBe(200);
      expect(UserService.getUsers).toHaveBeenCalledWith(
        10,
        0,
        expect.objectContaining({
          course_id: 1,
          year_id: 2,
          search: 'john',
        })
      );
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };

      jest.spyOn(UserService, 'getUserById').mockResolvedValue(mockUser);

      const res = await request(app).get('/api/users/1');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockUser)));
      expect(res.body.message).toBe(API_MESSAGES.USER.FETCH_SUCCESS.message);
    });

    it('should return 400 for invalid id', async () => {
      const res = await request(app).get('/api/users/invalid');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(API_MESSAGES.USER.INVALID_ID.message);
    });

    it('should return 404 if user not found', async () => {
      jest.spyOn(UserService, 'getUserById').mockRejectedValue(new Error('USER_NOT_FOUND'));

      const res = await request(app).get('/api/users/999');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(API_MESSAGES.USER.NOT_FOUND.message);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };

      jest.spyOn(UserService, 'createUser').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/users')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          student_id: '2024-001',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockUser)));
      expect(res.body.message).toBe(API_MESSAGES.USER.CREATE_SUCCESS.message);
    });

    it('should return 409 for duplicate email', async () => {
      jest.spyOn(UserService, 'createUser').mockRejectedValue(new Error('DUPLICATE_EMAIL'));

      const res = await request(app)
        .post('/api/users')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: 'existing@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe(API_MESSAGES.USER.DUPLICATE_EMAIL.message);
    });

    it('should return 409 for duplicate student ID', async () => {
      jest.spyOn(UserService, 'createUser').mockRejectedValue(new Error('DUPLICATE_STUDENT_ID'));

      const res = await request(app)
        .post('/api/users')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          student_id: '2024-001',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe(API_MESSAGES.USER.DUPLICATE_STUDENT_ID.message);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'John Updated',
        email: 'john.updated@example.com',
        role: 'student',
        status: 'active',
        registered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      };

      jest.spyOn(UserService, 'updateUser').mockResolvedValue(mockUser);

      const res = await request(app)
        .put('/api/users/1')
        .send({
          first_name: 'John',
          last_name: 'Updated',
          email: 'john.updated@example.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockUser)));
      expect(res.body.message).toBe(API_MESSAGES.USER.UPDATE_SUCCESS.message);
    });

    it('should return 400 for invalid id', async () => {
      const res = await request(app)
        .put('/api/users/invalid')
        .send({ first_name: 'John' });

      expect(res.status).toBe(400);
    });

    it('should return 404 if user not found', async () => {
      jest.spyOn(UserService, 'updateUser').mockRejectedValue(new Error('USER_NOT_FOUND'));

      const res = await request(app)
        .put('/api/users/999')
        .send({ first_name: 'John' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      jest.spyOn(UserService, 'deleteUser').mockResolvedValue(undefined);

      const mockUserApp = express();
      mockUserApp.use(express.json());
      mockUserApp.use((req, res, next) => {
        (req as any).user = { userId: 1 };
        next();
      });
      mockUserApp.delete('/api/users/:id', UserController.deleteUser);

      const res = await request(mockUserApp).delete('/api/users/1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(API_MESSAGES.USER.DELETE_SUCCESS.message);
    });

    it('should return 404 if user not found', async () => {
      jest.spyOn(UserService, 'deleteUser').mockRejectedValue(new Error('USER_NOT_FOUND'));

      const res = await request(app).delete('/api/users/999');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/users/search', () => {
    it('should search users successfully', async () => {
      const mockUsers = [
        { 
          id: 1, 
          name: 'John Doe', 
          email: 'john@example.com',
          role: 'student',
          status: 'active',
          registered_at: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        { 
          id: 2, 
          name: 'Johnny Smith', 
          email: 'johnny@example.com',
          role: 'student',
          status: 'active',
          registered_at: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
      ];

      jest.spyOn(UserService, 'searchUsers').mockResolvedValue(mockUsers);

      const res = await request(app).get('/api/users/search?q=john&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockUsers)));
    });

    it('should return 400 for short query', async () => {
      const res = await request(app).get('/api/users/search?q=j');

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing query', async () => {
      const res = await request(app).get('/api/users/search');

      expect(res.status).toBe(400);
    });
  });
});

