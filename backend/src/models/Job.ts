import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  employer: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  address: string;
  requiredSkills: string[];
  workersRequired: number;
  dailyWage: number;
  perks: {
    accommodationAvailable: boolean;
    foodAvailable: boolean;
    transportAvailable: boolean;
    safetyEquipmentAvailable: boolean;
  };
  startDate: Date;
  endDate?: Date;
  applicationDeadline: Date;
  workDuration: string; // e.g. "2 weeks", "3 months"
  timing: string; // e.g. "9:00 AM to 5:00 PM"
  reportingTime: string; // e.g. "8:30 AM"
  jobType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Daily Wage';
  workloadLevel: 'Low' | 'Medium' | 'High' | 'Heavy';
  urgencyLevel: 'Normal' | 'Urgent' | 'Immediate' | 'Emergency Hiring';
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema({
  employer: { type: Schema.Types.ObjectId, ref: 'Employer', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  address: { type: String, required: true },
  requiredSkills: [{ type: String }],
  workersRequired: { type: Number, required: true, min: 1 },
  dailyWage: { type: Number, required: true },
  perks: {
    accommodationAvailable: { type: Boolean, default: false },
    foodAvailable: { type: Boolean, default: false },
    transportAvailable: { type: Boolean, default: false },
    safetyEquipmentAvailable: { type: Boolean, default: false }
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  applicationDeadline: { type: Date, required: true },
  workDuration: { type: String, required: true },
  timing: { type: String, default: 'Flexible' },
  reportingTime: { type: String, default: '9:00 AM' },
  jobType: { type: String, enum: ['Full-Time', 'Part-Time', 'Contract', 'Daily Wage'], required: true },
  workloadLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Heavy'], required: true },
  urgencyLevel: { type: String, enum: ['Normal', 'Urgent', 'Immediate', 'Emergency Hiring'], default: 'Normal' },
  status: { type: String, enum: ['Open', 'In Progress', 'Completed', 'Cancelled'], default: 'Open' }
}, { timestamps: true });

JobSchema.index({ location: '2dsphere' });

export default mongoose.model<IJob>('Job', JobSchema);
