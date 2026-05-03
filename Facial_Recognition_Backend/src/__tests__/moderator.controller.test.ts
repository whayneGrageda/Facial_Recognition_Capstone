import { describe, it, expect, jest, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import * as ModeratorController from '../controllers/moderatorController.js';
import { ModeratorService } from '../services/moderatorService.js';
import { API_MESSAGES } from '../constants/messages.js';

const app = express();
app.use(express.json());

// Routes
app.get('/api/moderators', ModeratorController.getModerators);
app.get('/api/moderators/:id', ModeratorController.getModeratorById);
app.post('/api/moderators', ModeratorController.createModerator);
app.put('/api/moderators/:id', ModeratorController.updateModerator);
app.delete('/api/moderators/:id', ModeratorController.deleteModerator);

jest.mock('../services/moderatorService.js');

describe('ModeratorController - API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/moderators', () => {
    it('should return list of moderators', async () => {
      const mockResult = {
        moderators: [
          { 
            id: 1, 
            username: 'mod1', 
            email: 'mod1@example.com', 
            role: 'moderator',
            status: 'active',
            created_at: new Date('2024-01-01')
          },
          { 
            id: 2, 
            username: 'mod2', 
            email: 'mod2@example.com', 
            role: 'moderator',
            status: 'active',
            created_at: new Date('2024-01-01')
          },
        ],
        totalCount: 2,
        page: 1,
        totalPages: 1,
      };

      jest.spyOn(ModeratorService, 'getModerators').mockResolvedValue(mockResult);

      const res = await request(app).get('/api/moderators');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockResult)));
      expect(res.body.message).toBe(API_MESSAGES.MODERATOR.LIST_SUCCESS.message);
    });
  });

  describe('GET /api/moderators/:id', () => {
    it('should return moderator by id', async () => {
      const mockModerator = {
        id: 1,
        username: 'mod1',
        email: 'mod1@example.com',
        role: 'moderator',
        status: 'active',
        created_at: new Date('2024-01-01')
      };

      jest.spyOn(ModeratorService, 'getModeratorById').mockResolvedValue(mockModerator);

      const res = await request(app).get('/api/moderators/1');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockModerator)));
    });

    it('should return 404 if moderator not found', async () => {
      jest.spyOn(ModeratorService, 'getModeratorById').mockRejectedValue(
        new Error('MODERATOR_NOT_FOUND')
      );

      const res = await request(app).get('/api/moderators/999');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/moderators', () => {
    it('should create a new moderator', async () => {
      const mockModerator = {
        id: 1,
        username: 'newmod',
        email: 'newmod@example.com',
        role: 'moderator',
        status: 'active',
        created_at: new Date('2024-01-01')
      };

      jest.spyOn(ModeratorService, 'createModerator').mockResolvedValue(mockModerator);

      const res = await request(app)
        .post('/api/moderators')
        .send({
          username: 'newmod',
          email: 'newmod@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockModerator)));
      expect(res.body.message).toBe(API_MESSAGES.MODERATOR.CREATE_SUCCESS.message);
    });
  });

  describe('PUT /api/moderators/:id', () => {
    it('should update moderator successfully', async () => {
      const mockModerator = {
        id: 1,
        username: 'updatedmod',
        email: 'updated@example.com',
        role: 'moderator',
        status: 'active',
        created_at: new Date('2024-01-01')
      };

      jest.spyOn(ModeratorService, 'updateModerator').mockResolvedValue(mockModerator);

      const res = await request(app)
        .put('/api/moderators/1')
        .send({ username: 'updatedmod' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockModerator)));
    });
  });

  describe('DELETE /api/moderators/:id', () => {
    it('should delete moderator successfully', async () => {
      jest.spyOn(ModeratorService, 'deleteModerator').mockResolvedValue(undefined);

      const res = await request(app).delete('/api/moderators/1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(API_MESSAGES.MODERATOR.DELETE_SUCCESS.message);
    });
  });
});

