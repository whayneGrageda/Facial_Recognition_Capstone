import { describe, it, expect, jest, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import * as MetadataController from '../controllers/metadataController.js';
import { MetadataService } from '../services/metadataService.js';
import { API_MESSAGES } from '../constants/messages.js';

const app = express();
app.use(express.json());

// Routes
app.get('/api/metadata', MetadataController.getAllMetadata);
app.get('/api/metadata/courses', MetadataController.getCourses);
app.get('/api/metadata/years', MetadataController.getYears);
app.get('/api/metadata/strands', MetadataController.getStrands);
app.get('/api/metadata/grades', MetadataController.getGrades);
app.get('/api/metadata/departments', MetadataController.getDepartments);

jest.mock('../services/metadataService.js');

describe('MetadataController - API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/metadata', () => {
    it('should return all metadata', async () => {
      const mockResult = {
        courses: [{ id: 1, name: 'Computer Science' }],
        years: [{ id: 1, year_name: '1st Year' }],
        strands: [{ id: 1, name: 'STEM' }],
        grades: [{ id: 1, grade_name: 'Grade 11' }],
        departments: [{ id: 1, department_name: 'IT Department' }],
      };

      jest.spyOn(MetadataService, 'getAllMetadata').mockResolvedValue(mockResult);

      const res = await request(app).get('/api/metadata');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockResult);
      expect(res.body.message).toBe(API_MESSAGES.METADATA.FETCH_SUCCESS.message);
    });
  });

  describe('GET /api/metadata/courses', () => {
    it('should return courses list', async () => {
      const mockCourses = [
        { id: 1, name: 'Computer Science' },
        { id: 2, name: 'Information Technology' },
      ];

      jest.spyOn(MetadataService, 'getCourses').mockResolvedValue(mockCourses);

      const res = await request(app).get('/api/metadata/courses');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockCourses);
    });
  });

  describe('GET /api/metadata/years', () => {
    it('should return years list', async () => {
      const mockYears = [
        { id: 1, year_name: '1st Year' },
        { id: 2, year_name: '2nd Year' },
      ];

      jest.spyOn(MetadataService, 'getYears').mockResolvedValue(mockYears);

      const res = await request(app).get('/api/metadata/years');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockYears);
    });
  });

  describe('GET /api/metadata/strands', () => {
    it('should return strands list', async () => {
      const mockStrands = [
        { id: 1, name: 'STEM' },
        { id: 2, name: 'HUMSS' },
      ];

      jest.spyOn(MetadataService, 'getStrands').mockResolvedValue(mockStrands);

      const res = await request(app).get('/api/metadata/strands');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockStrands);
    });
  });

  describe('GET /api/metadata/grades', () => {
    it('should return grades list', async () => {
      const mockGrades = [
        { id: 1, grade_name: 'Grade 11' },
        { id: 2, grade_name: 'Grade 12' },
      ];

      jest.spyOn(MetadataService, 'getGrades').mockResolvedValue(mockGrades);

      const res = await request(app).get('/api/metadata/grades');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockGrades);
    });
  });

  describe('GET /api/metadata/departments', () => {
    it('should return departments list', async () => {
      const mockDepartments = [
        { id: 1, department_name: 'IT Department' },
        { id: 2, department_name: 'Engineering Department' },
      ];

      jest.spyOn(MetadataService, 'getDepartments').mockResolvedValue(mockDepartments);

      const res = await request(app).get('/api/metadata/departments');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockDepartments);
    });
  });
});


