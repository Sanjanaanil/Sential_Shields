import mongoose, { Document, Schema } from 'mongoose';

export interface IDecoy extends Document {
  decoyId: string;
  name: string;
  type: 'honeytoken' | 'honeypot' | 'fake_endpoint' | 'fake_file' | 'fake_credential' | 'canary';
  status: 'active' | 'triggered' | 'expired' | 'maintenance';
  deployment: {
    location: string;
    endpoint?: string;
    token?: string;
    path?: string;
  };
  triggers: {
    count: number;
    lastTriggeredAt?: Date;
    history: {
      timestamp: Date;
      sourceIp: string;
      userAgent?: string;
      action: string;
      metadata: any;
    }[];
  };
  configuration: {
    riskLevel: 'low' | 'medium' | 'high';
    alertOnTrigger: boolean;
    autoBlock: boolean;
    expirationDate?: Date;
    targetAttractor: string[]; // What type of attackers it attracts
  };
  behavioralPatterns: {
    expectedAccessCount: number;
    expectedAccessFrequency: string;
    anomalousTriggers: number;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata: Record<string, any>;
}

const decoySchema = new Schema<IDecoy>(
  {
    decoyId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['honeytoken', 'honeypot', 'fake_endpoint', 'fake_file', 'fake_credential', 'canary'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'triggered', 'expired', 'maintenance'],
      default: 'active',
    },
    deployment: {
      location: {
        type: String,
        required: true,
      },
      endpoint: String,
      token: String,
      path: String,
    },
    triggers: {
      count: {
        type: Number,
        default: 0,
      },
      lastTriggeredAt: Date,
      history: [
        {
          timestamp: {
            type: Date,
            default: Date.now,
          },
          sourceIp: String,
          userAgent: String,
          action: String,
          metadata: Schema.Types.Mixed,
        },
      ],
    },
    configuration: {
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      alertOnTrigger: {
        type: Boolean,
        default: true,
      },
      autoBlock: {
        type: Boolean,
        default: false,
      },
      expirationDate: Date,
      targetAttractor: [String],
    },
    behavioralPatterns: {
      expectedAccessCount: {
        type: Number,
        default: 0,
      },
      expectedAccessFrequency: {
        type: String,
        enum: ['never', 'rarely', 'occasionally', 'frequently'],
        default: 'never',
      },
      anomalousTriggers: {
        type: Number,
        default: 0,
      },
    },
    expiresAt: Date,
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
decoySchema.index({ decoyId: 1 });
decoySchema.index({ type: 1, status: 1 });
decoySchema.index({ 'deployment.location': 1 });
decoySchema.index({ 'triggers.lastTriggeredAt': -1 });

const Decoy = mongoose.model<IDecoy>('Decoy', decoySchema);

export default Decoy;