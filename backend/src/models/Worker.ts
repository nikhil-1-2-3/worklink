import mongoose, { Schema, Document } from 'mongoose';

export interface IWorker extends Document {
  user: mongoose.Types.ObjectId;
  fullName: string;
  address: string;
  city: string;
  state: string;
  profileImage?: string;
  skills: string[];
  experienceYears: number;
  preferredWage: number;
  languages: string[];
  location?: {
    type: string;
    coordinates: number[];
  };
  preferredWorkingRadius: number; // in km
  availabilityStatus: 'Available Today' | 'Available Tomorrow' | 'Available This Week' | 'Available This Month' | 'Not Available';
  certifications: string[];
  trustScore: number;
  profileCompletion: number;
  aadhaarNumber?: string;
  aadhaarDocumentUrl?: string;
  otherDocumentUrl?: string;
  hasDigitalPassport: boolean;
  passportId?: string;
  passportExpiry?: Date;
  dob?: Date;
  isContractor: boolean; // Deprecated, keeping for backwards compatibility initially
  contractorStatus: 'None' | 'Gathering Team' | 'Pending' | 'Approved' | 'Rejected';
  commissionRate: number;
  managedBy?: mongoose.Types.ObjectId;
  teamSize: number;
  averageRating: number;
  totalReviews: number;
  sumRatings: number;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkerSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  profileImage: { type: String },
  skills: [{ type: String }],
  experienceYears: { type: Number, default: 0 },
  preferredWage: { type: Number, default: 0 },
  languages: [{ type: String }],
  aadhaarNumber: { type: String },
  aadhaarDocumentUrl: { type: String },
  otherDocumentUrl: { type: String },
  hasDigitalPassport: { type: Boolean, default: false },
  passportId: { type: String },
  passportExpiry: { type: Date },
  dob: { type: Date },
  profileCompletion: { type: Number, default: 20 },
  isContractor: { type: Boolean, default: false },
  contractorStatus: { type: String, enum: ['None', 'Gathering Team', 'Pending', 'Approved', 'Rejected'], default: 'None' },
  commissionRate: { type: Number, default: 0 },
  managedBy: { type: Schema.Types.ObjectId, ref: 'Worker' },
  teamSize: { type: Number, default: 1 },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  preferredWorkingRadius: { type: Number, default: 10 },
  availabilityStatus: {
    type: String,
    enum: ['Available Today', 'Available Tomorrow', 'Available This Week', 'Available This Month', 'Not Available'],
    default: 'Available This Week'
  },
  certifications: [{ type: String }],
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  profileCompletionPercentage: { type: Number, default: 20 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  sumRatings: { type: Number, default: 0 },
  badges: [{ type: String }]
}, { timestamps: true });

// Create a geospatial index on the location field
WorkerSchema.index({ location: '2dsphere' });

export default mongoose.model<IWorker>('Worker', WorkerSchema);
