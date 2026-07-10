import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload, verifyRefreshToken, generateToken } from '../utils/jwt';
import User, { IUser } from '../models/User';
import BlacklistedToken from '../models/BlacklistedToken';
import { getUserRole } from './permissions';
import type { AppRole } from './permissions';

export const blacklistToken = async (token: string, expiresAt: Date) => {
  await BlacklistedToken.create({ token, expiresAt });
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const exists = await BlacklistedToken.findOne({ token });
  return !!exists;
};

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    try {
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      const user = await User.findById(decoded.userId).select('-password +passwordChangedAt');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token - user not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      if (
        user.passwordChangedAt &&
        typeof decoded.iat === 'number' &&
        decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
      ) {
        return res.status(401).json({
          success: false,
          message: 'Password was changed. Please log in again.'
        });
      }

      req.user = user;
      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      }
    } catch (tokenError) {
      // Silently fall through for optional auth
    }
    next();
  } catch (error) {
    next();
  }
};

export const authorize = (...userTypes: AppRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const role = getUserRole(req);
    const hasAuthorizedRole = role === 'admin' || (role && userTypes.includes(role));

    if (!hasAuthorizedRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions',
        code: 'FORBIDDEN',
        role,
        allowedRoles: userTypes
      });
    }

    next();
  };
};

export const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required'
    });
  }
  
  // Add your API key validation logic here
  next();
};
