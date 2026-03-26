import User, { IUser } from '../models/User.model';
import Interaction from '../models/Interaction.model';
import geoLocationService from './geoLocation.service';

interface RiskFactors {
  ipReputation: number;
  locationAnomaly: number;
  timeAnomaly: number;
  deviceAnomaly: number;
  failedAttempts: number;
  velocityCheck: number;
}

interface RiskAssessmentResult {
  score: number;
  factors: RiskFactors;
  role: 'user' | 'decoy';
  requiresAdditionalVerification: boolean;
}

class RiskEngineService {
  private readonly HIGH_RISK_THRESHOLD = 70;
  private readonly MEDIUM_RISK_THRESHOLD = 40;
  
  async assessLoginRisk(
    user: IUser,
    ipAddress: string,
    userAgent: string,
    deviceFingerprint?: string
  ): Promise<RiskAssessmentResult> {
    const factors: RiskFactors = {
      ipReputation: await this.checkIpReputation(ipAddress),
      locationAnomaly: await this.detectLocationAnomaly(user, ipAddress),
      timeAnomaly: this.detectTimeAnomaly(user),
      deviceAnomaly: await this.detectDeviceAnomaly(user, userAgent, deviceFingerprint),
      failedAttempts: this.calculateFailedAttemptsRisk(user.failedAttempts),
      velocityCheck: await this.checkLoginVelocity(user._id.toString(), ipAddress),
    };

    // Calculate weighted score
    const score = this.calculateWeightedScore(factors);
    
    // Determine role based on risk score
    const role = this.determineRole(score, user);
    
    // Log interaction
    await this.logInteraction(user._id.toString(), 'login', ipAddress, userAgent, {
      ...factors,
      deviceFingerprint,
      finalScore: score,
      assignedRole: role,
    });

    // Update user's risk score (decay over time)
    await this.updateUserRiskScore(user, score);

    return {
      score,
      factors,
      role,
      requiresAdditionalVerification: score > this.MEDIUM_RISK_THRESHOLD,
    };
  }

  private async checkIpReputation(ipAddress: string): Promise<number> {
    // Check if IP is in known malicious lists
    // For now, return a random score for demo
    // In production, integrate with IP reputation services
    const knownMaliciousIPs = ['1.1.1.1', '2.2.2.2']; // Example blocklist
    if (knownMaliciousIPs.includes(ipAddress)) {
      return 80;
    }
    return Math.random() * 30; // Simulated score
  }

  private async detectLocationAnomaly(user: IUser, currentIp: string): Promise<number> {
    try {
      const currentLocation = await geoLocationService.getLocationFromIp(currentIp);
      
      if (!user.lastLoginLocation || !user.lastLoginLocation.country) {
        return 0; // No baseline to compare
      }

      // If country changed significantly
      if (user.lastLoginLocation.country !== currentLocation.country) {
        // Check travel time feasibility
        const timeSinceLastLogin = Date.now() - (user.lastLoginAt?.getTime() || Date.now());
        const hoursSinceLastLogin = timeSinceLastLogin / (1000 * 60 * 60);
        
        // If impossible travel (less than 2 hours between distant countries)
        if (hoursSinceLastLogin < 2) {
          return 90; // Very high risk
        }
        return 40; // Medium risk for country change
      }

      return 0;
    } catch (error) {
      console.error('Error detecting location anomaly:', error);
      return 0;
    }
  }

  private detectTimeAnomaly(user: IUser): number {
    const currentHour = new Date().getHours();
    
    if (!user.behavioralPatterns?.typicalLoginTimes || 
        user.behavioralPatterns.typicalLoginTimes.length === 0) {
      return 0;
    }

    // Check if current hour is in typical login times
    const isTypical = user.behavioralPatterns.typicalLoginTimes.some(
      time => parseInt(time) === currentHour
    );

    if (!isTypical) {
      return 30; // Unusual time
    }

    return 0;
  }

  private async detectDeviceAnomaly(
    user: IUser,
    _userAgent: string,
    deviceFingerprint?: string
  ): Promise<number> {
    if (!deviceFingerprint || !user.behavioralPatterns?.deviceFingerprints) {
      return 0;
    }

    // Check if device fingerprint is known
    const isKnownDevice = user.behavioralPatterns.deviceFingerprints.includes(
      deviceFingerprint
    );

    if (!isKnownDevice) {
      return 50; // New device
    }

    return 0;
  }

  private calculateFailedAttemptsRisk(failedAttempts: number): number {
    if (failedAttempts === 0) return 0;
    if (failedAttempts <= 2) return 20;
    if (failedAttempts <= 5) return 50;
    return 80;
  }

  private async checkLoginVelocity(
    userId: string,
    _ipAddress: string
  ): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentAttempts = await Interaction.countDocuments({
      userId,
      action: 'login',
      timestamp: { $gte: fiveMinutesAgo },
    });

    if (recentAttempts > 10) return 90;
    if (recentAttempts > 5) return 60;
    if (recentAttempts > 2) return 30;
    
    return 0;
  }

  private calculateWeightedScore(factors: RiskFactors): number {
    const weights = {
      ipReputation: 0.25,
      locationAnomaly: 0.25,
      timeAnomaly: 0.1,
      deviceAnomaly: 0.15,
      failedAttempts: 0.15,
      velocityCheck: 0.1,
    };

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          factors.ipReputation * weights.ipReputation +
          factors.locationAnomaly * weights.locationAnomaly +
          factors.timeAnomaly * weights.timeAnomaly +
          factors.deviceAnomaly * weights.deviceAnomaly +
          factors.failedAttempts * weights.failedAttempts +
          factors.velocityCheck * weights.velocityCheck
        )
      )
    );
  }

  private determineRole(riskScore: number, user: IUser): 'user' | 'decoy' {
    // Admin users always get 'user' role regardless of risk
    if (user.role === 'admin') {
      return 'user';
    }

    // If risk score is very high, assign decoy role
    if (riskScore >= this.HIGH_RISK_THRESHOLD) {
      return 'decoy';
    }

    // For existing users with low risk, maintain user role
    if (user.riskScore < this.MEDIUM_RISK_THRESHOLD) {
      return 'user';
    }

    // If user has moderate risk but high current risk, assign decoy
    if (user.riskScore > this.MEDIUM_RISK_THRESHOLD && riskScore > this.MEDIUM_RISK_THRESHOLD) {
      return 'decoy';
    }

    return 'user';
  }

  private async logInteraction(
    userId: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    metadata: any
  ): Promise<void> {
    try {
      const location = await geoLocationService.getLocationFromIp(ipAddress);
      
      await Interaction.create({
        userId,
        action,
        ipAddress,
        userAgent,
        location,
        deviceFingerprint: metadata.deviceFingerprint,
        riskScore: metadata.finalScore || 0,
        metadata,
      });
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }

  private async updateUserRiskScore(user: IUser, currentRiskScore: number): Promise<void> {
    // Apply decay to existing risk score and combine with current
    const decayedOldScore = user.riskScore * 0.7; // 30% decay
    const newRiskScore = Math.min(100, Math.round((decayedOldScore + currentRiskScore) / 2));
    
    await User.findByIdAndUpdate(user._id, {
      riskScore: newRiskScore,
    });
  }
}

export default new RiskEngineService();