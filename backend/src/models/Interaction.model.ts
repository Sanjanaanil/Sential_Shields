import mongoose, { Document, Schema } from 'mongoose';

export interface IInteraction extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  deviceFingerprint?: string;
  riskScore: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

const interactionSchema = new Schema<IInteraction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['login', 'logout', 'failed_login', 'page_view', 'api_call', 'sensitive_action'],
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    location: {
      country: String,
      city: String,
      coordinates: [Number, Number],
    },
    deviceFingerprint: String,
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics
interactionSchema.index({ userId: 1, timestamp: -1 });
interactionSchema.index({ ipAddress: 1, timestamp: -1 });
interactionSchema.index({ riskScore: -1 });

const Interaction = mongoose.model<IInteraction>('Interaction', interactionSchema);

export default Interaction;