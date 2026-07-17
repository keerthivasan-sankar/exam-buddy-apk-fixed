import React, { useContext, useEffect, useState } from 'react';
import { Search, MapPin, ShieldCheck, MessageCircle, Users, Flag, Ban } from 'lucide-react';
import { motion } from 'motion/react';
import { AppContext } from '../AppContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { Match, User, Exam } from '../types';

export default function MatchList({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { user, exams, isBlocked, submitReport, blockUser } = useContext(AppContext);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [genderFilter, setGenderFilter] = useState<string>('Any');
  const [searchQuery, setSearchQuery] = useState('');
  const [studyTimeFilter, setStudyTimeFilter] = useState<string>('Any');
  const [timeZoneFilter, setTimeZoneFilter] = useState<string>('');
  const [targetScoreFilter, setTargetScoreFilter] = useState<string>('');

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user || exams.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const newMatches: Match[] = [];
      const userIds = new Set<string>();

      try {
        const querySnapshot = await getDocs(collection(db, 'exams'));
        
        for (const document of querySnapshot.docs) {
          const examData = { id: document.id, ...document.data() } as Exam;
          if (examData.userId !== user.id) {
            // Check if this exam matches any of my exams (case-insensitive)
            for (const myExam of exams) {
              if (
                examData.examCity?.toLowerCase() === myExam.examCity?.toLowerCase() &&
                examData.examName?.toLowerCase() === myExam.examName?.toLowerCase()
              ) {
                if (!userIds.has(examData.userId) && !isBlocked(examData.userId)) {
                  // Fetch user profile
                  const userDoc = await getDoc(doc(db, 'users', examData.userId));
                  if (userDoc.exists()) {
                    const buddyUser = { id: userDoc.id, ...userDoc.data() } as User;
                    newMatches.push({
                      buddy: buddyUser,
                      exam: myExam // Reference to my exam for grouping
                    });
                    userIds.add(examData.userId);
                  }
                }
                break; // No need to match this exam to my other exams
              }
            }
          }
        }
        
        setMatches(newMatches);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user, exams]);

  const createGroupChat = async (exam: Exam) => {
    if (!user) return;
    
    // Find all matches for this exam
    const examMatches = matches.filter(m => m.exam.id === exam.id);
    if (examMatches.length === 0) return;

    const participants = [user.id, ...examMatches.map(m => m.buddy.id)];
    
    try {
      await addDoc(collection(db, 'chats'), {
        type: 'group',
        name: `${exam.examName} in ${exam.examCity}`,
        examId: exam.id,
        participants,
        lastMessage: 'Group created',
        timestamp: Date.now(),
        unreadCount: {}
      });
      if (setActiveTab) setActiveTab('chat');
    } catch (error) {
      console.error("Error creating group chat", error);
    }
  };

  const createDirectChat = async (buddyId: string) => {
    if (!user) return;
    try {
      // Check if chat exists
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('type', '==', 'direct'), where('participants', 'array-contains', user.id));
      const querySnapshot = await getDocs(q);
      
      let existingChatId = null;
      for (const document of querySnapshot.docs) {
        const data = document.data();
        if (data.participants.includes(buddyId)) {
          existingChatId = document.id;
          break;
        }
      }

      if (existingChatId) {
        // Chat already exists, just switch to chat tab
        if (setActiveTab) setActiveTab('chat');
        return;
      }

      await addDoc(collection(db, 'chats'), {
        type: 'direct',
        participants: [user.id, buddyId],
        lastMessage: 'Chat started',
        timestamp: Date.now(),
        unreadCount: {}
      });
      if (setActiveTab) setActiveTab('chat');
    } catch (error) {
      console.error("Error creating chat", error);
    }
  };

  const filteredMatches = matches.filter(match => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      match.buddy.name.toLowerCase().includes(searchLower) ||
      match.buddy.homeCity?.toLowerCase().includes(searchLower) ||
      match.exam.examName.toLowerCase().includes(searchLower) ||
      match.exam.examCity.toLowerCase().includes(searchLower);
      
    const matchesGender = genderFilter === 'Any' || match.buddy.gender === genderFilter;
    const matchesStudyTime = studyTimeFilter === 'Any' || match.buddy.preferredStudyTime === studyTimeFilter;
    const matchesTimeZone = !timeZoneFilter || match.buddy.timeZone?.toLowerCase().includes(timeZoneFilter.toLowerCase());
    const matchesTargetScore = !targetScoreFilter || match.buddy.targetScore?.toLowerCase().includes(targetScoreFilter.toLowerCase());
    
    return matchesSearch && matchesGender && matchesStudyTime && matchesTimeZone && matchesTargetScore;
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-24 md:pb-0">
      <div className="bg-white dark:bg-gray-800 px-6 md:px-8 pt-12 md:pt-8 pb-4 shadow-sm sticky top-0 z-10 flex justify-center">
        <div className="w-full max-w-5xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">Find Buddies</h1>
          <div className="flex flex-col md:flex-row gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by city or exam..." 
                className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all font-medium"
              />
            </div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 border-none rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 font-medium cursor-pointer"
            >
              <option value="Any">Any Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={studyTimeFilter}
              onChange={(e) => setStudyTimeFilter(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 font-medium cursor-pointer flex-1 min-w-[140px]"
            >
              <option value="Any">Any Study Time</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
            <input 
              type="text" 
              value={timeZoneFilter}
              onChange={(e) => setTimeZoneFilter(e.target.value)}
              placeholder="Time Zone (e.g. EST)" 
              className="bg-gray-100 dark:bg-gray-700 border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium flex-1 min-w-[140px]"
            />
            <input 
              type="text" 
              value={targetScoreFilter}
              onChange={(e) => setTargetScoreFilter(e.target.value)}
              placeholder="Target Score" 
              className="bg-gray-100 dark:bg-gray-700 border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium flex-1 min-w-[140px]"
            />
          </div>
        </div>
      </div>
      
      <div className="p-6 md:p-8 overflow-y-auto flex-1 w-full max-w-5xl mx-auto">
        {exams.length > 0 && matches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Exam Groups</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {exams.map(exam => {
                const examMatchCount = matches.filter(m => m.exam.id === exam.id).length;
                if (examMatchCount === 0) return null;
                
                return (
                  <div key={exam.id} className="min-w-[280px] bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white">{exam.examName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{exam.examCity}</p>
                    <button 
                      onClick={() => createGroupChat(exam)}
                      className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <Users size={16} className="mr-2" />
                      Create Group ({examMatchCount} Buddies)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 md:mb-6">Recommended Matches</h2>
        {loading ? (
          <div className="text-center text-gray-500 py-8">Finding matches...</div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center text-gray-500 py-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            No buddies found yet. Check back later or adjust your filters!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredMatches.map((match, index) => (
              <motion.div 
                key={`${match.buddy.id}-${match.exam.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-5">
                  <div className="relative mr-4">
                    <img src={match.buddy.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.buddy.id}`} alt={match.buddy.name} className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-100 dark:border-gray-600" />
                    {match.buddy.isOnline && (
                      <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm"></div>
                    )}
                    {match.buddy.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-sm">
                        <ShieldCheck size={18} className="text-green-500 fill-green-100 dark:fill-green-900/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      {match.buddy.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                      <MapPin size={14} className="mr-1 text-gray-400" />
                      From {match.buddy.homeCity || 'Unknown'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3.5 mb-5 flex items-center justify-between border border-blue-100/50 dark:border-blue-800/30">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-bold">{match.exam.examName}</p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 font-medium">{match.exam.examCity}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Match
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button className="flex-[2] bg-blue-600 dark:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center shadow-sm"
                    onClick={() => createDirectChat(match.buddy.id)}>
                    <MessageCircle size={16} className="mr-2" />
                    Message
                  </button>
                  <button 
                    onClick={async () => {
                      const reason = window.prompt(`Please describe why you're reporting ${match.buddy.name} (e.g. harassment, spam, inappropriate behavior):`);
                      if (reason && reason.trim()) {
                        try {
                          await submitReport(match.buddy.id, match.buddy.name, reason.trim());
                          alert("Report submitted. Thank you for keeping Exam Buddy safe.");
                        } catch (error) {
                          console.error("Error submitting report", error);
                          alert("Failed to submit report. Please try again.");
                        }
                      }
                    }}
                    className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center shadow-sm"
                    title={`Report ${match.buddy.name}`}
                  >
                    <Flag size={16} />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Block ${match.buddy.name}? They won't be able to message you or appear in your matches again.`)) {
                        try {
                          await blockUser(match.buddy.id, match.buddy.name);
                        } catch (error) {
                          console.error("Error blocking user", error);
                          alert("Failed to block user. Please try again.");
                        }
                      }
                    }}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center shadow-sm"
                    title={`Block ${match.buddy.name}`}
                  >
                    <Ban size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

