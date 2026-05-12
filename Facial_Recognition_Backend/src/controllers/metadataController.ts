import { Request, Response } from 'express';
import { MetadataService } from '../services/metadataService.js';
import { API_MESSAGES } from '../constants/messages.js';
import { sendResponse } from '../helpers/responseHelper.js';

export const getAllMetadata = async (req: Request, res: Response) => {
  try {
    const result = await MetadataService.getAllMetadata();
    return sendResponse(res, API_MESSAGES.METADATA.FETCH_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching all metadata:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

// ===================================
// COURSES
// ===================================
export const getCourses = async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const result = await MetadataService.getCourses(includeInactive);
    return sendResponse(res, API_MESSAGES.METADATA.FETCH_SUCCESS, result);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const result = await MetadataService.createCourse(name);
    return sendResponse(res, { status: 201, message: 'Course created successfully' }, result);
  } catch (error: any) {
    if (error.message === 'COURSE_NAME_REQUIRED') {
      return sendResponse(res, { status: 400, message: 'Course name is required' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;
    const result = await MetadataService.updateCourse(id, name);
    return sendResponse(res, { status: 200, message: 'Course updated successfully' }, result);
  } catch (error: any) {
    if (error.message === 'COURSE_NOT_FOUND') {
      return sendResponse(res, { status: 404, message: 'Course not found' });
    }
    if (error.message === 'COURSE_NAME_REQUIRED') {
      return sendResponse(res, { status: 400, message: 'Course name is required' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const toggleCourseStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await MetadataService.toggleCourseStatus(id);
    return sendResponse(res, { status: 200, message: 'Course status updated successfully' }, result);
  } catch (error: any) {
    if (error.message === 'COURSE_NOT_FOUND') {
      return sendResponse(res, { status: 404, message: 'Course not found' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await MetadataService.deleteCourse(id);
    return sendResponse(res, { status: 200, message: 'Course deleted successfully' });
  } catch (error: any) {
    if (error.message === 'COURSE_NOT_FOUND') {
      return sendResponse(res, { status: 404, message: 'Course not found' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

// ===================================
// STRANDS
// ===================================
export const getStrands = async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const result = await MetadataService.getStrands(includeInactive);
    return sendResponse(res, API_MESSAGES.METADATA.FETCH_SUCCESS, result);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const createStrand = async (req: Request, res: Response) => {
  try {
    const { name, acronym } = req.body;
    const result = await MetadataService.createStrand(name, acronym);
    return sendResponse(res, { status: 201, message: 'Strand created successfully' }, result);
  } catch (error: any) {
    if (error.message === 'STRAND_NAME_REQUIRED') {
      return sendResponse(res, { status: 400, message: 'Strand name is required' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const updateStrand = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, acronym } = req.body;
    const result = await MetadataService.updateStrand(id, name, acronym);
    return sendResponse(res, { status: 200, message: 'Strand updated successfully' }, result);
  } catch (error: any) {
    if (error.message === 'STRAND_NOT_FOUND') {
      return sendResponse(res, { status: 404, message: 'Strand not found' });
    }
    if (error.message === 'STRAND_NAME_REQUIRED') {
      return sendResponse(res, { status: 400, message: 'Strand name is required' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const toggleStrandStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await MetadataService.toggleStrandStatus(id);
    return sendResponse(res, { status: 200, message: 'Strand status updated successfully' }, result);
  } catch (error: any) {
    if (error.message === 'STRAND_NOT_FOUND') {
      return sendResponse(res, { status: 404, message: 'Strand not found' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const deleteStrand = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await MetadataService.deleteStrand(id);
    return sendResponse(res, { status: 200, message: 'Strand deleted successfully' });
  } catch (error: any) {
    if (error.message === 'STRAND_NOT_FOUND') {
      return sendResponse(res, { status: 404, message: 'Strand not found' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

// ===================================
// DEPARTMENTS
// ===================================
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const result = await MetadataService.getDepartments(includeInactive);
    return sendResponse(res, API_MESSAGES.METADATA.FETCH_SUCCESS, result);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { department_name } = req.body;
    const result = await MetadataService.createDepartment(department_name);
    return sendResponse(res, { status: 201, message: 'Department created successfully' }, result);
  } catch (error: any) {
    if (error.message === 'DEPARTMENT_NAME_REQUIRED') {
      return sendResponse(res, { status: 400, message: 'Department name is required' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { department_name } = req.body;
    const result = await MetadataService.updateDepartment(id, department_name);
    return sendResponse(res, { status: 200, message: 'Department updated successfully' }, result);
  } catch (error: any) {
    if (error.message === 'DEPARTMENT_NOT_FOUND') {
      return sendResponse(res, { status: 404, message: 'Department not found' });
    }
    if (error.message === 'DEPARTMENT_NAME_REQUIRED') {
      return sendResponse(res, { status: 400, message: 'Department name is required' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const toggleDepartmentStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await MetadataService.toggleDepartmentStatus(id);
    return sendResponse(res, { status: 200, message: 'Department status updated successfully' }, result);
  } catch (error: any) {
    if (error.message === 'DEPARTMENT_NOT_FOUND') {
      return sendResponse(res, { status: 404, message: 'Department not found' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await MetadataService.deleteDepartment(id);
    return sendResponse(res, { status: 200, message: 'Department deleted successfully' });
  } catch (error: any) {
    if (error.message === 'DEPARTMENT_NOT_FOUND') {
      return sendResponse(res, { status: 404, message: 'Department not found' });
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

// ===================================
// YEARS & GRADES (Read-only)
// ===================================
export const getYears = async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const result = await MetadataService.getYears(includeInactive);
    return sendResponse(res, API_MESSAGES.METADATA.FETCH_SUCCESS, result);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getGrades = async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const result = await MetadataService.getGrades(includeInactive);
    return sendResponse(res, API_MESSAGES.METADATA.FETCH_SUCCESS, result);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};
