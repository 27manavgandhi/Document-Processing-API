import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { UnauthorizedError } from '../utils/errors.util';
import { logger } from '../utils/logger.util';

interface ApiKey {
  key: string;
  hashedKey: string;
  userId: string;
  rateLimit?: number;
}

const apiKeys: Map<string, ApiKey> = new Map();

export const generateApiKey = async (userId: string): Promise<string> => {
  const key = `dpapi_${generateRandomString(32)}`;
  const hashedKey = await bcrypt.hash(key, 10);
  
  apiKeys.set(key, {
    key,
    hashedKey,
    userId,
    rateLimit: 1000,
  });
  
  return key;
};

export const apiKeyMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedError('API key required');
    }

    if (!apiKey.startsWith('dpapi_')) {
      throw new UnauthorizedError('Invalid API key format');
    }

    const keyData = apiKeys.get(apiKey);
    if (!keyData) {
      logger.warn('Invalid API key attempt', { apiKey: apiKey.substring(0, 10) });
      throw new UnauthorizedError('Invalid API key');
    }

    req.headers['x-user-id'] = keyData.userId;
    req.headers['x-auth-method'] = 'api-key';

    next();
  } catch (error) {
    next(error);
  }
};

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}