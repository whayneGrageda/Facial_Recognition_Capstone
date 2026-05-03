import { GuestModel } from '../models/guestModel.js';
import { CreateGuestRequest, UpdateGuestRequest } from '../types/guestEntity.js';
import { FaceImageService } from './faceImageService.js';

export const GuestService = {
  getGuests: async (limit: number, offset: number, filters?: any) => {
    const guests = await GuestModel.getAll(limit, offset, filters);
    const totalCount = await GuestModel.getTotalCount(filters);
    
    return {
      guests,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
    };
  },

  getGuestById: async (id: number) => {
    const guest = await GuestModel.findById(id);
    if (!guest) throw new Error('GUEST_NOT_FOUND');
    return guest;
  },

  createGuest: async (guestData: CreateGuestRequest) => {
    return await GuestModel.create(guestData);
  },

  updateGuest: async (id: number, guestData: UpdateGuestRequest) => {
    const existing = await GuestModel.findById(id);
    if (!existing) throw new Error('GUEST_NOT_FOUND');

    return await GuestModel.update(id, guestData);
  },

  deleteGuest: async (id: number, archivedBy?: number) => {
    const existing = await GuestModel.findById(id);
    if (!existing) throw new Error('GUEST_NOT_FOUND');
    
    await GuestModel.delete(id, archivedBy);
    
    // Delete face images if guest has a name
    if (existing.name) {
      try {
        await FaceImageService.deleteFaceImages(existing.name);
        console.log(`Deleted face images for guest: ${existing.name}`);
      } catch (error) {
        console.error(`Failed to delete face images for guest ${existing.name}:`, error);
      }
    }
  },

  searchGuests: async (query: string, limit: number = 10) => {
    return await GuestModel.search(query, limit);
  },

  getTodayGuests: async () => {
    return await GuestModel.getTodayGuests();
  },

  // Archive-related functions
  getArchivedGuests: async (limit: number, offset: number, filters?: any) => {
    const guests = await GuestModel.getArchived(limit, offset, filters);
    const totalCount = await GuestModel.getArchivedCount(filters);

    return {
      guests,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
    };
  },

  restoreGuest: async (id: number) => {
    const existing = await GuestModel.findById(id);
    if (!existing) throw new Error('GUEST_NOT_FOUND');
    if (existing.status !== 'archived') throw new Error('GUEST_NOT_ARCHIVED');
    
    await GuestModel.restore(id);
  },

  permanentDeleteGuest: async (id: number) => {
    const existing = await GuestModel.findById(id);
    if (!existing) throw new Error('GUEST_NOT_FOUND');
    
    await GuestModel.permanentDelete(id);
    
    // Delete face images if guest has a name
    if (existing.name) {
      try {
        await FaceImageService.deleteFaceImages(existing.name);
        console.log(`Deleted face images for guest: ${existing.name}`);
      } catch (error) {
        console.error(`Failed to delete face images for guest ${existing.name}:`, error);
      }
    }
  },

  bulkArchiveGuests: async (ids: number[], archivedBy?: number) => {
    await GuestModel.bulkArchive(ids, archivedBy);
  },

  bulkRestoreGuests: async (ids: number[]) => {
    await GuestModel.bulkRestore(ids);
  },

  bulkDeleteGuests: async (ids: number[]) => {
    // Get all guests first to delete their face images
    const guests = await Promise.all(ids.map(id => GuestModel.findById(id)));
    
    await GuestModel.bulkDelete(ids);
    
    // Delete face images for all guests
    for (const guest of guests) {
      if (guest && guest.name) {
        try {
          await FaceImageService.deleteFaceImages(guest.name);
          console.log(`Deleted face images for guest: ${guest.name}`);
        } catch (error) {
          console.error(`Failed to delete face images for guest ${guest.name}:`, error);
        }
      }
    }
  },
};
