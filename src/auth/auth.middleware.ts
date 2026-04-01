import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors.util';
import { jwtService } from './jwt.service';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyToken(token);

    req.headers['x-user-id'] = payload.userId;
    req.headers['x-user-role'] = payload.role || 'user';

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = jwtService.verifyToken(token);

      req.headers['x-user-id'] = payload.userId;
      req.headers['x-user-role'] = payload.role || 'user';
    }

    next();
  } catch (error) {
    next();
  }
};