import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { validateEmail, validatePassword } from '../utils/helpers';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email',
      });
      return;
    }

    if (!validatePassword(password)) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    const user = await authService.register({ email, password, name });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, deviceFingerprint } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    const loginResult = await authService.login(
      email,
      password,
      ipAddress,
      userAgent,
      deviceFingerprint
    );

    // Set token in HTTP-only cookie
    res.cookie('token', loginResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: loginResult.user,
        requiresAdditionalVerification: loginResult.requiresAdditionalVerification,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('token');
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed',
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is attached to request by auth middleware
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const userDetails = await authService.getUserById(user.id);

    res.status(200).json({
      success: true,
      data: {
        id: userDetails?._id,
        email: userDetails?.email,
        name: userDetails?.name,
        role: user.role, // Use role from token (could be 'user' or 'decoy')
        riskScore: userDetails?.riskScore,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user details',
    });
  }
};