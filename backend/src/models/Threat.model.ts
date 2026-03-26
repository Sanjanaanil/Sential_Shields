import mongoose, { Document, Schema } from 'mongoose';

export interface IThreat extends Document {
  threatId: string;
  type: 'brute_force' | 'bot' | 'scanner' | 'injection' | 'unauthorized_access' | 'anomaly' | 'decoy_triggered';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: {
    ipAddress: string;
    location?: {
      country: string;
      city: string;
      coordinates: [number, number];
    };
    userAgent?: string;
    deviceFingerprint?: string;
  };
  target: {
    resource: string;
    method?: string;
    endpoint?: string;
  };
  riskScore: number;
  status: 'detected' | 'analyzing' | 'mitigated' | 'false_positive' | 'ignored';
  details: {
    description: string;
    payload?: any;
    headers?: any;
    timestamp: Date;
  };
  behavioralIndicators: {
    failedAttempts?: number;
    velocity?: number;
    patternMatch?: string[];
    anomalyScore?: number;
  };
  mitigation: {
    action: string;
    timestamp?: Date;
    result?: string;
  }[];
  metadata: Record<string, any>;
  detectedAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const threatSchema = new Schema<IThreat>(
  {
    threatId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['brute_force', 'bot', 'scanner', 'injection', 'unauthorized_access', 'anomaly', 'decoy_triggered'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    source: {
      ipAddress: {
        type: String,
        required: true,
      },
      location: {
        country: String,
        city: String,
        coordinates: [Number, Number],
      },
      userAgent: String,
      deviceFingerprint: String,
    },
    target: {
      resource: {
        type: String,
        required: true,
      },
      method: String,
      endpoint: String,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['detected', 'analyzing', 'mitigated', 'false_positive', 'ignored'],
      default: 'detected',
    },
    details: {
      description: {
        type: String,
        required: true,
      },
      payload: Schema.Types.Mixed,
      headers: Schema.Types.Mixed,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    behavioralIndicators: {
      failedAttempts: Number,
      velocity: Number,
      patternMatch: [String],
      anomalyScore: Number,
    },
    mitigation: [
      {
        action: String,
        timestamp: Date,
        result: String,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
threatSchema.index({ threatId: 1 });
threatSchema.index({ type: 1, severity: 1 });
threatSchema.index({ status: 1 });
threatSchema.index({ 'source.ipAddress': 1 });
threatSchema.index({ detectedAt: -1 });
threatSchema.index({ riskScore: -1 });

const Threat = mongoose.model<IThreat>('Threat', threatSchema);

export default Threat;