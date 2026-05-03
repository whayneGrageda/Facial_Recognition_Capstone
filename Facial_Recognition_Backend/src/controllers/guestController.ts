import { Request, Response } from 'express';
import { GuestService } from '../services/guestService.js';
import { API_MESSAGES } from '../constants/messages.js';
import { sendResponse } from '../helpers/responseHelper.js';

export const getGuests = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const filters = {
      visit_date: req.query.visit_date as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      search: req.query.search as string,
    };

    const result = await GuestService.getGuests(limit, offset, filters);
    return sendResponse(res, API_MESSAGES.GUEST.LIST_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching guests:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getGuestById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const guest = await GuestService.getGuestById(id);
    return sendResponse(res, API_MESSAGES.GUEST.FETCH_SUCCESS, guest);
  } catch (error: any) {
    if (error.message === 'GUEST_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.GUEST.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const createGuest = async (req: Request, res: Response) => {
  try {
    const guest = await GuestService.createGuest(req.body);
    return sendResponse(res, API_MESSAGES.GUEST.CREATE_SUCCESS, guest);
  } catch (error) {
    console.error('Error creating guest:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const updateGuest = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const guest = await GuestService.updateGuest(id, req.body);
    return sendResponse(res, API_MESSAGES.GUEST.UPDATE_SUCCESS, guest);
  } catch (error: any) {
    if (error.message === 'GUEST_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.GUEST.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const deleteGuest = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const archivedBy = (req as any).user?.userId;
    await GuestService.deleteGuest(id, archivedBy);
    return sendResponse(res, API_MESSAGES.GUEST.DELETE_SUCCESS);
  } catch (error: any) {
    if (error.message === 'GUEST_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.GUEST.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const searchGuests = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.length < 2) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const guests = await GuestService.searchGuests(query, limit);
    return sendResponse(res, API_MESSAGES.GUEST.LIST_SUCCESS, guests);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getTodayGuests = async (req: Request, res: Response) => {
  try {
    const guests = await GuestService.getTodayGuests();
    return sendResponse(res, API_MESSAGES.GUEST.LIST_SUCCESS, guests);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

// Archive-related controllers
export const getArchivedGuests = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const filters = {
      visit_date: req.query.visit_date as string,
      search: req.query.search as string,
    };

    const result = await GuestService.getArchivedGuests(limit, offset, filters);
    return sendResponse(res, API_MESSAGES.GUEST.LIST_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching archived guests:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const restoreGuest = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, { status: 400, message: 'Invalid guest ID' });
    }

    await GuestService.restoreGuest(id);
    return sendResponse(res, { status: 200, message: 'Guest restored successfully' });
  } catch (error: any) {
    if (error.message === 'GUEST_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.GUEST.NOT_FOUND);
    }
    if (error.message === 'GUEST_NOT_ARCHIVED') {
      return sendResponse(res, { status: 400, message: 'Guest is not archived' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const permanentDeleteGuest = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, { status: 400, message: 'Invalid guest ID' });
    }

    await GuestService.permanentDeleteGuest(id);
    return sendResponse(res, { status: 200, message: 'Guest permanently deleted successfully' });
  } catch (error: any) {
    if (error.message === 'GUEST_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.GUEST.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkArchiveGuests = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid guest IDs' });
    }

    const archivedBy = (req as any).user?.userId;
    await GuestService.bulkArchiveGuests(ids, archivedBy);
    return sendResponse(res, { status: 200, message: 'Guests archived successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkRestoreGuests = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid guest IDs' });
    }

    await GuestService.bulkRestoreGuests(ids);
    return sendResponse(res, { status: 200, message: 'Guests restored successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkDeleteGuests = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid guest IDs' });
    }

    await GuestService.bulkDeleteGuests(ids);
    return sendResponse(res, { status: 200, message: 'Guests permanently deleted successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};
