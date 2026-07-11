import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningPath extends Document {
  title: string;
  description: string;
  category: string;
  badge: mongoose.Types.ObjectId;
  steps: {
    type: 'case' | 'quiz';
    title: string;
    description?: string;
    caseRef?: mongoose.Types.ObjectId;
    quiz?: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    };
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LearningPathSchema = new Schema<ILearningPath>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  badge: {
    type: Schema.Types.ObjectId,
    ref: 'Badge',
    required: true,
  },
  steps: [
    {
      type: {
        type: String,
        enum: ['case', 'quiz'],
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      description: String,
      caseRef: {
        type: Schema.Types.ObjectId,
        ref: 'Case',
      },
      quiz: {
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model<ILearningPath>('LearningPath', LearningPathSchema);
