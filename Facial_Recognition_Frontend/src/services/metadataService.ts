import { apiService } from './api';
import type { Course, Year, Strand, Grade, Department } from '../types';

export const metadataService = {
  // Get all courses
  getCourses: () => {
    return apiService.get<Course[]>('/metadata/courses');
  },

  // Get all years
  getYears: () => {
    return apiService.get<Year[]>('/metadata/years');
  },

  // Get all strands
  getStrands: () => {
    return apiService.get<Strand[]>('/metadata/strands');
  },

  // Get all grades
  getGrades: () => {
    return apiService.get<Grade[]>('/metadata/grades');
  },

  // Get all departments
  getDepartments: () => {
    return apiService.get<Department[]>('/metadata/departments');
  },
};
