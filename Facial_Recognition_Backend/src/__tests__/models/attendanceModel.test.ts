import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AttendanceModel } from '../../models/attendanceModel.js';
import * as db from '../../db/index.js';

describe('AttendanceModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create attendance record', async () => {
      const mockAttendance = { id: 1, user_id: 1, attendance_type: 'time-in' };

      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockAttendance] } as any);

      const data = { user_id: 1, user_type: 'college' as const, name: 'John Doe', attendance_type: 'time-in' as const };
      const result = await AttendanceModel.create(data);

      expect(result).toEqual(mockAttendance);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO attendance'),
        expect.arrayContaining([1, 'college', 'John Doe', 'time-in'])
      );
    });
  });

  describe('findById', () => {
    it('should return attendance by id', async () => {
      const mockAttendance = { id: 1, user_id: 1 };

      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockAttendance] } as any);

      const result = await AttendanceModel.findById(1);

      expect(result).toEqual(mockAttendance);
    });

    it('should return null if not found', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      const result = await AttendanceModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return paginated attendance', async () => {
      const mockAttendance = [{ id: 1 }, { id: 2 }];

      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockAttendance } as any);

      const result = await AttendanceModel.getAll(10, 0);

      expect(result).toEqual(mockAttendance);
    });

    it('should apply filters', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      const filters = { user_id: 1, user_type: 'college', date: '2024-01-15' };
      await AttendanceModel.getAll(10, 0, filters);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('user_id'),
        expect.arrayContaining([1, 'college', '2024-01-15%'])
      );
    });
  });

  describe('getTotalCount', () => {
    it('should return total count', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [{ count: '10' }] } as any);

      const result = await AttendanceModel.getTotalCount();

      expect(result).toBe(10);
    });
  });

  describe('getTodayAttendance', () => {
    it('should return today attendance', async () => {
      const mockAttendance = [{ id: 1 }];

      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockAttendance } as any);

      const result = await AttendanceModel.getTodayAttendance();

      expect(result).toEqual(mockAttendance);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('CURRENT_DATE'));
    });
  });

  describe('getUserAttendanceHistory', () => {
    it('should return user attendance history', async () => {
      const mockHistory = [{ id: 1, user_id: 1 }];

      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockHistory } as any);

      const result = await AttendanceModel.getUserAttendanceHistory(1, 'college', 30);

      expect(result).toEqual(mockHistory);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 'college', 30]);
    });
  });

  describe('getAttendanceByDateRange', () => {
    it('should return attendance by date range', async () => {
      const mockAttendance = [{ id: 1 }];

      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockAttendance } as any);

      const result = await AttendanceModel.getAttendanceByDateRange('2024-01-01', '2024-01-31');

      expect(result).toEqual(mockAttendance);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('BETWEEN'),
        ['2024-01-01', '2024-01-31']
      );
    });
  });
});



