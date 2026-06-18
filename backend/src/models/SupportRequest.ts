import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportRequest extends Document {
  phoneNumber: string;
  status: 'Pending' | 'Resolved';
  createdAt: Date;
  updatedAt: Date;
}

const supportRequestSchema = new Schema({
  phoneNumber: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Resolved'], default: 'Pending' }
}, {
  timestamps: true
});

export default mongoose.model<ISupportRequest>('SupportRequest', supportRequestSchema);
