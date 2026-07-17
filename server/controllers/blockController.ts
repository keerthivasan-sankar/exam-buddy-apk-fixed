import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Block from '../models/Block';

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user?.id;
    const { blockedId } = req.body;

    const block = await Block.create({
      blockerId,
      blockedId
    });

    res.status(201).json({ data: block });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'User already blocked' });
    }
    res.status(400).json({ error: error.message });
  }
};

export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user?.id;
    const blockedId = req.params.id;

    const result = await Block.findOneAndDelete({
      blockerId,
      blockedId
    });

    if (result) {
      res.json({ data: { success: true } });
    } else {
      res.status(404).json({ error: 'Block not found' });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const checkBlockStatus = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const targetUserId = req.params.id;

    const isBlockedByMe = await Block.exists({ blockerId: currentUserId, blockedId: targetUserId });
    const isBlockedByThem = await Block.exists({ blockerId: targetUserId, blockedId: currentUserId });

    res.json({ 
      data: { 
        isBlockedByMe: !!isBlockedByMe, 
        isBlockedByThem: !!isBlockedByThem 
      } 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
