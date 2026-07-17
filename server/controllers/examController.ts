import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Exam from '../models/Exam';

export const getExams = async (req: AuthRequest, res: Response) => {
  try {
    const exams = await Exam.find({ userId: req.user?.id }).sort({ examDate: 1 });
    res.json({ data: exams });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createExam = async (req: AuthRequest, res: Response) => {
  try {
    const exam = await Exam.create({
      ...req.body,
      userId: req.user?.id,
    });
    res.status(201).json({ data: exam });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteExam = async (req: AuthRequest, res: Response) => {
  try {
    const exam = await Exam.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user?.id 
    });

    if (exam) {
      res.json({ data: { success: true } });
    } else {
      res.status(404).json({ error: 'Exam not found or unauthorized' });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
