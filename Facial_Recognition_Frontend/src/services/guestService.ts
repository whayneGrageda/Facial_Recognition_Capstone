import { apiService } from './api';
import type { Guest, CreateGuestForm, PaginatedResponse } from '../types';

export const guestService = {
  // Get all guests
  getAll: (limit = 10, offset = 0, filters?: { search?: string; status?: string }) => {
    return apiService.get<PaginatedResponse<Guest>>('/guests', {
      limit,
      offset,
      ...filters,
    });
  },

  // Get guest by ID
  getById: (id: number) => {
    return apiService.get<Guest>(`/guests/${id}`);
  },

  // Create guest
  create: (data: CreateGuestForm) => {
    return apiService.post<Guest>('/guests', data);
  },

  // Update guest
  update: (id: number, data: Partial<CreateGuestForm>) => {
    return apiService.put<Guest>(`/guests/${id}`, data);
  },

  // Delete guest
  delete: (id: number) => {
    return apiService.delete(`/guests/${id}`);
  },

  // Search guests
  search: (query: string, limit = 10) => {
    return apiService.get<Guest[]>('/guests/search', { q: query, limit });
  },

  // Get recent guests
  getRecent: () => {
    return apiService.get<Guest[]>('/guests/recent');
  },

  // Archive functions
  getArchived: (limit = 10, offset = 0, filters?: { search?: string; visit_date?: string }) => {
    return apiService.get<PaginatedResponse<Guest>>('/guests/archived', {
      limit,
      offset,
      ...filters,
    });
  },

  restore: (id: number) => {
    return apiService.patch(`/guests/${id}/restore`);
  },

  permanentDelete: (id: number) => {
    return apiService.delete(`/guests/${id}/permanent`);
  },

  bulkArchive: (ids: number[]) => {
    return apiService.post('/guests/bulk-archive', { ids });
  },

  bulkRestore: (ids: number[]) => {
    return apiService.post('/guests/bulk-restore', { ids });
  },

  bulkDelete: (ids: number[]) => {
    return apiService.post('/guests/bulk-delete', { ids });
  },
};
