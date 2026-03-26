import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../config/jwt';
import User from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    riskScore?: number;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for token in cookies first, then in Authorization header
    let token = req.cookies?.token;
    
    if (!token) {
      token = extractTokenFromHeader(req.headers.authorization);
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      riskScore: decoded.riskScore,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
      });
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
      return;
    }

    next();
  };
};

// Middleware to check if user has decoy role (for serving decoy content)
export const isDecoy = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'decoy') {
    next(); // Not a decoy, continue normal flow
  } else {
    // User is a decoy, we might want to serve fake data
    // This can be handled by a separate decoy middleware or controller
    (req as any).isDecoy = true;
    next();
  }
};