import { describe, it, expect, jest, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import * as GuestController from '../controllers/guestController.js';
import { GuestService } from '../services/guestService.js';
import { API_MESSAGES } from '../constants/messages.js';

const app = express();
app.use(express.json());

// Routes
app.get('/api/guests', GuestController.getGuests);
app.get('/api/guests/search', GuestController.searchGuests);
app.get('/api/guests/today', GuestController.getTodayGuests);
app.get('/api/guests/:id', GuestController.getGuestById);
app.post('/api/guests', GuestController.createGuest);
app.put('/api/guests/:id', GuestController.updateGuest);
app.delete('/api/guests/:id', GuestController.deleteGuest);

jest.mock('../services/guestService.js');

describe('GuestController - API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/guests', () => {
    it('should return list of guests', async () => {
      const mockResult = {
        guests: [
          { 
            id: 1, 
            name: 'John Visitor', 
            purpose: 'Meeting', 
            visit_date: new Date('2024-01-15'),
            created_at: new Date(),
            status: 'active'
          }
        ],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      };

      jest.spyOn(GuestService, 'getGuests').mockResolvedValue(mockResult);

      const res = await request(app).get('/api/guests');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockResult)));
      expect(res.body.message).toBe(API_MESSAGES.GUEST.LIST_SUCCESS.message);
    });

    it('should apply filters', async () => {
      const mockResult = { guests: [], totalCount: 0, page: 1, totalPages: 0 };
      jest.spyOn(GuestService, 'getGuests').mockResolvedValue(mockResult);

      await request(app).get('/api/guests?visit_date=2024-01-15&search=john');

      expect(GuestService.getGuests).toHaveBeenCalledWith(
        10,
        0,
        expect.objectContaining({ visit_date: '2024-01-15', search: 'john' })
      );
    });
  });

  describe('GET /api/guests/:id', () => {
    it('should return guest by id', async () => {
      const mockGuest = { 
        id: 1, 
        name: 'John Visitor', 
        purpose: 'Meeting',
        visit_date: new Date(),
        created_at: new Date(),
        status: 'active'
      };
      jest.spyOn(GuestService, 'getGuestById').mockResolvedValue(mockGuest);

      const res = await request(app).get('/api/guests/1');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockGuest)));
    });

    it('should return 400 for invalid id', async () => {
      const res = await request(app).get('/api/guests/invalid');
      expect(res.status).toBe(400);
    });

    it('should return 404 if guest not found', async () => {
      jest.spyOn(GuestService, 'getGuestById').mockRejectedValue(new Error('GUEST_NOT_FOUND'));

      const res = await request(app).get('/api/guests/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/guests', () => {
    it('should create a new guest', async () => {
      const mockGuest = { 
        id: 1, 
        name: 'John Visitor', 
        purpose: 'Meeting',
        visit_date: new Date(),
        created_at: new Date(),
        status: 'active'
      };
      jest.spyOn(GuestService, 'createGuest').mockResolvedValue(mockGuest);

      const res = await request(app)
        .post('/api/guests')
        .send({ name: 'John Visitor', purpose: 'Meeting', visit_date: '2024-01-15' });

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockGuest)));
      expect(res.body.message).toBe(API_MESSAGES.GUEST.CREATE_SUCCESS.message);
    });
  });

  describe('PUT /api/guests/:id', () => {
    it('should update guest successfully', async () => {
      const mockGuest = { 
        id: 1, 
        name: 'John Updated', 
        purpose: 'Interview',
        visit_date: new Date(),
        created_at: new Date(),
        status: 'active'
      };
      jest.spyOn(GuestService, 'updateGuest').mockResolvedValue(mockGuest);

      const res = await request(app).put('/api/guests/1').send({ purpose: 'Interview' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockGuest)));
    });

    it('should return 400 for invalid id', async () => {
      const res = await request(app).put('/api/guests/invalid').send({ purpose: 'Interview' });
      expect(res.status).toBe(400);
    });

    it('should return 404 if guest not found', async () => {
      jest.spyOn(GuestService, 'updateGuest').mockRejectedValue(new Error('GUEST_NOT_FOUND'));

      const res = await request(app).put('/api/guests/999').send({ purpose: 'Interview' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/guests/:id', () => {
    it('should delete guest successfully', async () => {
      jest.spyOn(GuestService, 'deleteGuest').mockResolvedValue(undefined);

      const res = await request(app).delete('/api/guests/1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(API_MESSAGES.GUEST.DELETE_SUCCESS.message);
    });

    it('should return 400 for invalid id', async () => {
      const res = await request(app).delete('/api/guests/invalid');
      expect(res.status).toBe(400);
    });

    it('should return 404 if guest not found', async () => {
      jest.spyOn(GuestService, 'deleteGuest').mockRejectedValue(new Error('GUEST_NOT_FOUND'));

      const res = await request(app).delete('/api/guests/999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/guests/search', () => {
    it('should search guests successfully', async () => {
      const mockGuests = [
        { 
          id: 1, 
          name: 'John Visitor', 
          purpose: 'Meeting',
          visit_date: new Date(),
          created_at: new Date(),
          status: 'active'
        }
      ];
      jest.spyOn(GuestService, 'searchGuests').mockResolvedValue(mockGuests);

      const res = await request(app).get('/api/guests/search?q=john&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockGuests)));
    });

    it('should return 400 for short query', async () => {
      const res = await request(app).get('/api/guests/search?q=j');
      expect(res.status).toBe(400);
    });

    it('should return 400 for missing query', async () => {
      const res = await request(app).get('/api/guests/search');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/guests/today', () => {
    it('should return today guests', async () => {
      const mockGuests = [
        { 
          id: 1, 
          name: 'John Visitor', 
          purpose: 'Meeting',
          visit_date: new Date('2024-01-15'),
          created_at: new Date(),
          status: 'active'
        }
      ];
      jest.spyOn(GuestService, 'getTodayGuests').mockResolvedValue(mockGuests);

      const res = await request(app).get('/api/guests/today');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockGuests)));
    });
  });
});

