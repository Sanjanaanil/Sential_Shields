import Threat, { IThreat } from '../models/Threat.model';
import User from '../models/User.model';
import geoLocationService from './geoLocation.service';
import { v4 as uuidv4 } from 'uuid';

interface ThreatIndicator {
  type: IThreat['type'];
  severity: IThreat['severity'];
  source: {
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
  };
  target: {
    resource: string;
    method?: string;
    endpoint?: string;
  };
  details: {
    description: string;
    payload?: any;
    headers?: any;
  };
  behavioralIndicators?: {
    failedAttempts?: number;
    velocity?: number;
    patternMatch?: string[];
    anomalyScore?: number;
  };
}

class ThreatDetectionService {

  async detectThreat(indicator: ThreatIndicator): Promise<IThreat> {
    // Calculate risk score
    const riskScore = await this.calculateThreatRiskScore(indicator);
    
    // Determine severity based on risk score
    const severity = this.determineSeverity(riskScore);

    // Generate unique threat ID
    const threatId = `THREAT-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // Get location from IP
    const location = await geoLocationService.getLocationFromIp(indicator.source.ipAddress);

    // Create threat record
    const threat = await Threat.create({
      threatId,
      type: indicator.type,
      severity,
      source: {
        ...indicator.source,
        location,
      },
      target: indicator.target,
      riskScore,
      status: 'detected',
      details: {
        ...indicator.details,
        timestamp: new Date(),
      },
      behavioralIndicators: indicator.behavioralIndicators || {},
      detectedAt: new Date(),
    });

    // Auto-mitigation based on severity
    if (severity === 'critical' || severity === 'high') {
      await this.autoMitigate(threat);
    }

    return threat;
  }

  async analyzeBehavioralPattern(ipAddress: string, userId?: string): Promise<any> {
    const recentThreats = await Threat.find({
      'source.ipAddress': ipAddress,
      detectedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    });

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        // Analyze user behavior deviation
        return this.calculateAnomalyScore(user, recentThreats);
      }
    }

    return {
      threatCount: recentThreats.length,
      pattern: this.identifyPattern(recentThreats),
      riskVelocity: this.calculateVelocity(recentThreats),
    };
  }

  async getActiveThreats(): Promise<IThreat[]> {
    return Threat.find({
      status: { $in: ['detected', 'analyzing'] },
    }).sort({ riskScore: -1, detectedAt: -1 });
  }

  async getThreatById(threatId: string): Promise<IThreat | null> {
    return Threat.findOne({ threatId });
  }

  async updateThreatStatus(threatId: string, status: IThreat['status']): Promise<IThreat | null> {
    const update: any = { status };
    
    if (status === 'mitigated' || status === 'false_positive' || status === 'ignored') {
      update.resolvedAt = new Date();
    }

    return Threat.findOneAndUpdate(
      { threatId },
      update,
      { new: true }
    );
  }

  async addMitigationAction(threatId: string, action: string, result: string): Promise<IThreat | null> {
    return Threat.findOneAndUpdate(
      { threatId },
      {
        $push: {
          mitigation: {
            action,
            result,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );
  }

  async getThreatStatistics(timeframe: 'hour' | 'day' | 'week' | 'month'): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const threats = await Threat.find({
      detectedAt: { $gte: startDate },
    });

    return {
      total: threats.length,
      byType: this.groupBy(threats, 'type'),
      bySeverity: this.groupBy(threats, 'severity'),
      byStatus: this.groupBy(threats, 'status'),
      topSources: this.getTopSources(threats),
      timeline: this.getTimelineData(threats, timeframe),
    };
  }

  private async calculateThreatRiskScore(indicator: ThreatIndicator): Promise<number> {
    let score = 0;

    // Factor 1: Threat type base score
    const typeScores = {
      brute_force: 60,
      bot: 50,
      scanner: 40,
      injection: 70,
      unauthorized_access: 65,
      anomaly: 55,
      decoy_triggered: 80,
    };
    score += typeScores[indicator.type] || 50;

    // Factor 2: Behavioral indicators
    if (indicator.behavioralIndicators) {
      if (indicator.behavioralIndicators.failedAttempts) {
        score += Math.min(indicator.behavioralIndicators.failedAttempts * 5, 30);
      }
      if (indicator.behavioralIndicators.velocity) {
        score += Math.min(indicator.behavioralIndicators.velocity / 10, 20);
      }
      if (indicator.behavioralIndicators.anomalyScore) {
        score += indicator.behavioralIndicators.anomalyScore * 0.5;
      }
    }

    // Factor 3: Check for patterns in recent history
    const recentThreats = await Threat.find({
      'source.ipAddress': indicator.source.ipAddress,
      detectedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
    });

    if (recentThreats.length > 0) {
      score += recentThreats.length * 5; // Repeat offender
    }

    // Cap at 100
    return Math.min(100, Math.round(score));
  }

  private determineSeverity(riskScore: number): IThreat['severity'] {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  private async autoMitigate(threat: IThreat): Promise<void> {
    const mitigationActions = [];

    // Add mitigation actions based on threat type
    switch (threat.type) {
      case 'brute_force':
        mitigationActions.push({
          action: 'Rate limit IP',
          result: 'Added to rate limiting',
        });
        break;
      case 'injection':
        mitigationActions.push({
          action: 'Block payload patterns',
          result: 'Updated WAF rules',
        });
        break;
      case 'decoy_triggered':
        mitigationActions.push({
          action: 'Isolate and monitor',
          result: 'Added to high-risk watchlist',
        });
        break;
    }

    if (threat.severity === 'critical') {
      mitigationActions.push({
        action: 'Block IP temporarily',
        result: 'IP added to blocklist for 24 hours',
      });
    }

    // Save mitigation actions
    for (const action of mitigationActions) {
      await this.addMitigationAction(threat.threatId, action.action, action.result);
    }

    // Update threat status
    await this.updateThreatStatus(threat.threatId, 'mitigated');
  }

  private calculateAnomalyScore(_user: any, recentThreats: any[]): number {
    // Implement anomaly detection logic
    return Math.min(100, recentThreats.length * 10);
  }

  private identifyPattern(threats: IThreat[]): string {
    if (threats.length === 0) return 'normal';
    if (threats.length < 5) return 'low_activity';
    if (threats.length < 20) return 'medium_activity';
    return 'high_activity';
  }

  private calculateVelocity(threats: IThreat[]): number {
    if (threats.length < 2) return 0;
    
    const firstThreat = threats[0].detectedAt.getTime();
    const lastThreat = threats[threats.length - 1].detectedAt.getTime();
    const timeSpan = (lastThreat - firstThreat) / (1000 * 60); // in minutes
    
    return timeSpan > 0 ? threats.length / timeSpan : threats.length;
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((result, item) => {
      result[item[key]] = (result[item[key]] || 0) + 1;
      return result;
    }, {});
  }

  private getTopSources(threats: IThreat[]): any[] {
    const sourceCount = threats.reduce((acc: any, threat) => {
      const ip = threat.source.ipAddress;
      acc[ip] = (acc[ip] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(sourceCount)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
  }

  private getTimelineData(threats: IThreat[], timeframe: string): any[] {
    // Group threats by time intervals
    const intervals: Record<string, number> = {};
    
    threats.forEach(threat => {
      let key: string;
      const date = threat.detectedAt;
      
      switch (timeframe) {
        case 'hour':
          key = `${date.getHours()}:00`;
          break;
        case 'day':
          key = `${date.getHours()}:00`;
          break;
        case 'week':
          key = date.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'month':
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        default:
          key = date.toISOString();
      }
      
      intervals[key] = (intervals[key] || 0) + 1;
    });

    return Object.entries(intervals).map(([time, count]) => ({
      time,
      count,
    }));
  }
}

export default new ThreatDetectionService();