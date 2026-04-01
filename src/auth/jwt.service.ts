import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.util';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  email?: string;
  role?: string;
}

export class JwtService {
  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}

export const jwtService = new JwtService();