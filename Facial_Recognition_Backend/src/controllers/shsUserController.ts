import { Request, Response } from 'express';
import { ShsUserService } from '../services/shsUserService.js';
import { API_MESSAGES } from '../constants/messages.js';
import { sendResponse } from '../helpers/responseHelper.js';

export const getShsUsers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const filters = {
      strand_id: req.query.strand_id ? parseInt(req.query.strand_id as string) : undefined,
      grade_id: req.query.grade_id ? parseInt(req.query.grade_id as string) : undefined,
      search: req.query.search as string,
    };

    const result = await ShsUserService.getUsers(limit, offset, filters);
    return sendResponse(res, API_MESSAGES.USER.LIST_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching SHS users:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getShsUserById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    const user = await ShsUserService.getUserById(id);
    return sendResponse(res, API_MESSAGES.USER.FETCH_SUCCESS, user);
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.USER.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const createShsUser = async (req: Request, res: Response) => {
  try {
    const user = await ShsUserService.createUser(req.body);
    return sendResponse(res, API_MESSAGES.USER.CREATE_SUCCESS, user);
  } catch (error: any) {
    if (error.message === 'DUPLICATE_EMAIL') {
      return sendResponse(res, API_MESSAGES.USER.DUPLICATE_EMAIL);
    }
    if (error.message === 'DUPLICATE_STUDENT_ID') {
      return sendResponse(res, API_MESSAGES.USER.DUPLICATE_STUDENT_ID);
    }
    console.error('Error creating SHS user:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const updateShsUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    const user = await ShsUserService.updateUser(id, req.body);
    return sendResponse(res, API_MESSAGES.USER.UPDATE_SUCCESS, user);
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.USER.NOT_FOUND);
    }
    if (error.message === 'DUPLICATE_EMAIL') {
      return sendResponse(res, API_MESSAGES.USER.DUPLICATE_EMAIL);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const deleteShsUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    const archivedBy = (req as any).user?.userId;
    await ShsUserService.deleteUser(id, archivedBy);
    return sendResponse(res, API_MESSAGES.USER.DELETE_SUCCESS);
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.USER.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const searchShsUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.length < 2) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const users = await ShsUserService.searchUsers(query, limit);
    return sendResponse(res, API_MESSAGES.USER.LIST_SUCCESS, users);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

// Archive-related controllers
export const getArchivedShsUsers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const filters = {
      strand_id: req.query.strand_id ? parseInt(req.query.strand_id as string) : undefined,
      grade_id: req.query.grade_id ? parseInt(req.query.grade_id as string) : undefined,
      search: req.query.search as string,
    };

    const result = await ShsUserService.getArchivedUsers(limit, offset, filters);
    return sendResponse(res, API_MESSAGES.USER.LIST_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching archived SHS users:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const restoreShsUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    await ShsUserService.restoreUser(id);
    return sendResponse(res, API_MESSAGES.USER.RESTORE_SUCCESS);
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.USER.NOT_FOUND);
    }
    if (error.message === 'USER_NOT_ARCHIVED') {
      return sendResponse(res, { status: 400, message: 'User is not archived' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const permanentDeleteShsUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    await ShsUserService.permanentDeleteUser(id);
    return sendResponse(res, { status: 200, message: 'User permanently deleted successfully' });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.USER.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkArchiveShsUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid user IDs' });
    }

    const archivedBy = (req as any).user?.userId;
    await ShsUserService.bulkArchiveUsers(ids, archivedBy);
    return sendResponse(res, { status: 200, message: 'Users archived successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkRestoreShsUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid user IDs' });
    }

    await ShsUserService.bulkRestoreUsers(ids);
    return sendResponse(res, { status: 200, message: 'Users restored successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkDeleteShsUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid user IDs' });
    }

    await ShsUserService.bulkDeleteUsers(ids);
    return sendResponse(res, { status: 200, message: 'Users permanently deleted successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};
