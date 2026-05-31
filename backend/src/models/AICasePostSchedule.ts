import mongoose, { Document, Schema } from 'mongoose';
import {
  AI_CASE_POSTING_INTERVALS,
  AI_CASE_REVIEW_STATUSES,
  AICasePostingInterval,
  AICaseReviewStatus,
  GeneratedAICase
} from '../services/aiCasePostingService';

export interface IAICasePostSchedule extends Document {
  author: mongoose.Types.ObjectId;
  generatedCase: GeneratedAICase;
  interval: AICasePostingInterval;
  scheduledFor: Date;
  nextRunAt: Date;
  reviewStatus: AICaseReviewStatus;
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  publishedCase?: mongoose.Types.ObjectId;
  lastPublishedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedCaseSchema = new Schema<GeneratedAICase>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    symptoms: [{
      type: String,
      trim: true
    }],
    patientInfo: {
      age: Number,
      gender: {
        type: String,
        enum: ['male', 'female', 'other']
      },
      medicalHistory: [{
        type: String,
        trim: true
      }],
      currentMedications: [{
        type: String,
        trim: true
      }]
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    treatment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true
    },
    specialization: {
      type: String,
      required: true,
      trim: true
    },
    aiSummary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500
    },
    reviewChecklist: [{
      type: String,
      trim: true
    }]
  },
  { _id: false }
);

const AICasePostScheduleSchema = new Schema<IAICasePostSchedule>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    generatedCase: {
      type: GeneratedCaseSchema,
      required: true
    },
    interval: {
      type: String,
      enum: AI_CASE_POSTING_INTERVALS,
      default: 'weekly'
    },
    scheduledFor: {
      type: Date,
      required: true
    },
    nextRunAt: {
      type: Date,
      required: true,
      index: true
    },
    reviewStatus: {
      type: String,
      enum: AI_CASE_REVIEW_STATUSES,
      default: 'pending',
      index: true
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    publishedCase: {
      type: Schema.Types.ObjectId,
      ref: 'Case'
    },
    lastPublishedAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

AICasePostScheduleSchema.index({ reviewStatus: 1, nextRunAt: 1, isActive: 1 });

export default mongoose.model<IAICasePostSchedule>(
  'AICasePostSchedule',
  AICasePostScheduleSchema
);
