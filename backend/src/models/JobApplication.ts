import mongoose, { Schema, Document } from 'mongoose';

export interface IJobApplication extends Document {
  job: mongoose.Types.ObjectId;
  worker: mongoose.Types.ObjectId;
  employer: mongoose.Types.ObjectId;
  appliedBy?: mongoose.Types.ObjectId; // The contractor who submitted this
  groupId?: string; // Unique ID to group bulk applications
  status: 'Pending' | 'Offer Sent' | 'Accepted' | 'Completed' | 'Rejected' | 'Cancelled';
  workersProvided: number;
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema: Schema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  worker: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  employer: { type: Schema.Types.ObjectId, ref: 'Employer', required: true },
  appliedBy: { type: Schema.Types.ObjectId, ref: 'Worker' },
  groupId: { type: String },
  status: { type: String, enum: ['Pending', 'Offer Sent', 'Accepted', 'Completed', 'Rejected', 'Cancelled'], default: 'Pending' },
  workersProvided: { type: Number, default: 1 }
}, { timestamps: true });

// Prevent a worker from applying to the same job multiple times
JobApplicationSchema.index({ job: 1, worker: 1 }, { unique: true });

export default mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);
