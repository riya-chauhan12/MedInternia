import mongoose, { Schema, Document } from 'mongoose';

export interface IJobOpportunity extends Document {
  title: string;
  company: string;
  location: {
    city: string;
    state: string;
    country: string;
    isRemote: boolean;
  };
  type: 'internship' | 'full-time' | 'part-time' | 'fellowship';
  specialization: string[];
  description: string;
  requirements: {
    education: string;
    experience: string;
    yearsOfExperience?: number; // Numerical years for filtering
    skills: string[];
    minimumPoints?: number; // Minimum platform points required
    requiredBadges?: mongoose.Types.ObjectId[]; // Required badges
  };
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  applicationDeadline: Date;
  contactEmail: string;
  externalUrl?: string;
  postedBy: mongoose.Types.ObjectId;
  visaSponsorship: boolean;
  isActive: boolean;
  applications: number;
  applicants: {
    user: mongoose.Types.ObjectId;
    appliedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const JobOpportunitySchema = new Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  location: {
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    isRemote: {
      type: Boolean,
      default: false
    }
  },
  type: {
    type: String,
    required: [true, 'Job type is required'],
    enum: ['internship', 'full-time', 'part-time', 'fellowship']
  },
  specialization: [{
    type: String,
    enum: ['general', 'cardiology', 'neurology', 'oncology', 'pediatrics', 'surgery', 'psychiatry', 'radiology', 'emergency', 'internal-medicine']
  }],
  description: {
    type: String,
    required: [true, 'Job description is required'],
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  requirements: {
    education: {
      type: String,
      required: [true, 'Education requirements are required']
    },
    experience: {
      type: String,
      required: [true, 'Experience requirements are required']
    },
    yearsOfExperience: {
      type: Number,
      default: 0
    },
    skills: [{
      type: String
    }],
    minimumPoints: {
      type: Number,
      min: [0, 'Minimum points cannot be negative']
    },
    requiredBadges: [{
      type: Schema.Types.ObjectId,
      ref: 'Badge'
    }]
  },
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  externalUrl: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please provide a valid URL']
  },
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Posted by reference is required']
  },
  visaSponsorship: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applications: {
    type: Number,
    default: 0,
    min: [0, 'Applications count cannot be negative']
  },
  applicants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }]
},{
  timestamps: true
});

// Indexes for performance
JobOpportunitySchema.index({ type: 1, isActive: 1 });
JobOpportunitySchema.index({ specialization: 1 });
JobOpportunitySchema.index({ applicationDeadline: 1 });
JobOpportunitySchema.index({ postedBy: 1 });
JobOpportunitySchema.index({ createdAt: -1 });

export default mongoose.model<IJobOpportunity>('JobOpportunity', JobOpportunitySchema);
