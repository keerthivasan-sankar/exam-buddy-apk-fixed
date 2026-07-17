import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  message: string;
  messageType: 'text' | 'image' | 'video' | 'file' | 'location';
  chatType: 'global' | 'group' | 'private';
  chatId: string;
  fileUrl?: string;
  latitude?: number;
  longitude?: number;
  timestamp: Date;
}

const MessageSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    message: { type: String, required: true },
    messageType: { 
      type: String, 
      enum: ['text', 'image', 'video', 'file', 'location'], 
      default: 'text' 
    },
    chatType: { 
      type: String, 
      enum: ['global', 'group', 'private'], 
      required: true 
    },
    chatId: { type: String, required: true },
    fileUrl: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    timestamp: { type: Date, default: Date.now },
  }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
