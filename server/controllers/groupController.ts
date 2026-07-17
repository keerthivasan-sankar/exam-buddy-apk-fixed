import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Group from '../models/Group';
import Exam from '../models/Exam';

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, examName, examDate, examCity } = req.body;
    const userId = req.user?.id;

    // Check if user has this exam
    const hasExam = await Exam.exists({
      userId,
      examName,
      examDate,
      examCity
    });

    if (!hasExam) {
      return res.status(403).json({ error: 'You must have this exam to create a group for it' });
    }

    const group = await Group.create({
      name,
      examName,
      examDate,
      examCity,
      members: [userId],
      createdBy: userId,
    });

    res.status(201).json({ data: group });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const joinGroup = async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id;
    const userId = req.user?.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user has matching exam
    const hasExam = await Exam.exists({
      userId,
      examName: group.examName,
      examDate: group.examDate,
      examCity: group.examCity
    });

    if (!hasExam) {
      return res.status(403).json({ error: 'You must have a matching exam to join this group' });
    }

    if (group.members.includes(userId as any)) {
      return res.status(400).json({ error: 'You are already a member of this group' });
    }

    group.members.push(userId as any);
    await group.save();

    res.json({ data: group });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getGroups = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userExams = await Exam.find({ userId });

    const groups: any[] = [];
    const seenGroupIds = new Set<string>();

    // Find groups for all exams the user has
    for (const exam of userExams) {
      const matchingGroups = await Group.find({
        examName: exam.examName,
        examDate: exam.examDate,
        examCity: exam.examCity
      }).populate('members', 'name avatar');

      for (const group of matchingGroups) {
        if (!seenGroupIds.has(group._id.toString())) {
          seenGroupIds.add(group._id.toString());
          groups.push(group);
        }
      }
    }

    res.json({ data: groups });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
