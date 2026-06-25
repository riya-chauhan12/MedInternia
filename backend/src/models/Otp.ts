import mongoose, { Schema, Document } from 'mongoose';

export type OtpPurpose = 'signup' | 'reset';

export interface IOtp extends Document {
  email: string;
  purpose: OtpPurpose;
  otpHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const OtpSchema: Schema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, required: true, enum: ['signup', 'reset'] },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

OtpSchema.index({ email: 1, purpose: 1 }, { unique: true });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOtp>('Otp', OtpSchema);
