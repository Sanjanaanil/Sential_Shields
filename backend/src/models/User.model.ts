import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'decoy' | 'admin';
  riskScore: number; // 0-100, higher means more suspicious
  failedAttempts: number;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  lastLoginLocation?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  behavioralPatterns: {
    averageSessionDuration?: number;
    typicalLoginTimes?: string[];
    typicalLocations?: string[];
    deviceFingerprints?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementFailedAttempts(): Promise<void>;
  resetFailedAttempts(): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'decoy', 'admin'],
      default: 'user',
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
    lastLoginLocation: {
      country: String,
      city: String,
      coordinates: [Number, Number],
    },
    behavioralPatterns: {
      averageSessionDuration: Number,
      typicalLoginTimes: [String],
      typicalLocations: [String],
      deviceFingerprints: [String],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
userSchema.index({ email: 1 });
userSchema.index({ riskScore: -1 });
userSchema.index({ 'lastLoginLocation.country': 1 });

// Compare password method (will be implemented with bcrypt in service)
userSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

// Increment failed login attempts
userSchema.methods.incrementFailedAttempts = async function(): Promise<void> {
  this.failedAttempts += 1;
  
  // Increase risk score based on failed attempts
  if (this.failedAttempts > 3) {
    this.riskScore = Math.min(this.riskScore + 10, 100);
  }
  
  await this.save();
};

// Reset failed attempts on successful login
userSchema.methods.resetFailedAttempts = async function(): Promise<void> {
  this.failedAttempts = 0;
  await this.save();
};

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;