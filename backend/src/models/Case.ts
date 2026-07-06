import mongoose, { Document, Schema } from 'mongoose';
import { checkCompliance } from '../services/nerService';

export interface IComment extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  replies: IComment[];
  replyTo?: mongoose.Types.ObjectId; // Reference to the comment being replied to (for WhatsApp-style)
  likes: mongoose.Types.ObjectId[];
  ratedBy: mongoose.Types.ObjectId[]; // Array of users who rated
  rating?: number; // Average rating (optional)
  pinned?: boolean; // Indicates if the comment is pinned
  isFlagged?: boolean;
  flagReasons?: string[];
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface ICase extends Document {
  title: string;
  description: string;
  symptoms: string[];
  patientInfo: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    medicalHistory?: string[];
    currentMedications?: string[];
  };
  diagnosis?: string;
  treatment?: string;
  images?: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  specialization: string;
  doctor: mongoose.Types.ObjectId;
  comments: IComment[];
  likes: mongoose.Types.ObjectId[];
  isActive: boolean;
  isPatientCase: boolean; // True if posted by patient
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  moderationReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  moderationAuditTrail: {
    status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
    reason?: string;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt: Date;
  }[];
  pointsAwarded: number; // Points given to doctor for posting
  canRepost: boolean; // Indicates if the case can be reposted
  followUps: {
    author: mongoose.Types.ObjectId;
    content: string;
    outcome?: string;
    images?: string[];
    createdAt: Date;
  }[];
  aiSuggestions?: {
    suggestedCases: mongoose.Types.ObjectId[];
    relevanceScore: number;
    lastUpdated: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  ratedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  pinned: {
    type: Boolean,
    default: false
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReasons: [{
    type: String
  }],
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
}, {
  timestamps: true
});

const CaseSchema = new Schema<ICase>({
  title: {
    type: String,
    required: [true, 'Case title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Case description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  patientInfo: {
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot be more than 150']
    },
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
    trim: true,
    maxlength: [1000, 'Diagnosis cannot be more than 1000 characters']
  },
  treatment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Treatment cannot be more than 1000 characters']
  },
  images: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['beginner', 'intermediate', 'advanced']
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comments: [CommentSchema],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPatientCase: {
    type: Boolean,
    default: false
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'changes_requested'],
    default: 'approved'
  },
  moderationReason: {
    type: String,
    trim: true,
    maxlength: [1000, 'Moderation reason cannot be more than 1000 characters']
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  moderationAuditTrail: [{
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'changes_requested'],
      required: true
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Moderation reason cannot be more than 1000 characters']
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  pointsAwarded: {
    type: Number,
    default: 0,
    min: [0, 'Points awarded cannot be negative']
  },
    canRepost: {
      type: Boolean,
      default: false
    },
  followUps: [{
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Follow-up content is required'],
      trim: true,
      maxlength: [2000, 'Follow-up content cannot exceed 2000 characters']
    },
    outcome: {
      type: String,
      trim: true,
      maxlength: [1000, 'Outcome cannot exceed 1000 characters']
    },
    images: [{
      type: String,
      trim: true
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  aiSuggestions: {
    suggestedCases: [{
      type: Schema.Types.ObjectId,
      ref: 'Case'
    }],
    relevanceScore: {
      type: Number,
      min: [0, 'Relevance score cannot be negative'],
      max: [1, 'Relevance score cannot exceed 1']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Pre-save hook to audit title, description, and comments
CaseSchema.pre('save', async function(next) {
  const caseDoc = this;

  // 1. Audit case title or description if modified
  try {
    if (caseDoc.isModified('title') && caseDoc.title) {
      const res = await checkCompliance(caseDoc.title, caseDoc.patientInfo?.age);
      caseDoc.title = res.redacted_text;
    }
    if (caseDoc.isModified('description') && caseDoc.description) {
      const res = await checkCompliance(caseDoc.description, caseDoc.patientInfo?.age);
      caseDoc.description = res.redacted_text;
    }
  } catch (err) {
    console.error('Compliance check failed for Case title/description:', err);
  }

  // 2. Audit new or modified comments
  for (const comment of caseDoc.comments) {
    if (comment.isNew || comment.isModified('content')) {
      try {
        const res = await checkCompliance(comment.content, caseDoc.patientInfo?.age);
        comment.content = res.redacted_text;
        if (res.is_flagged) {
          comment.isFlagged = true;
          comment.flagReasons = res.flag_reasons;
          comment.moderationStatus = 'pending';
        } else {
          comment.isFlagged = false;
          comment.flagReasons = [];
          comment.moderationStatus = 'approved';
        }
      } catch (err) {
        console.error('Compliance check failed for Comment:', err);
      }
    }
  }

  next();
});

// Indexes for better performance
CaseSchema.index({ doctor: 1 });
CaseSchema.index({ specialization: 1 });
CaseSchema.index({ difficulty: 1 });
CaseSchema.index({ tags: 1 });
CaseSchema.index({ createdAt: -1 });
CaseSchema.index({ 'comments.author': 1 });

export default mongoose.model<ICase>('Case', CaseSchema);
