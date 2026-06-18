import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamInvite extends Document {
  contractor: mongoose.Types.ObjectId; // The worker trying to become a contractor
  worker: mongoose.Types.ObjectId; // The targeted worker
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeamInviteSchema: Schema = new Schema({
  contractor: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  worker: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Expired'], default: 'Pending' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// A worker can only have one pending/accepted invite from a specific contractor at a time
TeamInviteSchema.index({ contractor: 1, worker: 1, status: 1 });

export default mongoose.model<ITeamInvite>('TeamInvite', TeamInviteSchema);
