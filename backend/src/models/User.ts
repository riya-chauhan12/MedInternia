import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { AppRole } from '../middleware/permissions';

export interface IUser extends Document {
  following?: mongoose.Types.ObjectId[];
  followers?: mongoose.Types.ObjectId[];
  solvedCases?: mongoose.Types.ObjectId[];
  savedCases?: mongoose.Types.ObjectId[];
  savedJobs?: mongoose.Types.ObjectId[];
  savedWebinars?: mongoose.Types.ObjectId[];
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordResetToken?: string;
passwordResetExpires?: Date;
  passwordChangedAt?: Date;
  loginAttempts?: number;
  lockoutUntil?: Date | null;
  userType: AppRole;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  // Points and rating system
  points: number;
  totalRatings: number;
  averageRating: number;
  // Collaboration platform fields
  profileScore: number; // Overall profile completeness score
  badges?: string[];
  credits?: number;
  streak: number; // Current active streak (days)
  longestStreak: number;
  lastActivityDate?: Date;
  casesAnalyzed: number;
  upvotesReceived: number;
  peerReviewsGiven: number;
  peerReviewsReceived: number;
  certificatesEarned: number;
  linkedInProfile?: string;
  githubProfile?: string;
  orcidId?: string;
  publications?: {
    title: string;
    year: string;
    journal: string;
    url: string;
  }[];
  bio?: string;
  profilePicture?: string;
  // Doctor specific fields
  specialization?: string;
  licenseNumber?: string;
  experience?: number;
  qualifications?: string[];
  isVerifiedDoctor?: boolean; // KYC verification
  verificationDocuments?: string[];
  mentoringCredits?: number; // Credits for mentoring interns
  // Intern specific fields
  medicalSchool?: string;
  yearOfStudy?: number;
  interests?: string[];
  skills?: string[];
  mentorDoctor?: mongoose.Types.ObjectId;
  academicAchievements?: string[];
  careerGoals?: string[];
  // Patient specific fields
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  // Common fields
  isActive: boolean;
  isVerified: boolean;
  messagePrivacy?: 'anyone' | 'verified_only' | 'none';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AddressSchema = new Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String }
});

const EmergencyContactSchema = new Schema({
  name: { type: String },
  phone: { type: String },
  relationship: { type: String }
});

const UserSchema = new Schema<IUser>({
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  solvedCases: [{ type: Schema.Types.ObjectId, ref: 'Case' }],
  savedCases: [{ type: Schema.Types.ObjectId, ref: 'Case' }],
  savedJobs: [{ type: Schema.Types.ObjectId, ref: 'JobOpportunity' }],
  savedWebinars: [{ type: Schema.Types.ObjectId, ref: 'Webinar' }],
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: function (v: string) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(v);
      },
      message: 'Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character'
    },
    select: false
  },
  passwordResetToken: {
  type: String,
  select: false
},

passwordResetExpires: {
  type: Date,
  select: false
},
  passwordChangedAt: {
    type: Date,
    select: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: {
    type: Date,
    default: null
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: ['patient', 'doctor', 'intern', 'admin', 'hospital_staff', 'moderator']
  },
  phone: {
    type: String,
    match: [/^\+?[\d\s-()]+$/, 'Please add a valid phone number']
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: AddressSchema,
  // Points and rating system
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: [0, 'Total ratings cannot be negative']
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Average rating cannot be negative'],
    max: [5, 'Average rating cannot exceed 5']
  },
  // Collaboration platform fields
  profileScore: {
    type: Number,
    default: 0,
    min: [0, 'Profile score cannot be negative'],
    max: [100, 'Profile score cannot exceed 100']
  },
  badges: [{ type: String }],
  credits: {
    type: Number,
    default: 0,
    min: [0, 'Credits cannot be negative']
  },
  streak: {
    type: Number,
    default: 0,
    min: [0, 'Streak cannot be negative']
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: [0, 'Longest streak cannot be negative']
  },
  lastActivityDate: {
    type: Date,
    default: null
  },
  casesAnalyzed: {
    type: Number,
    default: 0,
    min: [0, 'Cases analyzed cannot be negative']
  },
  upvotesReceived: {
    type: Number,
    default: 0,
    min: [0, 'Upvotes received cannot be negative']
  },
  peerReviewsGiven: {
    type: Number,
    default: 0,
    min: [0, 'Peer reviews given cannot be negative']
  },
  peerReviewsReceived: {
    type: Number,
    default: 0,
    min: [0, 'Peer reviews received cannot be negative']
  },
  certificatesEarned: {
    type: Number,
    default: 0,
    min: [0, 'Certificates earned cannot be negative']
  },
  linkedInProfile: {
    type: String,
    match: [/^https:\/\/(www\.)?linkedin\.com\/.*/, 'Please provide a valid LinkedIn URL']
  },
  githubProfile: {
    type: String,
    match: [/^https:\/\/(www\.)?github\.com\/.*/, 'Please provide a valid GitHub URL']
  },
  orcidId: {
    type: String,
  },
  publications: [{
    title: { type: String },
    year: { type: String },
    journal: { type: String },
    url: { type: String }
  }],
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  profilePicture: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please provide a valid profile picture URL']
  },
  // Doctor specific fields
  specialization: {
    type: String,
    required: function (this: IUser) {
      return this.userType === 'doctor';
    }
  },
  licenseNumber: {
    type: String,
    required: function (this: IUser) {
      return this.userType === 'doctor';
    },
    sparse: true // Allow null values to be non-unique
  },
  experience: {
    type: Number,
    min: [0, 'Experience cannot be negative']
  },
  qualifications: [{
    type: String
  }],
  isVerifiedDoctor: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: String
  }],
  mentoringCredits: {
    type: Number,
    default: 0,
    min: [0, 'Mentoring credits cannot be negative']
  },
  // Intern specific fields
  medicalSchool: {
    type: String,
    required: function (this: IUser) {
      return this.userType === 'intern';
    }
  },
  yearOfStudy: {
    type: Number,
    min: [1, 'Year of study must be at least 1'],
    max: [7, 'Year of study cannot exceed 7'],
    required: function (this: IUser) {
      return this.userType === 'intern';
    }
  },
  interests: [{
    type: String
  }],
  skills: [{
    type: String
  }],
  mentorDoctor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  academicAchievements: [{
    type: String
  }],
  careerGoals: [{
    type: String
  }],
  // Patient specific fields
  emergencyContact: EmergencyContactSchema,
  medicalHistory: [{
    type: String
  }],
  allergies: [{
    type: String
  }],
  // Common fields
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  messagePrivacy: {
    type: String,
    enum: ['anyone', 'verified_only', 'none'],
    default: 'anyone'
  }
}, {
  timestamps: true
});

// Clamp mentoringCredits to non-negative before saving
UserSchema.pre('save', function (next) {
  if (this.mentoringCredits !== undefined && this.mentoringCredits < 0) {
    this.mentoringCredits = 0;
  }
  next();
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    (this as any).password = await bcrypt.hash((this as any).password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, (this as any).password);
};

// Index for better performance (email and licenseNumber already indexed via unique: true)
UserSchema.index({ userType: 1 });

export default mongoose.model<IUser>('User', UserSchema);
