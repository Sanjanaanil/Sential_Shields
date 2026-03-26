import Decoy, { IDecoy } from '../models/Decoy.model';
import threatDetectionService from './threatDetection.service';
import { v4 as uuidv4 } from 'uuid';

interface DecoyDeploymentConfig {
  name: string;
  type: IDecoy['type'];
  location: string;
  config: {
    riskLevel: 'low' | 'medium' | 'high';
    alertOnTrigger: boolean;
    autoBlock: boolean;
    targetAttractor: string[];
    expirationDays?: number;
  };
}

class DecoyManagementService {
  async createDecoy(config: DecoyDeploymentConfig): Promise<IDecoy> {
    const decoyId = `DECOY-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const deployment: any = {
      location: config.location,
    };

    // Add deployment-specific fields based on type
    switch (config.type) {
      case 'honeytoken':
        deployment.token = this.generateHoneytoken();
        break;
      case 'fake_endpoint':
        deployment.endpoint = this.generateFakeEndpoint(config.name);
        break;
      case 'fake_file':
        deployment.path = this.generateFakeFilePath(config.name);
        break;
    }

    const expirationDate = config.config.expirationDays 
      ? new Date(Date.now() + config.config.expirationDays * 24 * 60 * 60 * 1000)
      : undefined;

    const decoy = await Decoy.create({
      decoyId,
      name: config.name,
      type: config.type,
      deployment,
      configuration: {
        riskLevel: config.config.riskLevel,
        alertOnTrigger: config.config.alertOnTrigger,
        autoBlock: config.config.autoBlock,
        expirationDate,
        targetAttractor: config.config.targetAttractor,
      },
      behavioralPatterns: {
        expectedAccessCount: 0,
        expectedAccessFrequency: 'never',
        anomalousTriggers: 0,
      },
      expiresAt: expirationDate,
    });

    return decoy;
  }

  async getActiveDecoys(): Promise<IDecoy[]> {
    return Decoy.find({
      status: 'active',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });
  }

  async getDecoyById(decoyId: string): Promise<IDecoy | null> {
    return Decoy.findOne({ decoyId });
  }

  async triggerDecoy(
    decoyId: string,
    sourceIp: string,
    userAgent: string,
    action: string,
    metadata: any = {}
  ): Promise<IDecoy | null> {
    const decoy = await Decoy.findOne({ decoyId });
    
    if (!decoy || decoy.status !== 'active') {
      return null;
    }

    // Update trigger information
    decoy.triggers.count += 1;
    decoy.triggers.lastTriggeredAt = new Date();
    decoy.triggers.history.push({
      timestamp: new Date(),
      sourceIp,
      userAgent,
      action,
      metadata,
    });

    // Update status if it was triggered
    decoy.status = 'triggered';

    // Analyze if this is anomalous
    if (this.isAnomalousTrigger(decoy)) {
      decoy.behavioralPatterns.anomalousTriggers += 1;
    }

    await decoy.save();

    // Create threat alert if configured
    if (decoy.configuration.alertOnTrigger) {
      await threatDetectionService.detectThreat({
        type: 'decoy_triggered',
        severity: this.mapRiskLevelToSeverity(decoy.configuration.riskLevel),
        source: {
          ipAddress: sourceIp,
          userAgent,
        },
        target: {
          resource: `decoy:${decoy.type}`,
          method: action,
          endpoint: decoy.deployment.endpoint || decoy.deployment.path,
        },
        details: {
          description: `Decoy "${decoy.name}" was triggered`,
          payload: metadata,
        },
        behavioralIndicators: {
          patternMatch: [decoy.type, ...decoy.configuration.targetAttractor],
          anomalyScore: this.calculateAnomalyScore(decoy),
        },
      });
    }

    // Auto-block if configured
    if (decoy.configuration.autoBlock && decoy.configuration.riskLevel === 'high') {
      await this.blockSource(sourceIp);
    }

    return decoy;
  }

  async updateDecoyStatus(decoyId: string, status: IDecoy['status']): Promise<IDecoy | null> {
    return Decoy.findOneAndUpdate(
      { decoyId },
      { status },
      { new: true }
    );
  }

  async deleteDecoy(decoyId: string): Promise<boolean> {
    const result = await Decoy.deleteOne({ decoyId });
    return result.deletedCount > 0;
  }

  async getDecoyStatistics(): Promise<any> {
    const decoys = await Decoy.find();
    
    return {
      total: decoys.length,
      byType: this.groupBy(decoys, 'type'),
      byStatus: this.groupBy(decoys, 'status'),
      byRiskLevel: this.groupBy(decoys, 'configuration.riskLevel'),
      totalTriggers: decoys.reduce((sum, d) => sum + d.triggers.count, 0),
      mostTriggered: this.getMostTriggeredDecoys(decoys),
      recentTriggers: await this.getRecentTriggers(),
    };
  }

  async getDecoyTriggerHistory(decoyId: string, limit: number = 50): Promise<any> {
    const decoy = await Decoy.findOne({ decoyId });
    
    if (!decoy) {
      return null;
    }

    return {
      decoyId: decoy.decoyId,
      name: decoy.name,
      type: decoy.type,
      totalTriggers: decoy.triggers.count,
      triggers: decoy.triggers.history
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
        .map(t => ({
          timestamp: t.timestamp,
          sourceIp: t.sourceIp,
          action: t.action,
          metadata: t.metadata,
        })),
    };
  }

  async getDecoysByType(type: IDecoy['type']): Promise<IDecoy[]> {
    return Decoy.find({ type, status: 'active' });
  }

  async expireDecoys(): Promise<number> {
    const result = await Decoy.updateMany(
      {
        expiresAt: { $lt: new Date() },
        status: 'active',
      },
      {
        status: 'expired',
      }
    );
    
    return result.modifiedCount;
  }

  private generateHoneytoken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `honeytoken_${token}`;
  }

  private generateFakeEndpoint(name: string): string {
    return `/api/${name.toLowerCase().replace(/\s+/g, '-')}/${uuidv4().substring(0, 8)}`;
  }

  private generateFakeFilePath(name: string): string {
    return `/var/www/decoys/${name.toLowerCase().replace(/\s+/g, '-')}.txt`;
  }

  private isAnomalousTrigger(decoy: IDecoy): boolean {
    // Check if this trigger pattern is anomalous
    const recentTriggers = decoy.triggers.history.slice(-5);
    
    if (recentTriggers.length < 2) return false;
    
    // Check for rapid successive triggers
    const lastTrigger = recentTriggers[recentTriggers.length - 1];
    const previousTrigger = recentTriggers[recentTriggers.length - 2];
    
    if (lastTrigger.timestamp.getTime() - previousTrigger.timestamp.getTime() < 1000) {
      return true; // Less than 1 second between triggers
    }
    
    return false;
  }

  private mapRiskLevelToSeverity(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (riskLevel) {
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      default: return 'medium';
    }
  }

  private calculateAnomalyScore(decoy: IDecoy): number {
    const baseScore = decoy.configuration.riskLevel === 'high' ? 60 : 
                     decoy.configuration.riskLevel === 'medium' ? 40 : 20;
    
    const triggerFrequency = decoy.triggers.count / 
      (Math.max(1, (Date.now() - decoy.createdAt.getTime()) / (24 * 60 * 60 * 1000)));
    
    const frequencyScore = Math.min(40, triggerFrequency * 10);
    
    return Math.min(100, baseScore + frequencyScore);
  }

  private async blockSource(ipAddress: string): Promise<void> {
    // Implementation would integrate with firewall/blocklist system
    console.log(`Blocking source IP: ${ipAddress}`);
    // In production, this would add to a blocklist or update firewall rules
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((result, item) => {
      const value = key.includes('.') 
        ? key.split('.').reduce((obj, k) => obj && obj[k], item)
        : item[key];
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }

  private getMostTriggeredDecoys(decoys: IDecoy[]): any[] {
    return decoys
      .filter(d => d.triggers.count > 0)
      .map(d => ({
        name: d.name,
        type: d.type,
        triggers: d.triggers.count,
        lastTriggered: d.triggers.lastTriggeredAt,
      }))
      .sort((a, b) => b.triggers - a.triggers)
      .slice(0, 5);
  }

  private async getRecentTriggers(limit: number = 10): Promise<any[]> {
    const decoys = await Decoy.find({
      'triggers.history.0': { $exists: true }
    });

    const allTriggers = decoys.flatMap(decoy => 
      decoy.triggers.history.map(trigger => ({
        decoyName: decoy.name,
        decoyType: decoy.type,
        ...trigger,
      }))
    );

    return allTriggers
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export default new DecoyManagementService();