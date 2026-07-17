import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Exam from '../models/Exam';
import User from '../models/User';
import mongoose from 'mongoose';

export const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userExams = await Exam.find({ userId });

    const allMatches: any[] = [];
    const seenKeys = new Set<string>();

    for (const exam of userExams) {
      // Find matching exams for other users
      const matchingExams = await Exam.find({
        userId: { $ne: userId },
        examName: exam.examName,
        examDate: exam.examDate,
        examCity: exam.examCity
      }).populate('userId');

      for (const matchExam of matchingExams) {
        const buddy = matchExam.userId; // populated user document
        if (buddy) {
          const buddyId = (buddy as any)._id.toString();
          const key = `${buddyId}_${exam._id}`;
          
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            allMatches.push({ buddy, exam });
          }
        }
      }
    }

    res.json({ data: allMatches });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
