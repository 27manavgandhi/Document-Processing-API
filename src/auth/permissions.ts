import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.util';

export enum Permission {
  JOB_CREATE = 'job:create',
  JOB_READ = 'job:read',
  JOB_UPDATE = 'job:update',
  JOB_DELETE = 'job:delete',
  JOB_READ_ALL = 'job:read:all',
  ADMIN = 'admin',
}

export const rolePermissions: Record<string, Permission[]> = {
  user: [
    Permission.JOB_CREATE,
    Permission.JOB_READ,
    Permission.JOB_UPDATE,
    Permission.JOB_DELETE,
  ],
  admin: [
    Permission.JOB_CREATE,
    Permission.JOB_READ,
    Permission.JOB_UPDATE,
    Permission.JOB_DELETE,
    Permission.JOB_READ_ALL,
    Permission.ADMIN,
  ],
};

export const requirePermission = (...permissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = (req.headers['x-user-role'] as string) || 'user';
    const userPermissions = rolePermissions[userRole] || [];

    const hasPermission = permissions.some((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
};

export const requireOwnership = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  const role = req.headers['x-user-role'] as string;

  if (role === 'admin') {
    next();
    return;
  }

  const jobUserId = req.params.userId || req.body.userId;
  
  if (jobUserId && jobUserId !== userId) {
    next(new ForbiddenError('Access denied'));
    return;
  }

  next();
};