import { apiService } from './api';
import type { Course, Year, Strand, Grade, Department } from '../types';

export const metadataService = {
  // ===================================
  // COURSES
  // ===================================
  getCourses: (includeInactive = false) => {
    return apiService.get<Course[]>(`/metadata/courses?includeInactive=${includeInactive}`);
  },

  createCourse: (name: string) => {
    return apiService.post<Course>('/metadata/courses', { name });
  },

  updateCourse: (id: number, name: string) => {
    return apiService.put<Course>(`/metadata/courses/${id}`, { name });
  },

  toggleCourseStatus: (id: number) => {
    return apiService.patch<Course>(`/metadata/courses/${id}/toggle`);
  },

  deleteCourse: (id: number) => {
    return apiService.delete(`/metadata/courses/${id}`);
  },

  // ===================================
  // STRANDS
  // ===================================
  getStrands: (includeInactive = false) => {
    return apiService.get<Strand[]>(`/metadata/strands?includeInactive=${includeInactive}`);
  },

  createStrand: (name: string, acronym: string) => {
    return apiService.post<Strand>('/metadata/strands', { name, acronym });
  },

  updateStrand: (id: number, name: string, acronym: string) => {
    return apiService.put<Strand>(`/metadata/strands/${id}`, { name, acronym });
  },

  toggleStrandStatus: (id: number) => {
    return apiService.patch<Strand>(`/metadata/strands/${id}/toggle`);
  },

  deleteStrand: (id: number) => {
    return apiService.delete(`/metadata/strands/${id}`);
  },

  // ===================================
  // DEPARTMENTS
  // ===================================
  getDepartments: (includeInactive = false) => {
    return apiService.get<Department[]>(`/metadata/departments?includeInactive=${includeInactive}`);
  },

  createDepartment: (department_name: string) => {
    return apiService.post<Department>('/metadata/departments', { department_name });
  },

  updateDepartment: (id: number, department_name: string) => {
    return apiService.put<Department>(`/metadata/departments/${id}`, { department_name });
  },

  toggleDepartmentStatus: (id: number) => {
    return apiService.patch<Department>(`/metadata/departments/${id}/toggle`);
  },

  deleteDepartment: (id: number) => {
    return apiService.delete(`/metadata/departments/${id}`);
  },

  // ===================================
  // YEARS & GRADES (Read-only)
  // ===================================
  getYears: (includeInactive = false) => {
    return apiService.get<Year[]>(`/metadata/years?includeInactive=${includeInactive}`);
  },

  getGrades: (includeInactive = false) => {
    return apiService.get<Grade[]>(`/metadata/grades?includeInactive=${includeInactive}`);
  },
};
