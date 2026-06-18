import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  employer: mongoose.Types.ObjectId;
  companyName: string;
  businessAddress: string;
  registrationNumber?: string;
  isVerified: boolean;
}

const CompanySchema: Schema = new Schema({
  employer: { type: Schema.Types.ObjectId, ref: 'Employer', required: true },
  companyName: { type: String, required: true },
  businessAddress: { type: String, required: true },
  registrationNumber: { type: String },
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.model<ICompany>('Company', CompanySchema);
