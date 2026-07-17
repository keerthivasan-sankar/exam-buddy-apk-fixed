import mongoose, { Schema, Document } from 'mongoose';

export interface IExam extends Document {
  userId: mongoose.Types.ObjectId;
  examName: string;
  examDate: string;
  examCity: string;
  examCenter: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examName: { type: String, required: true },
    examDate: { type: String, required: true },
    examCity: { type: String, required: true },
    examCenter: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IExam>('Exam', ExamSchema);
