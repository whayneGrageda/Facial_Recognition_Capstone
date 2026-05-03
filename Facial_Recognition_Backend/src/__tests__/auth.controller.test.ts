import { describe, it, expect, jest, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import * as AuthController from '../controllers/authController.js';
import { AuthService } from '../services/authService.js';
import { API_MESSAGES } from '../constants/messages.js';

const app = express();
app.use(express.json());

// Routes
app.post('/api/auth/login', AuthController.login);
app.post('/api/auth/logout', AuthController.logout);
app.get('/api/auth/verify', AuthController.verifyToken);
app.get('/api/auth/profile', AuthController.getProfile);

jest.mock('../services/authService.js');

describe('AuthController - API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 on successful login with email', async () => {
      const mockResult = {
        token: 'mock-jwt-token',
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'student',
          userType: 'college',
        },
      };
      
      jest.spyOn(AuthService, 'login').mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'password123', userType: 'college' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockResult);
      expect(res.body.message).toBe(API_MESSAGES.AUTH.LOGIN_SUCCESS.message);
    });

    it('should return 200 on successful admin login with username', async () => {
      const mockResult = {
        token: 'mock-jwt-token',
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          userType: 'admin',
        },
      };
      
      jest.spyOn(AuthService, 'login').mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockResult);
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(API_MESSAGES.GENERAL.BAD_REQUEST.message);
    });

    it('should return 400 if both username and email are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should return 401 on invalid credentials', async () => {
      jest.spyOn(AuthService, 'login').mockRejectedValue(new Error('INVALID_CREDENTIALS'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe(API_MESSAGES.AUTH.LOGIN_FAILED.message);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 on successful logout', async () => {
      jest.spyOn(AuthService, 'logout').mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(API_MESSAGES.AUTH.LOGOUT_SUCCESS.message);
      expect(AuthService.logout).toHaveBeenCalledWith('mock-token');
    });

    it('should return 200 even without token', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should return 200 with decoded token on valid token', async () => {
      const mockDecoded = {
        userId: 1,
        email: 'john@example.com',
        role: 'student',
        userType: 'college',
      };
      
      jest.spyOn(AuthService, 'verifyToken').mockResolvedValue(mockDecoded);

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockDecoded);
    });

    it('should return 401 if token is missing', async () => {
      const res = await request(app).get('/api/auth/verify');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe(API_MESSAGES.AUTH.TOKEN_INVALID.message);
    });

    it('should return 401 on invalid token', async () => {
      jest.spyOn(AuthService, 'verifyToken').mockRejectedValue(new Error('INVALID_TOKEN'));

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile from request', async () => {
      const mockUser = {
        userId: 1,
        email: 'john@example.com',
        role: 'student',
      };

      const profileApp = express();
      profileApp.use(express.json());
      profileApp.use((req, res, next) => {
        (req as any).user = mockUser;
        next();
      });
      profileApp.get('/api/auth/profile', AuthController.getProfile);

      const res = await request(profileApp).get('/api/auth/profile');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockUser);
    });
  });
});

