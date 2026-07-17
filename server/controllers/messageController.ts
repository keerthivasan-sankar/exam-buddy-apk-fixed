import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Message from '../models/Message';
import User from '../models/User';

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatType, chatId } = req.params;
    const since = req.query.since ? parseInt(req.query.since as string) : 0;
    
    // For private chats, handle bidirectional chat ID matching
    const query: any = {
      chatType,
      timestamp: { $gt: new Date(since) }
    };
    
    if (chatType === 'private') {
      const reversedChatId = chatId.split('_').reverse().join('_');
      query.chatId = { $in: [chatId, reversedChatId] };
    } else {
      query.chatId = chatId;
    }

    const messages = await Message.find(query).sort({ timestamp: 1 }).limit(100);
    res.json({ data: messages });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { message, messageType, chatType, chatId, fileUrl, latitude, longitude } = req.body;
    
    const newMessage = await Message.create({
      userId: user._id,
      userName: user.name,
      message,
      messageType: messageType || 'text',
      chatType,
      chatId,
      fileUrl,
      latitude,
      longitude
    });

    res.status(201).json({ data: newMessage });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
