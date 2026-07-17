import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    gender: z.string(),
    homeCity: z.string().min(2, "Home city must be at least 2 characters"),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
  }),
});

export const createExamSchema = z.object({
  body: z.object({
    examName: z.string().min(2, "Exam name must be at least 2 characters"),
    examDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
    examCity: z.string().min(2, "Exam city must be at least 2 characters"),
    examCenter: z.string().min(2, "Exam center must be at least 2 characters"),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1, "Message cannot be empty"),
    messageType: z.enum(['text', 'image', 'video', 'file', 'location']).optional(),
    chatType: z.enum(['global', 'group', 'private']),
    chatId: z.string(),
    fileUrl: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
});

export const blockUserSchema = z.object({
  body: z.object({
    blockedId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
  }),
});

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Group name must be at least 3 characters"),
    examName: z.string(),
    examDate: z.string(),
    examCity: z.string(),
  }),
});
