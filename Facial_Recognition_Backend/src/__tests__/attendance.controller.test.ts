import { describe, it, expect, jest, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import * as AttendanceController from '../controllers/attendanceController.js';
import { AttendanceService } from '../services/attendanceService.js';
import { API_MESSAGES } from '../constants/messages.js';

const app = express();
app.use(express.json());

// Routes
app.post('/api/attendance', AttendanceController.recordAttendance);
app.get('/api/attendance', AttendanceController.getAttendance);
app.get('/api/attendance/today', AttendanceController.getTodayAttendance);
app.get('/api/attendance/stats', AttendanceController.getAttendanceStats);
app.get('/api/attendance/date-range', AttendanceController.getAttendanceByDateRange);
app.get('/api/attendance/user/:userId', AttendanceController.getUserAttendanceHistory);
app.get('/api/attendance/:id', AttendanceController.getAttendanceById);

jest.mock('../services/attendanceService.js');

describe('AttendanceController - API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/attendance', () => {
    it('should record attendance successfully', async () => {
      const mockRecord = {
        id: 1,
        user_id: 1,
        user_type: 'college' as const,
        name: 'John Doe',
        attendance_type: 'time-in' as const,
        timestamp: new Date()
      };

      jest.spyOn(AttendanceService, 'recordAttendance').mockResolvedValue(mockRecord);

      const res = await request(app)
        .post('/api/attendance')
        .send({
          user_id: 1,
          user_type: 'college',
          name: 'John Doe',
          attendance_type: 'time-in' as const,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockRecord)));
      expect(res.body.message).toBe(API_MESSAGES.ATTENDANCE.RECORD_SUCCESS.message);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app).post('/api/attendance').send({ user_id: 1 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/attendance', () => {
    it('should return paginated attendance records', async () => {
      const mockResult = {
        attendance: [
          { 
            id: 1, 
            user_id: 1, 
            user_type: 'college' as const,
            name: 'John Doe', 
            attendance_type: 'time-in' as const,
            timestamp: new Date()
          }
        ],
        totalCount: 1,
        page: 1,
        totalPages: 1,
      };

      jest.spyOn(AttendanceService, 'getAttendance').mockResolvedValue(mockResult);

      const res = await request(app).get('/api/attendance?limit=10&offset=0');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockResult)));
    });

    it('should apply filters', async () => {
      const mockResult = { attendance: [], totalCount: 0, page: 1, totalPages: 0 };
      jest.spyOn(AttendanceService, 'getAttendance').mockResolvedValue(mockResult);

      await request(app).get('/api/attendance?user_id=1&user_type=college&date=2024-01-15');

      expect(AttendanceService.getAttendance).toHaveBeenCalledWith(
        10,
        0,
        expect.objectContaining({ user_id: 1, user_type: 'college', date: '2024-01-15' })
      );
    });
  });

  describe('GET /api/attendance/:id', () => {
    it('should return attendance record by id', async () => {
      const mockRecord = { 
        id: 1, 
        user_id: 1, 
        user_type: 'college' as const,
        name: 'John Doe', 
        attendance_type: 'time-in' as const,
        timestamp: new Date()
      };
      jest.spyOn(AttendanceService, 'getAttendanceById').mockResolvedValue(mockRecord);

      const res = await request(app).get('/api/attendance/1');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockRecord)));
    });

    it('should return 400 for invalid id', async () => {
      const res = await request(app).get('/api/attendance/invalid');
      expect(res.status).toBe(400);
    });

    it('should return 404 if record not found', async () => {
      jest.spyOn(AttendanceService, 'getAttendanceById').mockRejectedValue(
        new Error('ATTENDANCE_NOT_FOUND')
      );

      const res = await request(app).get('/api/attendance/999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/attendance/today', () => {
    it('should return today attendance', async () => {
      const mockAttendance = [
        { 
          id: 1, 
          user_id: 1, 
          user_type: 'college' as const,
          name: 'John Doe', 
          attendance_type: 'time-in' as const,
          timestamp: new Date()
        }
      ];
      jest.spyOn(AttendanceService, 'getTodayAttendance').mockResolvedValue(mockAttendance);

      const res = await request(app).get('/api/attendance/today');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockAttendance)));
    });
  });

  describe('GET /api/attendance/user/:userId', () => {
    it('should return user attendance history', async () => {
      const mockHistory = [
        { 
          id: 1, 
          user_id: 1, 
          user_type: 'college' as const,
          name: 'John Doe', 
          attendance_type: 'time-in' as const,
          timestamp: new Date()
        }
      ];
      jest.spyOn(AttendanceService, 'getUserAttendanceHistory').mockResolvedValue(mockHistory);

      const res = await request(app).get('/api/attendance/user/1?userType=college&limit=30');

      expect(res.status).toBe(200);
      expect(AttendanceService.getUserAttendanceHistory).toHaveBeenCalledWith(1, 'college', 30);
    });

    it('should return 400 for invalid userId', async () => {
      const res = await request(app).get('/api/attendance/user/invalid');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/attendance/date-range', () => {
    it('should return attendance by date range', async () => {
      const mockAttendance = [
        { 
          id: 1, 
          user_id: 1, 
          user_type: 'college' as const,
          name: 'John Doe', 
          attendance_type: 'time-in' as const,
          timestamp: new Date()
        }
      ];
      jest.spyOn(AttendanceService, 'getAttendanceByDateRange').mockResolvedValue(mockAttendance);

      const res = await request(app).get(
        '/api/attendance/date-range?start_date=2024-01-01&end_date=2024-01-31'
      );

      expect(res.status).toBe(200);
      expect(AttendanceService.getAttendanceByDateRange).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31'
      );
    });

    it('should return 400 if dates missing', async () => {
      const res = await request(app).get('/api/attendance/date-range');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/attendance/stats', () => {
    it('should return attendance stats', async () => {
      const mockStats = { 
        total: 10, 
        timeIn: 5, 
        timeOut: 5,
        byUserType: {
          college: 2,
          shs: 3,
          faculty: 4,
          guest: 1
        }
      };
      jest.spyOn(AttendanceService, 'getAttendanceStats').mockResolvedValue(mockStats);

      const res = await request(app).get('/api/attendance/stats?date=2024-01-15');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(JSON.parse(JSON.stringify(mockStats)));
    });
  });
});

