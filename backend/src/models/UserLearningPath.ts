import mongoose, { Document, Schema } from 'mongoose';

export interface IUserLearningPath extends Document {
  user: mongoose.Types.ObjectId;
  learningPath: mongoose.Types.ObjectId;
  completedSteps: number[]; // Indices of the steps in the LearningPath that have been completed
  isCompleted: boolean;
  enrolledAt: Date;
  completedAt?: Date;
}

const UserLearningPathSchema = new Schema<IUserLearningPath>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  learningPath: {
    type: Schema.Types.ObjectId,
    ref: 'LearningPath',
    required: true,
  },
  completedSteps: [{
    type: Number,
  }],
  isCompleted: {
    type: Boolean,
    default: false,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  }
}, {
  timestamps: true,
});

// Ensure a user can only enroll in a path once
UserLearningPathSchema.index({ user: 1, learningPath: 1 }, { unique: true });

export default mongoose.model<IUserLearningPath>('UserLearningPath', UserLearningPathSchema);
