import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { API_MESSAGES } from '../constants/messages.js';
import { sendResponse } from '../helpers/responseHelper.js';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, email, password, userType } = req.body;

    if (!password) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    if (!username && !email) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const result = await AuthService.login({ username, email, password, userType });
    return sendResponse(res, API_MESSAGES.AUTH.LOGIN_SUCCESS, result);
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return sendResponse(res, API_MESSAGES.AUTH.LOGIN_FAILED);
    }
    console.error('Login error:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await AuthService.logout(token);
    }

    return sendResponse(res, API_MESSAGES.AUTH.LOGOUT_SUCCESS);
  } catch (error) {
    console.error('Logout error:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return sendResponse(res, API_MESSAGES.AUTH.TOKEN_INVALID);
    }

    const decoded = await AuthService.verifyToken(token);
    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, decoded);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.AUTH.TOKEN_INVALID);
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // User is already attached by authenticateJWT middleware
    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, req.user);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const registerCollegeUser = async (req: Request, res: Response) => {
  try {
    const { first_name, middle_initial, last_name, email, contact_number, student_id, password, course_id, year_id } = req.body;

    if (!first_name || !last_name || !email || !password || !student_id) {
      console.warn('College registration validation failed - missing fields:', { 
        first_name: !!first_name, 
        last_name: !!last_name, 
        email: !!email, 
        password: !!password, 
        student_id: !!student_id 
      });
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const result = await AuthService.registerCollegeUser({
      first_name,
      middle_initial,
      last_name,
      email,
      contact_number,
      student_id,
      password,
      course_id,
      year_id
    });

    return sendResponse(res, API_MESSAGES.AUTH.REGISTER_SUCCESS, result);
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return sendResponse(res, API_MESSAGES.AUTH.EMAIL_EXISTS);
    }
    if (error.message === 'STUDENT_ID_EXISTS') {
      return sendResponse(res, API_MESSAGES.AUTH.STUDENT_ID_EXISTS);
    }
    console.error('Registration error:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const registerShsUser = async (req: Request, res: Response) => {
  try {
    const { first_name, middle_initial, last_name, email, contact_number, student_id, password, strand_id, grade_id } = req.body;

    if (!first_name || !last_name || !email || !password || !student_id) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const result = await AuthService.registerShsUser({
      first_name,
      middle_initial,
      last_name,
      email,
      contact_number,
      student_id,
      password,
      strand_id,
      grade_id
    });

    return sendResponse(res, API_MESSAGES.AUTH.REGISTER_SUCCESS, result);
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return sendResponse(res, API_MESSAGES.AUTH.EMAIL_EXISTS);
    }
    if (error.message === 'STUDENT_ID_EXISTS') {
      return sendResponse(res, API_MESSAGES.AUTH.STUDENT_ID_EXISTS);
    }
    console.error('Registration error:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const registerFacultyUser = async (req: Request, res: Response) => {
  try {
    const { first_name, middle_initial, last_name, email, contact_number, employee_id, password, department_id } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const result = await AuthService.registerFacultyUser({
      first_name,
      middle_initial,
      last_name,
      email,
      contact_number,
      employee_id,
      password,
      department_id
    });

    return sendResponse(res, API_MESSAGES.AUTH.REGISTER_SUCCESS, result);
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return sendResponse(res, API_MESSAGES.AUTH.EMAIL_EXISTS);
    }
    if (error.message === 'EMPLOYEE_ID_EXISTS') {
      return sendResponse(res, API_MESSAGES.AUTH.EMPLOYEE_ID_EXISTS);
    }
    console.error('Registration error:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const sendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const result = await AuthService.sendVerificationCode(email);
    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, result);
  } catch (error: any) {
    if (error.message === 'INVALID_EMAIL_DOMAIN') {
      return sendResponse(res, API_MESSAGES.AUTH.INVALID_EMAIL_DOMAIN);
    }
    if (error.message === 'EMAIL_ALREADY_REGISTERED') {
      return sendResponse(res, API_MESSAGES.AUTH.EMAIL_ALREADY_REGISTERED);
    }
    if (error.message === 'FAILED_TO_SEND_EMAIL') {
      return sendResponse(res, API_MESSAGES.AUTH.FAILED_TO_SEND_EMAIL);
    }
    console.error('Send verification error:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const verifyEmailCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const result = await AuthService.verifyEmailCode(email, code);
    
    if (!result.valid) {
      return sendResponse(res, API_MESSAGES.AUTH.INVALID_VERIFICATION_CODE);
    }

    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, result);
  } catch (error) {
    console.error('Verify email error:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const result = await AuthService.requestPasswordReset(email);
    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, result);
  } catch (error: any) {
    if (error.message === 'EMAIL_NOT_FOUND') {
      return sendResponse(res, {
        status: 404,
        message: 'Email not found'
      });
    }
    if (error.message === 'FAILED_TO_SEND_EMAIL') {
      return sendResponse(res, API_MESSAGES.AUTH.FAILED_TO_SEND_EMAIL);
    }
    console.error('Request password reset error:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const verifyPasswordResetCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const result = await AuthService.verifyPasswordResetCode(email, code);
    
    if (!result.valid) {
      return sendResponse(res, {
        status: 400,
        message: 'Invalid or expired reset code'
      });
    }

    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, result);
  } catch (error) {
    console.error('Verify password reset error:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    if (newPassword.length < 8) {
      return sendResponse(res, {
        status: 400,
        message: 'Password must be at least 8 characters'
      });
    }

    const result = await AuthService.updatePassword(email, code, newPassword);
    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, result);
  } catch (error: any) {
    if (error.message === 'INVALID_CODE') {
      return sendResponse(res, {
        status: 400,
        message: 'Invalid reset code'
      });
    }
    if (error.message === 'CODE_EXPIRED') {
      return sendResponse(res, {
        status: 400,
        message: 'Reset code has expired'
      });
    }
    if (error.message === 'USER_NOT_FOUND') {
      return sendResponse(res, {
        status: 404,
        message: 'User not found'
      });
    }
    console.error('Update password error:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};
