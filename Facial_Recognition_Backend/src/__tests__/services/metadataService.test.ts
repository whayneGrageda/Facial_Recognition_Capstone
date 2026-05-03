import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MetadataService } from '../../services/metadataService.js';
import { MetadataModel } from '../../models/metadataModel.js';

jest.mock('../../models/metadataModel.js');

describe('MetadataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllMetadata', () => {
    it('should return all metadata', async () => {
      const mockCourses = [{ id: 1, name: 'Computer Science' }];
      const mockYears = [{ id: 1, year_name: '1st Year' }];
      const mockStrands = [{ id: 1, name: 'STEM' }];
      const mockGrades = [{ id: 1, grade_name: 'Grade 11' }];
      const mockDepartments = [{ id: 1, department_name: 'IT Department' }];

      jest.spyOn(MetadataModel, 'getAllCourses').mockResolvedValue(mockCourses);
      jest.spyOn(MetadataModel, 'getAllYears').mockResolvedValue(mockYears);
      jest.spyOn(MetadataModel, 'getAllStrands').mockResolvedValue(mockStrands);
      jest.spyOn(MetadataModel, 'getAllGrades').mockResolvedValue(mockGrades);
      jest.spyOn(MetadataModel, 'getAllDepartments').mockResolvedValue(mockDepartments);

      const result = await MetadataService.getAllMetadata();

      expect(result.courses).toEqual(mockCourses);
      expect(result.years).toEqual(mockYears);
      expect(result.strands).toEqual(mockStrands);
      expect(result.grades).toEqual(mockGrades);
      expect(result.departments).toEqual(mockDepartments);
    });
  });

  describe('getCourses', () => {
    it('should return courses', async () => {
      const mockCourses = [{ id: 1, name: 'Computer Science' }];

      jest.spyOn(MetadataModel, 'getAllCourses').mockResolvedValue(mockCourses);

      const result = await MetadataService.getCourses();

      expect(result).toEqual(mockCourses);
    });
  });

  describe('getYears', () => {
    it('should return years', async () => {
      const mockYears = [{ id: 1, year_name: '1st Year' }];

      jest.spyOn(MetadataModel, 'getAllYears').mockResolvedValue(mockYears);

      const result = await MetadataService.getYears();

      expect(result).toEqual(mockYears);
    });
  });

  describe('getStrands', () => {
    it('should return strands', async () => {
      const mockStrands = [{ id: 1, name: 'STEM' }];

      jest.spyOn(MetadataModel, 'getAllStrands').mockResolvedValue(mockStrands);

      const result = await MetadataService.getStrands();

      expect(result).toEqual(mockStrands);
    });
  });

  describe('getGrades', () => {
    it('should return grades', async () => {
      const mockGrades = [{ id: 1, grade_name: 'Grade 11' }];

      jest.spyOn(MetadataModel, 'getAllGrades').mockResolvedValue(mockGrades);

      const result = await MetadataService.getGrades();

      expect(result).toEqual(mockGrades);
    });
  });

  describe('getDepartments', () => {
    it('should return departments', async () => {
      const mockDepartments = [{ id: 1, department_name: 'IT Department' }];

      jest.spyOn(MetadataModel, 'getAllDepartments').mockResolvedValue(mockDepartments);

      const result = await MetadataService.getDepartments();

      expect(result).toEqual(mockDepartments);
    });
  });
});

