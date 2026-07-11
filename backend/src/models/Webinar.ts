import mongoose, { Schema, Document } from 'mongoose';

export interface IWebinar extends Document {
  title: string;
  description: string;
  host: mongoose.Types.ObjectId;
  type: 'webinar' | 'ama' | 'case-discussion' | 'live-conference';
  specialization: string[];
  scheduledAt: Date;
  duration: number; // in minutes
  maxParticipants?: number;
  registrationDeadline?: Date;
  meetingLink?: string;
  recordingUrl?: string;
  materials: {
    title: string;
    url: string;
    type: 'pdf' | 'video' | 'slides' | 'link';
  }[];
  participants: {
    user: mongoose.Types.ObjectId;
    registeredAt: Date;
    attended: boolean;
    feedback?: {
      rating: number;
      comments: string;
    };
  }[];
  tags: string[];
  polls: {
    _id?: mongoose.Types.ObjectId;
    question: string;
    options: string[];
    active: boolean;
    votes: Map<string, number>; // userId string -> option index
    createdAt: Date;
  }[];
  qna: {
    _id?: mongoose.Types.ObjectId;
    question: string;
    author: mongoose.Types.ObjectId | any;
    upvotes: mongoose.Types.ObjectId[];
    isAnswered: boolean;
    createdAt: Date;
  }[];
  isActive: boolean;
  isRecorded: boolean;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const WebinarSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Webinar title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Webinar description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  host: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Host reference is required']
  },
  type: {
    type: String,
    required: [true, 'Webinar type is required'],
    enum: ['webinar', 'ama', 'case-discussion', 'live-conference']
  },
  specialization: [{
    type: String,
    enum: ['general', 'cardiology', 'neurology', 'oncology', 'pediatrics', 'surgery', 'psychiatry', 'radiology', 'emergency', 'internal-medicine']
  }],
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  maxParticipants: {
    type: Number,
    min: [1, 'Must allow at least 1 participant']
  },
  registrationDeadline: {
    type: Date
  },
  meetingLink: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please provide a valid meeting URL']
  },
  recordingUrl: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please provide a valid recording URL']
  },
  materials: [{
    title: {
      type: String,
      required: [true, 'Material title is required']
    },
    url: {
      type: String,
      required: [true, 'Material URL is required'],
      match: [/^https?:\/\/.+/, 'Please provide a valid URL']
    },
    type: {
      type: String,
      required: [true, 'Material type is required'],
      enum: ['pdf', 'video', 'slides', 'link']
    }
  }],
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    attended: {
      type: Boolean,
      default: false
    },
    feedback: {
      rating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
      },
      comments: {
        type: String,
        maxlength: [500, 'Comments cannot exceed 500 characters']
      }
    }
  }],
  tags: [{
    type: String
  }],
  polls: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    active: { type: Boolean, default: true },
    votes: {
      type: Map,
      of: Number,
      default: {}
    },
    createdAt: { type: Date, default: Date.now }
  }],
  qna: [{
    question: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isAnswered: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isRecorded: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, {
  timestamps: true
});

// Indexes for performance
WebinarSchema.index({ host: 1, scheduledAt: -1 });
WebinarSchema.index({ type: 1, isActive: 1 });
WebinarSchema.index({ specialization: 1 });
WebinarSchema.index({ scheduledAt: 1 });
WebinarSchema.index({ status: 1 });
WebinarSchema.index({ 'participants.user': 1 });
WebinarSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.model<IWebinar>('Webinar', WebinarSchema);
