import { User, Exam, Message, Match, Chat } from './types';

export const currentUser: User = {
  id: 'u1',
  mobile: '1234567890',
  name: 'Alex Johnson',
  gender: 'Male',
  homeCity: 'New York',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  verified: true,
  preferredTransport: 'Train',
  preferredLanguage: 'English, Spanish'
};

export const mockExams: Exam[] = [];

export const mockMatches: Match[] = [];

export const mockChats: Chat[] = [];

export const mockMessages: Message[] = [];
