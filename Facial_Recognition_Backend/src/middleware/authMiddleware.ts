import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { API_MESSAGES } from '../constants/messages.js';
import { sendResponse } from '../helpers/responseHelper.js';

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  userType: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendResponse(res, API_MESSAGES.AUTH.TOKEN_INVALID);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;
    
    req.user = decoded;
    next();
  } catch (error) {
    return sendResponse(res, API_MESSAGES.AUTH.TOKEN_EXPIRED);
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendResponse(res, API_MESSAGES.GENERAL.FORBIDDEN);
    }
    next();
  };
};
