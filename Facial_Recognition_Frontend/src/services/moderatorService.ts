import { apiService } from './api';
import type { Moderator, PaginatedResponse } from '../types';

export const moderatorService = {
  // Get all moderators
  getAll: (limit = 10, offset = 0) => {
    return apiService.get<PaginatedResponse<Moderator>>('/moderators', {
      limit,
      offset,
    });
  },

  // Get moderator by ID
  getById: (id: number) => {
    return apiService.get<Moderator>(`/moderators/${id}`);
  },

  // Create moderator
  create: (data: {
    username: string;
    email?: string;
    password: string;
    role?: string;
  }) => {
    return apiService.post<Moderator>('/moderators', data);
  },

  // Update moderator
  update: (id: number, data: {
    username?: string;
    email?: string;
    password?: string;
  }) => {
    return apiService.put<Moderator>(`/moderators/${id}`, data);
  },

  // Delete moderator
  delete: (id: number) => {
    return apiService.delete(`/moderators/${id}`);
  },

  // Archive functions
  getArchived: (limit = 10, offset = 0, filters?: { search?: string }) => {
    return apiService.get<PaginatedResponse<Moderator>>('/moderators/archived', {
      limit,
      offset,
      ...filters,
    });
  },

  restore: (id: number) => {
    return apiService.patch(`/moderators/${id}/restore`);
  },

  permanentDelete: (id: number) => {
    return apiService.delete(`/moderators/${id}/permanent`);
  },

  bulkArchive: (ids: number[]) => {
    return apiService.post('/moderators/bulk-archive', { ids });
  },

  bulkRestore: (ids: number[]) => {
    return apiService.post('/moderators/bulk-restore', { ids });
  },

  bulkDelete: (ids: number[]) => {
    return apiService.post('/moderators/bulk-delete', { ids });
  },
};
