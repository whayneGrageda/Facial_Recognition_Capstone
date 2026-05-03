import { Request, Response } from 'express';
import { ModeratorService } from '../services/moderatorService.js';
import { API_MESSAGES } from '../constants/messages.js';
import { sendResponse } from '../helpers/responseHelper.js';

export const getModerators = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await ModeratorService.getModerators(limit, offset);
    return sendResponse(res, API_MESSAGES.MODERATOR.LIST_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching moderators:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getModeratorById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const moderator = await ModeratorService.getModeratorById(id);
    return sendResponse(res, API_MESSAGES.MODERATOR.FETCH_SUCCESS, moderator);
  } catch (error: any) {
    if (error.message === 'MODERATOR_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.MODERATOR.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const createModerator = async (req: Request, res: Response) => {
  try {
    const moderator = await ModeratorService.createModerator(req.body);
    return sendResponse(res, API_MESSAGES.MODERATOR.CREATE_SUCCESS, moderator);
  } catch (error: any) {
    if (error.message === 'DUPLICATE_USERNAME') {
      return sendResponse(res, { status: 409, message: 'Username already exists' });
    }
    console.error('Error creating moderator:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const updateModerator = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const moderator = await ModeratorService.updateModerator(id, req.body);
    return sendResponse(res, API_MESSAGES.MODERATOR.UPDATE_SUCCESS, moderator);
  } catch (error: any) {
    if (error.message === 'MODERATOR_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.MODERATOR.NOT_FOUND);
    }
    if (error.message === 'DUPLICATE_USERNAME') {
      return sendResponse(res, { status: 409, message: 'Username already exists' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const deleteModerator = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const archivedBy = (req as any).user?.userId;
    await ModeratorService.deleteModerator(id, archivedBy);
    return sendResponse(res, API_MESSAGES.MODERATOR.DELETE_SUCCESS);
  } catch (error: any) {
    if (error.message === 'MODERATOR_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.MODERATOR.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

// Archive-related controllers
export const getArchivedModerators = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const filters = {
      search: req.query.search as string,
    };

    const result = await ModeratorService.getArchivedModerators(limit, offset, filters);
    return sendResponse(res, API_MESSAGES.MODERATOR.LIST_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching archived moderators:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const restoreModerator = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, { status: 400, message: 'Invalid moderator ID' });
    }

    await ModeratorService.restoreModerator(id);
    return sendResponse(res, { status: 200, message: 'Moderator restored successfully' });
  } catch (error: any) {
    if (error.message === 'MODERATOR_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.MODERATOR.NOT_FOUND);
    }
    if (error.message === 'MODERATOR_NOT_ARCHIVED') {
      return sendResponse(res, { status: 400, message: 'Moderator is not archived' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const permanentDeleteModerator = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, { status: 400, message: 'Invalid moderator ID' });
    }

    await ModeratorService.permanentDeleteModerator(id);
    return sendResponse(res, { status: 200, message: 'Moderator permanently deleted successfully' });
  } catch (error: any) {
    if (error.message === 'MODERATOR_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.MODERATOR.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkArchiveModerators = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid moderator IDs' });
    }

    const archivedBy = (req as any).user?.userId;
    await ModeratorService.bulkArchiveModerators(ids, archivedBy);
    return sendResponse(res, { status: 200, message: 'Moderators archived successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkRestoreModerators = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid moderator IDs' });
    }

    await ModeratorService.bulkRestoreModerators(ids);
    return sendResponse(res, { status: 200, message: 'Moderators restored successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkDeleteModerators = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid moderator IDs' });
    }

    await ModeratorService.bulkDeleteModerators(ids);
    return sendResponse(res, { status: 200, message: 'Moderators permanently deleted successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};
