import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GuestService } from '../../services/guestService.js';
import { GuestModel } from '../../models/guestModel.js';

jest.mock('../../models/guestModel.js');

describe('GuestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGuests', () => {
    it('should return paginated guests', async () => {
      const mockGuests = [{ id: 1, name: 'John Visitor', purpose: 'Meeting' }];

      jest.spyOn(GuestModel, 'getAll').mockResolvedValue(mockGuests as any);
      jest.spyOn(GuestModel, 'getTotalCount').mockResolvedValue(1);

      const result = await GuestService.getGuests(10, 0);

      expect(result.guests).toEqual(mockGuests);
      expect(result.totalCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getGuestById', () => {
    it('should return guest by id', async () => {
      const mockGuest = { id: 1, name: 'John Visitor' };

      jest.spyOn(GuestModel, 'findById').mockResolvedValue(mockGuest as any);

      const result = await GuestService.getGuestById(1);

      expect(result).toEqual(mockGuest);
    });

    it('should throw error if not found', async () => {
      jest.spyOn(GuestModel, 'findById').mockResolvedValue(null);

      await expect(GuestService.getGuestById(999)).rejects.toThrow('GUEST_NOT_FOUND');
    });
  });

  describe('createGuest', () => {
    it('should create guest successfully', async () => {
      const mockGuest = { id: 1, name: 'John Visitor', purpose: 'Meeting' };

      jest.spyOn(GuestModel, 'create').mockResolvedValue(mockGuest as any);

      const guestData = { name: 'John Visitor', purpose: 'Meeting', visit_date: '2024-01-15' };
      const result = await GuestService.createGuest(guestData);

      expect(result).toEqual(mockGuest);
      expect(GuestModel.create).toHaveBeenCalledWith(guestData);
    });
  });

  describe('updateGuest', () => {
    it('should update guest successfully', async () => {
      const existingGuest = { id: 1, name: 'John Visitor' };
      const updatedGuest = { id: 1, name: 'John Updated' };

      jest.spyOn(GuestModel, 'findById').mockResolvedValue(existingGuest as any);
      jest.spyOn(GuestModel, 'update').mockResolvedValue(updatedGuest as any);

      const result = await GuestService.updateGuest(1, { name: 'John Updated' });

      expect(result).toEqual(updatedGuest);
    });

    it('should throw error if guest not found', async () => {
      jest.spyOn(GuestModel, 'findById').mockResolvedValue(null);

      await expect(GuestService.updateGuest(999, {})).rejects.toThrow('GUEST_NOT_FOUND');
    });
  });

  describe('deleteGuest', () => {
    it('should delete guest successfully', async () => {
      jest.spyOn(GuestModel, 'findById').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(GuestModel, 'delete').mockResolvedValue(undefined);

      await GuestService.deleteGuest(1, 2);

      expect(GuestModel.delete).toHaveBeenCalledWith(1, 2);
    });

    it('should throw error if guest not found', async () => {
      jest.spyOn(GuestModel, 'findById').mockResolvedValue(null);

      await expect(GuestService.deleteGuest(999)).rejects.toThrow('GUEST_NOT_FOUND');
    });
  });

  describe('searchGuests', () => {
    it('should search guests', async () => {
      const mockGuests = [{ id: 1, name: 'John Visitor' }];

      jest.spyOn(GuestModel, 'search').mockResolvedValue(mockGuests as any);

      const result = await GuestService.searchGuests('john', 10);

      expect(result).toEqual(mockGuests);
      expect(GuestModel.search).toHaveBeenCalledWith('john', 10);
    });
  });

  describe('getTodayGuests', () => {
    it('should return today guests', async () => {
      const mockGuests = [{ id: 1, name: 'John Visitor' }];

      jest.spyOn(GuestModel, 'getTodayGuests').mockResolvedValue(mockGuests as any);

      const result = await GuestService.getTodayGuests();

      expect(result).toEqual(mockGuests);
    });
  });
});


