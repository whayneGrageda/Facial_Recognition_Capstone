import { apiService } from './api';
import type {
  CollegeUser,
  ShsUser,
  FacultyUser,
  CreateUserForm,
  UpdateUserForm,
  PaginatedResponse,
  UserFilters,
} from '../types';

export const userService = {
  // College Users
  college: {
    getAll: (limit = 10, offset = 0, filters?: UserFilters) => {
      return apiService.get<PaginatedResponse<CollegeUser>>('/users', {
        limit,
        offset,
        ...filters,
      });
    },

    getById: (id: number) => {
      return apiService.get<CollegeUser>(`/users/${id}`);
    },

    create: (data: CreateUserForm) => {
      return apiService.post<CollegeUser>('/users', data);
    },

    update: (id: number, data: UpdateUserForm) => {
      return apiService.put<CollegeUser>(`/users/${id}`, data);
    },

    delete: (id: number) => {
      return apiService.delete(`/users/${id}`);
    },

    search: (query: string, limit = 10) => {
      return apiService.get<CollegeUser[]>('/users/search', { q: query, limit });
    },

    // Archive functions
    getArchived: (limit = 10, offset = 0, filters?: UserFilters) => {
      return apiService.get<PaginatedResponse<CollegeUser>>('/users/archived', {
        limit,
        offset,
        ...filters,
      });
    },

    restore: (id: number) => {
      return apiService.patch(`/users/${id}/restore`);
    },

    permanentDelete: (id: number) => {
      return apiService.delete(`/users/${id}/permanent`);
    },

    bulkArchive: (ids: number[]) => {
      return apiService.post('/users/bulk-archive', { ids });
    },

    bulkRestore: (ids: number[]) => {
      return apiService.post('/users/bulk-restore', { ids });
    },

    bulkDelete: (ids: number[]) => {
      return apiService.post('/users/bulk-delete', { ids });
    },

    // Export to CSV
    exportToCSV: async (filters?: UserFilters) => {
      const blob = await apiService.download('/users/export', filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `college_users_${timestamp}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  },

  // SHS Users
  shs: {
    getAll: (limit = 10, offset = 0, filters?: UserFilters) => {
      return apiService.get<PaginatedResponse<ShsUser>>('/shs-users', {
        limit,
        offset,
        ...filters,
      });
    },

    getById: (id: number) => {
      return apiService.get<ShsUser>(`/shs-users/${id}`);
    },

    create: (data: CreateUserForm) => {
      return apiService.post<ShsUser>('/shs-users', data);
    },

    update: (id: number, data: UpdateUserForm) => {
      return apiService.put<ShsUser>(`/shs-users/${id}`, data);
    },

    delete: (id: number) => {
      return apiService.delete(`/shs-users/${id}`);
    },

    search: (query: string, limit = 10) => {
      return apiService.get<ShsUser[]>('/shs-users/search', { q: query, limit });
    },

    // Archive functions
    getArchived: (limit = 10, offset = 0, filters?: UserFilters) => {
      return apiService.get<PaginatedResponse<ShsUser>>('/shs-users/archived', {
        limit,
        offset,
        ...filters,
      });
    },

    restore: (id: number) => {
      return apiService.patch(`/shs-users/${id}/restore`);
    },

    permanentDelete: (id: number) => {
      return apiService.delete(`/shs-users/${id}/permanent`);
    },

    bulkArchive: (ids: number[]) => {
      return apiService.post('/shs-users/bulk-archive', { ids });
    },

    bulkRestore: (ids: number[]) => {
      return apiService.post('/shs-users/bulk-restore', { ids });
    },

    bulkDelete: (ids: number[]) => {
      return apiService.post('/shs-users/bulk-delete', { ids });
    },

    // Export to CSV
    exportToCSV: async (filters?: UserFilters) => {
      const blob = await apiService.download('/shs-users/export', filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `shs_users_${timestamp}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  },

  // Faculty Users
  faculty: {
    getAll: (limit = 10, offset = 0, filters?: UserFilters) => {
      return apiService.get<PaginatedResponse<FacultyUser>>('/faculty-users', {
        limit,
        offset,
        ...filters,
      });
    },

    getById: (id: number) => {
      return apiService.get<FacultyUser>(`/faculty-users/${id}`);
    },

    create: (data: CreateUserForm) => {
      return apiService.post<FacultyUser>('/faculty-users', data);
    },

    update: (id: number, data: UpdateUserForm) => {
      return apiService.put<FacultyUser>(`/faculty-users/${id}`, data);
    },

    delete: (id: number) => {
      return apiService.delete(`/faculty-users/${id}`);
    },

    search: (query: string, limit = 10) => {
      return apiService.get<FacultyUser[]>('/faculty-users/search', { q: query, limit });
    },

    // Archive functions
    getArchived: (limit = 10, offset = 0, filters?: UserFilters) => {
      return apiService.get<PaginatedResponse<FacultyUser>>('/faculty-users/archived', {
        limit,
        offset,
        ...filters,
      });
    },

    restore: (id: number) => {
      return apiService.patch(`/faculty-users/${id}/restore`);
    },

    permanentDelete: (id: number) => {
      return apiService.delete(`/faculty-users/${id}/permanent`);
    },

    bulkArchive: (ids: number[]) => {
      return apiService.post('/faculty-users/bulk-archive', { ids });
    },

    bulkRestore: (ids: number[]) => {
      return apiService.post('/faculty-users/bulk-restore', { ids });
    },

    bulkDelete: (ids: number[]) => {
      return apiService.post('/faculty-users/bulk-delete', { ids });
    },

    // Export to CSV
    exportToCSV: async (filters?: UserFilters) => {
      const blob = await apiService.download('/faculty-users/export', filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `faculty_users_${timestamp}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  },
};
