import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email?: string;
  mobile: string;
  password?: string;
  role: 'worker' | 'employer' | 'admin';
  isVerified: boolean;
  status: 'Unverified' | 'Pending Verification' | 'Verified' | 'Rejected' | 'Suspended' | 'Banned';
  isBanned: boolean;
  banReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['worker', 'employer', 'admin'], required: true },
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['Unverified', 'Pending Verification', 'Verified', 'Rejected', 'Suspended', 'Banned'], default: 'Unverified' },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String },
  otp: { type: String },
  otpExpires: { type: Date }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
