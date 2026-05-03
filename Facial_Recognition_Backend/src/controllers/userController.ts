import { Request, Response } from 'express';
import { UserService } from '../services/userService.js';
import { API_MESSAGES } from '../constants/messages.js';
import { sendResponse } from '../helpers/responseHelper.js';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const filters = {
      course_id: req.query.course_id ? parseInt(req.query.course_id as string) : undefined,
      year_id: req.query.year_id ? parseInt(req.query.year_id as string) : undefined,
      search: req.query.search as string,
    };

    const result = await UserService.getUsers(limit, offset, filters);
    return sendResponse(res, API_MESSAGES.USER.LIST_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching users:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    const user = await UserService.getUserById(id);
    return sendResponse(res, API_MESSAGES.USER.FETCH_SUCCESS, user);
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.USER.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await UserService.createUser(req.body);
    return sendResponse(res, API_MESSAGES.USER.CREATE_SUCCESS, user);
  } catch (error: any) {
    if (error.message === 'DUPLICATE_EMAIL') {
      return sendResponse(res, API_MESSAGES.USER.DUPLICATE_EMAIL);
    }
    if (error.message === 'DUPLICATE_STUDENT_ID') {
      return sendResponse(res, API_MESSAGES.USER.DUPLICATE_STUDENT_ID);
    }
    console.error('Error creating user:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    const user = await UserService.updateUser(id, req.body);
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

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    const archivedBy = req.user?.userId;
    await UserService.deleteUser(id, archivedBy);
    return sendResponse(res, API_MESSAGES.USER.DELETE_SUCCESS);
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.USER.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.length < 2) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const users = await UserService.searchUsers(query, limit);
    return sendResponse(res, API_MESSAGES.USER.LIST_SUCCESS, users);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

// Archive-related controllers
export const getArchivedUsers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const filters = {
      course_id: req.query.course_id ? parseInt(req.query.course_id as string) : undefined,
      year_id: req.query.year_id ? parseInt(req.query.year_id as string) : undefined,
      search: req.query.search as string,
    };

    const result = await UserService.getArchivedUsers(limit, offset, filters);
    return sendResponse(res, API_MESSAGES.USER.LIST_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching archived users:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const restoreUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    await UserService.restoreUser(id);
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

export const permanentDeleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    await UserService.permanentDeleteUser(id);
    return sendResponse(res, { status: 200, message: 'User permanently deleted successfully' });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.USER.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkArchiveUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid user IDs' });
    }

    const archivedBy = req.user?.userId;
    await UserService.bulkArchiveUsers(ids, archivedBy);
    return sendResponse(res, { status: 200, message: 'Users archived successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkRestoreUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid user IDs' });
    }

    await UserService.bulkRestoreUsers(ids);
    return sendResponse(res, { status: 200, message: 'Users restored successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkDeleteUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid user IDs' });
    }

    await UserService.bulkDeleteUsers(ids);
    return sendResponse(res, { status: 200, message: 'Users permanently deleted successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};
