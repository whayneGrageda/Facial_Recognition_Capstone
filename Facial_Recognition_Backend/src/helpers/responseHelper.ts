import { Response } from 'express';

interface MessageConfig {
  status: number;
  message: string;
}

export const sendResponse = (
  res: Response,
  messageConfig: MessageConfig,
  data?: any
) => {
  return res.status(messageConfig.status).json({
    status: messageConfig.status,
    message: messageConfig.message,
    data,
  });
};

export const sendError = (
  res: Response,
  status: number,
  message: string,
  error?: any
) => {
  return res.status(status).json({
    status,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined,
  });
};
