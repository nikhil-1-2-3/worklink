import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployer extends Document {
  user: mongoose.Types.ObjectId;
  fullName: string;
  address: string;
  city: string;
  state: string;
  profileImage?: string;
  company?: mongoose.Types.ObjectId;
  trustScore: number;
  averageRating: number;
  totalReviews: number;
  sumRatings: number;
  createdAt: Date;
  updatedAt: Date;
}

const EmployerSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  profileImage: { type: String },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  sumRatings: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IEmployer>('Employer', EmployerSchema);
