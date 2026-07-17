import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  examName: string;
  examDate: string;
  examCity: string;
  members: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    examName: { type: String, required: true },
    examDate: { type: String, required: true },
    examCity: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IGroup>('Group', GroupSchema);
