export interface User {
  id: string;
  mobile: string;
  name: string;
  gender: string;
  homeCity: string;
  avatar?: string;
  verified: boolean;
  preferredTransport?: string;
  preferredLanguage?: string;
  bio?: string;
  studyStyle?: string;
  availability?: string;
  preferredStudyTime?: string;
  timeZone?: string;
  targetScore?: string;
  isOnline?: boolean;
  lastActive?: number;
}

export interface Exam {
  id: string;
  userId: string;
  examName: string;
  examDate: string;
  examCity: string;
  examCenter: string;
}

export interface Match {
  buddy: User;
  exam: Exam;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  chatId: string;
  isLocation?: boolean;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  blockedUserName: string;
  timestamp: number;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName?: string;
  chatId?: string;
  reason: string;
  timestamp: number;
  status: 'pending' | 'reviewed';
}
export interface Chat {
  id: string;
  type?: 'direct' | 'group';
  name?: string;
  examId?: string;
  participants: string[];
  lastMessage: string;
  timestamp: number;
  unreadCount?: Record<string, number>;
  buddy?: User; // Optional for direct chats where we populate it on the fly
}
