import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { MetadataModel } from '../../models/metadataModel.js';
import * as db from '../../db/index.js';

describe('Metadata Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAllCourses', () => {
    it('should get all courses', async () => {
      const mockCourses = [
        { id: 1, name: 'Computer Science' },
        { id: 2, name: 'Engineering' },
      ];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockCourses } as any);

      const result = await MetadataModel.getAllCourses();

      expect(result).toEqual(mockCourses);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('courses'));
    });
  });

  describe('getAllYears', () => {
    it('should get all years', async () => {
      const mockYears = [
        { id: 1, year: '1st Year' },
        { id: 2, year: '2nd Year' },
      ];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockYears } as any);

      const result = await MetadataModel.getAllYears();

      expect(result).toEqual(mockYears);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('years'));
    });
  });

  describe('getAllStrands', () => {
    it('should get all SHS strands', async () => {
      const mockStrands = [
        { id: 1, name: 'STEM' },
        { id: 2, name: 'ABM' },
      ];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockStrands } as any);

      const result = await MetadataModel.getAllStrands();

      expect(result).toEqual(mockStrands);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('shs_strands'));
    });
  });

  describe('getAllGrades', () => {
    it('should get all SHS grades', async () => {
      const mockGrades = [
        { id: 11, grade_name: 'Grade 11' },
        { id: 12, grade_name: 'Grade 12' },
      ];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockGrades } as any);

      const result = await MetadataModel.getAllGrades();

      expect(result).toEqual(mockGrades);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('shs_grades'));
    });
  });

  describe('getAllDepartments', () => {
    it('should get all faculty departments', async () => {
      const mockDepartments = [
        { id: 1, department_name: 'Computer Science' },
        { id: 2, department_name: 'Engineering' },
      ];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockDepartments } as any);

      const result = await MetadataModel.getAllDepartments();

      expect(result).toEqual(mockDepartments);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('faculty_department'));
    });
  });
});





