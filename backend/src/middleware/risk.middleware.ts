import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import riskEngineService from '../services/riskEngine.service';
import User from '../models/User.model';

interface RiskMiddlewareOptions {
  threshold?: number; // Custom risk threshold
  action?: string; // Action being performed
  trackInteraction?: boolean; // Whether to log this interaction
}

export const assessRisk = (options: RiskMiddlewareOptions = {}) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip if no user (public route)
      if (!req.user) {
        next();
        return;
      }

      const user = await User.findById(req.user.id);
      
      if (!user) {
        next();
        return;
      }

      // For high-risk actions, we might want to reassess
      if (options.action === 'sensitive' || options.threshold) {
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const deviceFingerprint = req.body.deviceFingerprint || req.headers['x-device-fingerprint'];

        // Perform quick risk assessment
        const riskAssessment = await riskEngineService.assessLoginRisk(
          user,
          ipAddress,
          userAgent,
          deviceFingerprint as string
        );

        // Update the user's role in the request based on new assessment
        req.user.role = riskAssessment.role;
        
        // If risk exceeds threshold, block or flag
        if (riskAssessment.score > (options.threshold || 70)) {
          res.status(403).json({
            success: false,
            message: 'This action requires additional verification',
            requiresVerification: true,
            riskScore: riskAssessment.score,
          });
          return;
        }
      }

      // Attach risk info to request for downstream use
      (req as any).riskInfo = {
        score: user.riskScore,
        lastAssessment: new Date(),
      };

      next();
    } catch (error) {
      console.error('Risk assessment middleware error:', error);
      next(); // Continue even if risk assessment fails
    }
  };
};

// Middleware to track interactions for behavioral analysis
export const trackInteraction = (_p0: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        // Log interaction (async, don't wait)
        riskEngineService.assessLoginRisk(
          await User.findById(req.user.id) as any,
          ipAddress,
          userAgent,
          req.body.deviceFingerprint
        ).catch(console.error);
      }
      next();
    } catch (error) {
      console.error('Interaction tracking error:', error);
      next();
    }
  };
};