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

export const getCourses = async (req: Request, res: Response) => {
  try {
    const result = await MetadataService.getCourses();
    return sendResponse(res, API_MESSAGES.METADATA.FETCH_SUCCESS, result);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getYears = async (req: Request, res: Response) => {
  try {
    const result = await MetadataService.getYears();
    return sendResponse(res, API_MESSAGES.METADATA.FETCH_SUCCESS, result);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getStrands = async (req: Request, res: Response) => {
  try {
    const result = await MetadataService.getStrands();
    return sendResponse(res, API_MESSAGES.METADATA.FETCH_SUCCESS, result);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getGrades = async (req: Request, res: Response) => {
  try {
    const result = await MetadataService.getGrades();
    return sendResponse(res, API_MESSAGES.METADATA.FETCH_SUCCESS, result);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const result = await MetadataService.getDepartments();
    return sendResponse(res, API_MESSAGES.METADATA.FETCH_SUCCESS, result);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};
