import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderedTest {
  testType: string;
  result: string;
  orderedAt: Date;
}

export interface IClinicalSandboxAttempt extends Document {
  user: mongoose.Types.ObjectId;
  case: mongoose.Types.ObjectId;
  orderedTests: IOrderedTest[];
  proposedDiagnosis?: string;
  similarityScore?: number; // 0 to 1
  pointsAwarded?: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicalSandboxAttemptSchema = new Schema<IClinicalSandboxAttempt>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  case: {
    type: Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  orderedTests: [
    {
      testType: { type: String, required: true },
      result: { type: String, required: true },
      orderedAt: { type: Date, default: Date.now }
    }
  ],
  proposedDiagnosis: {
    type: String,
    trim: true
  },
  similarityScore: {
    type: Number,
    min: 0,
    max: 1
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Enforce unique attempt per user per case
ClinicalSandboxAttemptSchema.index({ user: 1, case: 1 }, { unique: true });

export default mongoose.model<IClinicalSandboxAttempt>('ClinicalSandboxAttempt', ClinicalSandboxAttemptSchema);
