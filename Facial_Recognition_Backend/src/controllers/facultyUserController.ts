import { Request, Response } from 'express';
import { FacultyUserService } from '../services/facultyUserService.js';
import { API_MESSAGES } from '../constants/messages.js';
import { sendResponse } from '../helpers/responseHelper.js';

export const getFacultyUsers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const filters = {
      department_id: req.query.department_id ? parseInt(req.query.department_id as string) : undefined,
      search: req.query.search as string,
    };

    const result = await FacultyUserService.getUsers(limit, offset, filters);
    return sendResponse(res, API_MESSAGES.USER.LIST_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching faculty users:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getFacultyUserById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    const user = await FacultyUserService.getUserById(id);
    return sendResponse(res, API_MESSAGES.USER.FETCH_SUCCESS, user);
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.USER.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const createFacultyUser = async (req: Request, res: Response) => {
  try {
    const user = await FacultyUserService.createUser(req.body);
    return sendResponse(res, API_MESSAGES.USER.CREATE_SUCCESS, user);
  } catch (error: any) {
    if (error.message === 'DUPLICATE_EMAIL') {
      return sendResponse(res, API_MESSAGES.USER.DUPLICATE_EMAIL);
    }
    console.error('Error creating faculty user:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const updateFacultyUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    const user = await FacultyUserService.updateUser(id, req.body);
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

export const deleteFacultyUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    const archivedBy = (req as any).user?.userId;
    await FacultyUserService.deleteUser(id, archivedBy);
    return sendResponse(res, API_MESSAGES.USER.DELETE_SUCCESS);
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.USER.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const searchFacultyUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.length < 2) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const users = await FacultyUserService.searchUsers(query, limit);
    return sendResponse(res, API_MESSAGES.USER.LIST_SUCCESS, users);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

// Archive-related controllers
export const getArchivedFacultyUsers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const filters = {
      department_id: req.query.department_id ? parseInt(req.query.department_id as string) : undefined,
      search: req.query.search as string,
    };

    const result = await FacultyUserService.getArchivedUsers(limit, offset, filters);
    return sendResponse(res, API_MESSAGES.USER.LIST_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching archived faculty users:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const restoreFacultyUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    await FacultyUserService.restoreUser(id);
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

export const permanentDeleteFacultyUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.USER.INVALID_ID);
    }

    await FacultyUserService.permanentDeleteUser(id);
    return sendResponse(res, { status: 200, message: 'User permanently deleted successfully' });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.USER.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkArchiveFacultyUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid user IDs' });
    }

    const archivedBy = (req as any).user?.userId;
    await FacultyUserService.bulkArchiveUsers(ids, archivedBy);
    return sendResponse(res, { status: 200, message: 'Users archived successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkRestoreFacultyUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid user IDs' });
    }

    await FacultyUserService.bulkRestoreUsers(ids);
    return sendResponse(res, { status: 200, message: 'Users restored successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const bulkDeleteFacultyUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { status: 400, message: 'Invalid user IDs' });
    }

    await FacultyUserService.bulkDeleteUsers(ids);
    return sendResponse(res, { status: 200, message: 'Users permanently deleted successfully' });
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};
