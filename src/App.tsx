import React, { useState, useEffect, createContext, useContext } from 'react';
import { Compass, Users, BookOpen, User as UserIcon, MessageCircle, MoreVertical, Ban, LogIn, MapPin, Calendar, WifiOff } from 'lucide-react';
import ExamsList from './components/ExamsList';
import MatchList from './components/MatchList';
import Profile from './components/Profile';
import { toast, Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './hooks/useTheme';
import { AppContext } from './AppContext';
import { db } from './lib/firebase';
import { initializeApp, vibrate } from './lib/capacitor';
import { query, collection, where, onSnapshot, getDoc, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { Chat, User } from './types';

import AddExamModal from './components/AddExamModal';
import InstallPrompt from './components/InstallPrompt';
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import SafetyModal from './components/SafetyModal';

function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const { exams, user } = useContext(AppContext);
  const [matchCount, setMatchCount] = useState<number>(0);

  const previousMatchCountRef = React.useRef<number>(0);

  useEffect(() => {
    if (!user || exams.length === 0) {
      setMatchCount(0);
      previousMatchCountRef.current = 0;
      return;
    }
    
    const unsubscribe = onSnapshot(collection(db, 'exams'), (querySnapshot) => {
      const userIds = new Set<string>();
      
      for (const document of querySnapshot.docs) {
        const examData = document.data();
        if (examData.userId !== user.id) {
          // Check if this exam matches any of my exams (case-insensitive)
          for (const myExam of exams) {
            if (
              examData.examCity?.toLowerCase() === myExam.examCity?.toLowerCase() &&
              examData.examName?.toLowerCase() === myExam.examName?.toLowerCase()
            ) {
              userIds.add(examData.userId);
              break; // No need to check other exams if it already matches one
            }
          }
        }
      }
      
      const newMatchCount = userIds.size;
      
      if (previousMatchCountRef.current !== undefined && newMatchCount > previousMatchCountRef.current && previousMatchCountRef.current !== 0) {
        toast.success(`A new buddy is traveling to your exam center!`, {
          icon: '👥',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
      
      previousMatchCountRef.current = newMatchCount;
      setMatchCount(newMatchCount);
    }, (error) => {
      console.error("Error fetching matches count", error);
    });

    return () => unsubscribe();
  }, [user, exams]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-24 md:pb-0">
      <div className="bg-white dark:bg-gray-800 px-5 pt-6 pb-4 shadow-sm sticky top-0 z-10 md:hidden flex flex-col justify-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Exam Buddy</h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Connect, Travel, Succeed.</p>
      </div>
      <div className="hidden md:block bg-white dark:bg-gray-800 px-8 pt-8 pb-6 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Home Dashboard</h1>
      </div>
      
      <div className="p-6 md:p-8 overflow-y-auto flex-1 w-full max-w-5xl mx-auto">
        {/* Stats Cards */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-purple-500/20 shadow-lg flex justify-between items-center">
            <div>
              <h3 className="text-purple-100 text-sm font-semibold uppercase tracking-wider mb-1">Buddies Matched</h3>
              <p className="text-4xl font-bold">{matchCount}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <Users size={28} className="text-white" />
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <button 
            onClick={() => setIsExamModalOpen(true)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen size={28} />
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-200">Add Exam</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('matches')}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users size={28} />
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-200">Find Buddy</span>
          </button>
        </div>
        
        {/* Upcoming Exams */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Upcoming Exams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {exams.length > 0 ? (
            exams.map((exam, index) => (
              <motion.div 
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{exam.examName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1 font-medium">
                      <Calendar size={14} className="mr-1.5 text-blue-500" />
                      {new Date(exam.examDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    Upcoming
                  </span>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                  <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                    <MapPin size={16} className="mr-2 mt-0.5 text-gray-400 dark:text-gray-500 shrink-0" />
                    <span>
                      <span className="block font-medium text-gray-900 dark:text-gray-200 mb-0.5">{exam.examCity}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{exam.examCenter}</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't added any exams yet.</p>
              <button 
                onClick={() => setIsExamModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700 transition-colors inline-flex items-center text-sm font-medium"
              >
                <BookOpen size={16} className="mr-2" />
                Add Your First Exam
              </button>
            </div>
          )}
        </div>

        {/* Safety Tips */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Safety Tips</h2>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-800/30 max-w-2xl">
          <div className="flex gap-4">
            <div className="w-12 h-12 shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldCheckIcon />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-400 text-base">Always verify buddies</h4>
              <p className="text-amber-700 dark:text-amber-500 text-sm mt-1.5 leading-relaxed">Meet in public places and verify ID details before confirming travel plans.</p>
            </div>
          </div>
        </div>
      </div>
      <AddExamModal isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} />
    </div>
  );
}

function ShieldCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
  );
}

import ChatRoom from './components/ChatRoom';

function ChatList({ onChatActive }: { onChatActive?: (isActive: boolean) => void }) {
  const { user, isBlocked, blockUser } = useContext(AppContext);
  const [chats, setChats] = useState<Chat[]>([]);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);

  useEffect(() => {
    if (onChatActive) {
      onChatActive(!!activeChat);
    }
  }, [activeChat, onChatActive]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.id));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedChats: Chat[] = [];
      for (const docSnap of snapshot.docs) {
        const chatData = { id: docSnap.id, ...docSnap.data() } as Chat;
        if (chatData.type === 'direct') {
          const buddyId = chatData.participants.find(id => id !== user.id);
          if (buddyId) {
            const buddyDoc = await getDoc(doc(db, 'users', buddyId));
            if (buddyDoc.exists()) {
              chatData.buddy = { id: buddyDoc.id, ...buddyDoc.data() } as User;
            }
          }
        }
        loadedChats.push(chatData);
      }
      const getTimestamp = (ts: any) => {
        if (!ts) return Date.now();
        if (typeof ts === 'number') return ts;
        if (typeof ts.toMillis === 'function') return ts.toMillis();
        if (ts.seconds) return ts.seconds * 1000;
        return 0;
      };
      setChats(loadedChats.sort((a, b) => getTimestamp(b.timestamp) - getTimestamp(a.timestamp)));
    });
    return () => unsubscribe();
  }, [user]);

  const handleBlock = async (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      if (chat.type === 'group') {
        const chatRef = doc(db, 'chats', chat.id);
        const newParticipants = chat.participants.filter(p => p !== user.id);
        if (newParticipants.length === 0) {
          await deleteDoc(chatRef);
        } else {
          await updateDoc(chatRef, { participants: newParticipants });
        }
      } else {
        if (chat.buddy) {
          if (window.confirm(`Block ${chat.buddy.name}? They won't be able to message you or appear in your matches, and this chat will be deleted.`)) {
            await blockUser(chat.buddy.id, chat.buddy.name);
            await deleteDoc(doc(db, 'chats', chat.id));
          } else {
            setShowMenuId(null);
            return;
          }
        } else {
          await deleteDoc(doc(db, 'chats', chat.id));
        }
      }
      if (activeChat?.id === chat.id) {
        setActiveChat(null);
      }
    } catch (error) {
      console.error("Error modifying chat", error);
    }
    setShowMenuId(null);
  };

  if (activeChat) {
    return <ChatRoom chat={activeChat} onBack={() => setActiveChat(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-24 md:pb-0">
      <div className="bg-white dark:bg-gray-800 px-6 md:px-8 pt-12 md:pt-8 pb-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Messages</h1>
      </div>
      <div className="p-4 md:p-8 overflow-y-auto flex-1 w-full max-w-4xl mx-auto">
        <AnimatePresence>
          {(() => {
            const visibleChats = chats.filter(chat => {
              if (chat.type === 'direct' && chat.buddy && isBlocked(chat.buddy.id)) {
                return false;
              }
              return true;
            });
            if (visibleChats.length === 0) {
              return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No messages yet.</p>
                </motion.div>
              );
            }
            return visibleChats.map((chat) => (
              <motion.div 
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                onClick={() => setActiveChat(chat)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 mb-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors relative"
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {chat.type === 'group' ? (
                      <Users size={24} className="text-gray-400" />
                    ) : (
                      <img src={chat.buddy?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.buddy?.id}`} alt={chat.buddy?.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                      {chat.type === 'group' ? chat.name : chat.buddy?.name}
                    </h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">
                      {new Date(chat.timestamp?.toMillis ? chat.timestamp.toMillis() : (chat.timestamp || Date.now())).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-sm truncate text-gray-500 dark:text-gray-400">
                    {chat.lastMessage}
                  </p>
                </div>

                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenuId(showMenuId === chat.id ? null : chat.id);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {showMenuId === chat.id && (
                    <div className="absolute right-0 top-10 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-20">
                      <button 
                        onClick={(e) => handleBlock(chat, e)}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium flex items-center transition-colors"
                      >
                        <Ban size={16} className="mr-2" />
                        {chat.type === 'group' ? 'Leave Group' : 'Block User'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ));
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isChatActive, setIsChatActive] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(() => {
    return localStorage.getItem('termsAccepted') === 'true';
  });

  const handleTermsChange = (checked: boolean) => {
    setTermsAccepted(checked);
    localStorage.setItem('termsAccepted', checked.toString());
  };
  const { theme, toggleTheme } = useTheme();
  const { user, loading, login } = useContext(AppContext);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    if (!termsAccepted) {
      setAuthError('Please accept the Terms and Conditions');
      return;
    }
    setAuthError('');
    setIsSubmitting(true);
    try {
      await login();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    initializeApp();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [hasSeenSafetyGuide, setHasSeenSafetyGuide] = useState(() => {
    return localStorage.getItem('hasSeenSafetyGuide') === 'true';
  });

  const handleTabChange = (tabId: string) => {
    vibrate();
    setActiveTab(tabId);
  };

  const handleAcknowledgeSafety = () => {
    setHasSeenSafetyGuide(true);
    localStorage.setItem('hasSeenSafetyGuide', 'true');
  };

  const tabs = [
    { id: 'home', icon: Compass, label: 'Home' },
    { id: 'matches', icon: Users, label: 'Buddies' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'profile', icon: UserIcon, label: 'Profile' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard setActiveTab={handleTabChange} />;
      case 'matches': return <MatchList setActiveTab={handleTabChange} />;
      case 'chat': return <ChatList onChatActive={setIsChatActive} />;
      case 'profile': return <Profile />;
      default: return <Dashboard setActiveTab={handleTabChange} />;
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[100dvh] w-full bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl max-w-sm w-full text-center border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
            <span className="text-white font-black text-2xl">EB</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Exam Buddy</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Connect, Travel, Succeed.</p>
          
          <form onSubmit={(e) => { e.preventDefault(); handleGoogleLogin(); }} className="flex flex-col gap-3">
            {authError && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs p-2 rounded-lg text-left">
                {authError}
              </div>
            )}

            <div className="flex items-start text-left mb-2 px-1">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => handleTermsChange(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="terms" className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                I agree to the <a href="/terms-and-conditions.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">Terms and Conditions</a> and <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">Privacy Policy</a>
              </label>
            </div>

            <button 
              type="submit"
              disabled={!termsAccepted || isSubmitting}
              className={`w-full text-gray-700 dark:text-gray-200 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 ${termsAccepted && !isSubmitting ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70'}`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isSubmitting ? 'Signing in...' : 'Continue with Google'}
            </button>
          </form>
        </div>
        <InstallPrompt />
        <PushNotificationPrompt />
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="h-[100dvh] w-full bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
        
        {/* Offline Banner */}
        {!isOnline && (
          <div className="absolute top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-center z-50 animate-in slide-in-from-top">
            <WifiOff size={16} className="mr-2" />
            You are offline. Some features may be unavailable.
          </div>
        )}
        
        {/* Desktop Sidebar Navigation */}
        <div className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 z-20 shrink-0">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center">
              <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2 text-white font-black text-sm">EB</span>
              Exam Buddy
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 font-medium uppercase tracking-wider">Connect, Travel, Succeed</p>
          </div>
          <div className="flex-1 px-4 space-y-2 mt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center p-3 rounded-xl transition-colors ${
                    isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 font-medium'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`mr-3 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="p-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt={user.name} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative w-full bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Bottom Navigation */}
          {!isChatActive && (
            <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 pb-safe pt-2 px-6 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none">
              <div className="flex justify-between items-center pb-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex flex-col items-center justify-center p-2 gap-1 w-16 transition-colors ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        {isActive && (
                          <motion.div
                            layoutId="nav-indicator"
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                          />
                        )}
                      </div>
                      <span className="text-[10px] font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <Toaster position="top-center" />
        <InstallPrompt />
        <PushNotificationPrompt />
        <SafetyModal 
          isOpen={!!user && !hasSeenSafetyGuide} 
          onClose={handleAcknowledgeSafety} 
        />
      </div>
    </ThemeContext.Provider>
  );
}
