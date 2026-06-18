import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  job: mongoose.Types.ObjectId;
  employer: mongoose.Types.ObjectId;
  worker: mongoose.Types.ObjectId;
  rating: number; // 1 to 5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  employer: { type: Schema.Types.ObjectId, ref: 'Employer', required: true },
  worker: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

// Ensure an employer can only review a worker once per job
ReviewSchema.index({ job: 1, employer: 1, worker: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
