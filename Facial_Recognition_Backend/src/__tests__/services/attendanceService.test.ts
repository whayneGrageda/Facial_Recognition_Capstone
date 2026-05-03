import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AttendanceService } from '../../services/attendanceService.js';
import { AttendanceModel } from '../../models/attendanceModel.js';

jest.mock('../../models/attendanceModel.js');

describe('AttendanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordAttendance', () => {
    it('should record attendance successfully', async () => {
      const mockAttendance = {
        id: 1,
        user_id: 1,
        user_type: 'college',
        name: 'John Doe',
        attendance_type: 'time-in',
      };

      jest.spyOn(AttendanceModel, 'create').mockResolvedValue(mockAttendance as any);

      const data = {
        user_id: 1,
        user_type: 'college' as const,
        name: 'John Doe',
        attendance_type: 'time-in' as const,
      };

      const result = await AttendanceService.recordAttendance(data);

      expect(result).toEqual(mockAttendance);
      expect(AttendanceModel.create).toHaveBeenCalledWith(data);
    });
  });

  describe('getAttendance', () => {
    it('should return paginated attendance', async () => {
      const mockAttendance = [{ id: 1, user_id: 1, name: 'John Doe' }];

      jest.spyOn(AttendanceModel, 'getAll').mockResolvedValue(mockAttendance as any);
      jest.spyOn(AttendanceModel, 'getTotalCount').mockResolvedValue(1);

      const result = await AttendanceService.getAttendance(10, 0);

      expect(result.attendance).toEqual(mockAttendance);
      expect(result.totalCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply filters', async () => {
      jest.spyOn(AttendanceModel, 'getAll').mockResolvedValue([]);
      jest.spyOn(AttendanceModel, 'getTotalCount').mockResolvedValue(0);

      const filters = { user_id: 1, user_type: 'college' };
      await AttendanceService.getAttendance(10, 0, filters);

      expect(AttendanceModel.getAll).toHaveBeenCalledWith(10, 0, filters);
      expect(AttendanceModel.getTotalCount).toHaveBeenCalledWith(filters);
    });
  });

  describe('getAttendanceById', () => {
    it('should return attendance by id', async () => {
      const mockAttendance = { id: 1, user_id: 1, name: 'John Doe' };

      jest.spyOn(AttendanceModel, 'findById').mockResolvedValue(mockAttendance as any);

      const result = await AttendanceService.getAttendanceById(1);

      expect(result).toEqual(mockAttendance);
    });

    it('should throw error if not found', async () => {
      jest.spyOn(AttendanceModel, 'findById').mockResolvedValue(null);

      await expect(AttendanceService.getAttendanceById(999)).rejects.toThrow(
        'ATTENDANCE_NOT_FOUND'
      );
    });
  });

  describe('getTodayAttendance', () => {
    it('should return today attendance', async () => {
      const mockAttendance = [{ id: 1, user_id: 1, name: 'John Doe' }];

      jest.spyOn(AttendanceModel, 'getTodayAttendance').mockResolvedValue(mockAttendance as any);

      const result = await AttendanceService.getTodayAttendance();

      expect(result).toEqual(mockAttendance);
    });
  });

  describe('getUserAttendanceHistory', () => {
    it('should return user attendance history', async () => {
      const mockHistory = [{ id: 1, user_id: 1, name: 'John Doe' }];

      jest.spyOn(AttendanceModel, 'getUserAttendanceHistory').mockResolvedValue(mockHistory as any);

      const result = await AttendanceService.getUserAttendanceHistory(1, 'college', 30);

      expect(result).toEqual(mockHistory);
      expect(AttendanceModel.getUserAttendanceHistory).toHaveBeenCalledWith(1, 'college', 30);
    });
  });

  describe('getAttendanceByDateRange', () => {
    it('should return attendance by date range', async () => {
      const mockAttendance = [{ id: 1, user_id: 1 }];

      jest.spyOn(AttendanceModel, 'getAttendanceByDateRange').mockResolvedValue(
        mockAttendance as any
      );

      const result = await AttendanceService.getAttendanceByDateRange('2024-01-01', '2024-01-31');

      expect(result).toEqual(mockAttendance);
      expect(AttendanceModel.getAttendanceByDateRange).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31'
      );
    });
  });

  describe('getAttendanceStats', () => {
    it('should calculate attendance stats', async () => {
      const mockAttendance = [
        { id: 1, attendance_type: 'time-in', user_type: 'college' },
        { id: 2, attendance_type: 'time-out', user_type: 'shs' },
        { id: 3, attendance_type: 'time-in', user_type: 'faculty' },
      ];

      jest.spyOn(AttendanceModel, 'getAll').mockResolvedValue(mockAttendance as any);

      const result = await AttendanceService.getAttendanceStats('2024-01-15');

      expect(result.total).toBe(3);
      expect(result.timeIn).toBe(2);
      expect(result.timeOut).toBe(1);
      expect(result.byUserType.college).toBe(1);
      expect(result.byUserType.shs).toBe(1);
      expect(result.byUserType.faculty).toBe(1);
    });
  });
});


