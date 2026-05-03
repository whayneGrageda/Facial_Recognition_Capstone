import type { ApiError } from '../types';

export const handleApiError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const apiError = error as ApiError;
    return apiError.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const getErrorMessage = (error: unknown, defaultMessage = 'An error occurred'): string => {
  return handleApiError(error) || defaultMessage;
};
