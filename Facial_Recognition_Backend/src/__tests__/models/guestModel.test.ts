import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GuestModel } from '../../models/guestModel.js';
import * as db from '../../db/index.js';

describe('Guest Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findById', () => {
    it('should find guest by id', async () => {
      const mockGuest = { id: 1, name: 'Guest User', purpose: 'Meeting' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockGuest] } as any);

      const result = await GuestModel.findById(1);

      expect(result).toEqual(mockGuest);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    it('should return null if guest not found', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      const result = await GuestModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should get all guests with pagination', async () => {
      const mockGuests = [
        { id: 1, name: 'Guest 1', purpose: 'Meeting' },
        { id: 2, name: 'Guest 2', purpose: 'Visit' },
      ];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockGuests } as any);

      const result = await GuestModel.getAll(10, 0);

      expect(result).toEqual(mockGuests);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [10, 0]);
    });

    it('should apply filters', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      await GuestModel.getAll(10, 0, { visit_date: '2024-01-01', search: 'test' });

      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('getTotalCount', () => {
    it('should get total count of guests', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [{ count: '15' }] } as any);

      const result = await GuestModel.getTotalCount();

      expect(result).toBe(15);
    });
  });

  describe('create', () => {
    it('should create a new guest', async () => {
      const guestData = {
        name: 'Guest User',
        purpose: 'Meeting',
        visit_date: '2024-01-01',
        address: '123 Street',
      };
      const mockGuest = { id: 1, ...guestData };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockGuest] } as any);

      const result = await GuestModel.create(guestData as any);

      expect(result).toEqual(mockGuest);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update guest', async () => {
      const mockGuest = { id: 1, name: 'Guest Updated', purpose: 'Meeting' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockGuest] } as any);

      const result = await GuestModel.update(1, { name: 'Guest Updated' });

      expect(result).toEqual(mockGuest);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete guest', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);

      await GuestModel.delete(1, 10);

      expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 10]);
    });
  });

  describe('search', () => {
    it('should search guests', async () => {
      const mockGuests = [{ id: 1, name: 'Guest User', purpose: 'Meeting' }];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockGuests } as any);

      const result = await GuestModel.search('guest', 10);

      expect(result).toEqual(mockGuests);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), ['%guest%', 10]);
    });
  });

  describe('getTodayGuests', () => {
    it('should get today guests', async () => {
      const mockGuests = [{ id: 1, name: 'Guest User', visit_date: '2024-01-01' }];
      jest.spyOn(db, 'query').mockResolvedValue({ rows: mockGuests } as any);

      const result = await GuestModel.getTodayGuests();

      expect(result).toEqual(mockGuests);
      expect(db.query).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
