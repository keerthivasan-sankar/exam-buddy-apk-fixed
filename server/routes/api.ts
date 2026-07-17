import express from 'express';
import { registerUser, loginUser, changePassword, getUserProfile } from '../controllers/authController';
import { loginRateLimiter, accountLockout } from '../middleware/loginRateLimiter';
import { getExams, createExam, deleteExam } from '../controllers/examController';
import { getMatches } from '../controllers/matchController';
import { getMessages, sendMessage } from '../controllers/messageController';
import { blockUser, unblockUser, checkBlockStatus } from '../controllers/blockController';
import { createGroup, joinGroup, getGroups } from '../controllers/groupController';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { 
  registerSchema, 
  createExamSchema, 
  sendMessageSchema, 
  blockUserSchema, 
  createGroupSchema 
} from '../validations';

const router = express.Router();

// Auth Routes
router.post('/auth/register', validate(registerSchema), registerUser);
router.post('/auth/login', loginRateLimiter, accountLockout, loginUser);
router.post('/auth/change-password', protect, changePassword);
router.get('/auth/profile', protect, getUserProfile);

// Exam Routes
router.route('/exams')
  .get(protect, getExams)
  .post(protect, validate(createExamSchema), createExam);
router.delete('/exams/:id', protect, deleteExam);

// Match Routes
router.get('/matches', protect, getMatches);

// Message Routes
router.route('/messages')
  .post(protect, validate(sendMessageSchema), sendMessage);
router.get('/messages/:chatType/:chatId', protect, getMessages);

// Block Routes
router.route('/blocks')
  .post(protect, validate(blockUserSchema), blockUser);
router.route('/blocks/:id')
  .delete(protect, unblockUser);
router.get('/blocks/:id/check', protect, checkBlockStatus);

// Group Routes
router.route('/groups')
  .get(protect, getGroups)
  .post(protect, validate(createGroupSchema), createGroup);
router.post('/groups/:id/join', protect, joinGroup);

export default router;
