import User, { IUser } from '../models/User.model';
import { generateToken } from '../config/jwt';
import riskEngineService from './riskEngine.service';
import geoLocationService from './geoLocation.service';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    riskScore: number;
  };
  token: string;
  requiresAdditionalVerification: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

class AuthService {
  async register(userData: RegisterData): Promise<IUser> {
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const user = await User.create({
      ...userData,
      behavioralPatterns: {
        typicalLoginTimes: [new Date().getHours().toString()],
        deviceFingerprints: [],
      },
    });

    return user;
  }

  async login(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string,
    deviceFingerprint?: string
  ): Promise<LoginResponse> {
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      await user.incrementFailedAttempts();
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts on successful password verification
    await user.resetFailedAttempts();

    // Perform risk assessment
    const riskAssessment = await riskEngineService.assessLoginRisk(
      user,
      ipAddress,
      userAgent,
      deviceFingerprint
    );

    // Get location from IP
    const location = await geoLocationService.getLocationFromIp(ipAddress);

    // Update user's last login info
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    user.lastLoginLocation = location;
    
    // Update behavioral patterns
    const currentHour = new Date().getHours().toString();
    if (!user.behavioralPatterns.typicalLoginTimes?.includes(currentHour)) {
      user.behavioralPatterns.typicalLoginTimes = [
        ...(user.behavioralPatterns.typicalLoginTimes || []),
        currentHour,
      ].slice(-10); // Keep last 10 login times
    }

    // Update device fingerprints if provided
    if (deviceFingerprint && !user.behavioralPatterns.deviceFingerprints?.includes(deviceFingerprint)) {
      user.behavioralPatterns.deviceFingerprints = [
        ...(user.behavioralPatterns.deviceFingerprints || []),
        deviceFingerprint,
      ].slice(-5); // Keep last 5 devices
    }

    await user.save();

    // Generate token with role based on risk assessment
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: riskAssessment.role,
      riskScore: riskAssessment.score,
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: riskAssessment.role,
        riskScore: riskAssessment.score,
      },
      token,
      requiresAdditionalVerification: riskAssessment.requiresAdditionalVerification,
    };
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password') as Promise<IUser | null>;
  }
}

export default new AuthService();