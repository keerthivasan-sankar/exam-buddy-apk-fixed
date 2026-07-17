import React, { useContext, useState } from 'react';
import { BookOpen, MapPin, Calendar, Clock, Plus, ExternalLink, Download, MessageCircle } from 'lucide-react';
import { AppContext } from '../AppContext';
import { motion } from 'motion/react';
import AddExamModal from './AddExamModal';
import { Exam } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, arrayUnion } from 'firebase/firestore';

import { shareAppContent } from '../lib/capacitor';

export default function ExamsList() {
  const { exams, user } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joinedCenters, setJoinedCenters] = useState<Record<string, boolean>>({});

  const handleJoinGroup = async (exam: Exam) => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'chats'), 
        where('type', '==', 'group'),
        where('examCenter', '==', exam.examCenter)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Group exists, join it
        const groupDoc = snapshot.docs[0];
        const participants = groupDoc.data().participants || [];
        if (!participants.includes(user.id)) {
          await updateDoc(doc(db, 'chats', groupDoc.id), {
            participants: arrayUnion(user.id)
          });
        }
      } else {
        // Create group
        await addDoc(collection(db, 'chats'), {
          type: 'group',
          name: `${exam.examCenter} - ${exam.examCity} Group`,
          examCenter: exam.examCenter,
          participants: [user.id],
          timestamp: Date.now(),
          lastMessage: 'Group created'
        });
      }
      setJoinedCenters(prev => ({ ...prev, [exam.id]: true }));
      alert('Joined group successfully! Check your Messages tab.');
    } catch (error) {
      console.error("Error joining group:", error);
      alert('Failed to join group.');
    }
  };

  const getCalendarDateString = (dateString: string) => {
    // Basic formatting for YYYYMMDDTHHmmssZ
    const date = new Date(dateString);
    date.setHours(9, 0, 0, 0); // Assume 9 AM start
    const start = date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    date.setHours(12, 0, 0, 0); // Assume 12 PM end
    const end = date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    return `${start}/${end}`;
  };

  const generateIcsFile = (exam: Exam) => {
    const date = new Date(exam.examDate);
    date.setHours(9, 0, 0, 0);
    const start = date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    date.setHours(12, 0, 0, 0);
    const end = date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Exam Buddy//EN
BEGIN:VEVENT
UID:${exam.id}@exambuddy.app
DTSTAMP:${start}
DTSTART:${start}
DTEND:${end}
SUMMARY:${exam.examName}
LOCATION:${exam.examCenter}, ${exam.examCity}
DESCRIPTION:Exam Buddy Event
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${exam.examName.replace(/\\s+/g, '_')}_Exam.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-24 md:pb-0">
      <div className="bg-white dark:bg-gray-800 px-6 md:px-8 pt-12 md:pt-8 pb-4 shadow-sm sticky top-0 z-10 flex justify-center">
        <div className="w-full max-w-4xl flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Exams</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors flex items-center font-medium text-sm"
          >
            <Plus size={18} className="mr-1.5" />
            Add Exam
          </button>
        </div>
      </div>
      
      <div className="p-6 md:p-8 overflow-y-auto flex-1 w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {exams.map((exam, index) => (
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
                <div className="flex items-start text-sm text-gray-600 dark:text-gray-300 mb-3">
                  <MapPin size={16} className="mr-2 mt-0.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  <span>
                    <span className="block font-medium text-gray-900 dark:text-gray-200 mb-0.5">{exam.examCity}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">{exam.examCenter}</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(exam.examName)}&dates=${getCalendarDateString(exam.examDate)}&details=Exam Buddy Event&location=${encodeURIComponent(exam.examCenter + ', ' + exam.examCity)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold py-2 rounded-lg transition-colors border border-gray-100 dark:border-gray-600 flex justify-center items-center"
                  >
                    <ExternalLink size={14} className="mr-1.5" />
                    Google Cal
                  </a>
                  <button 
                    onClick={() => generateIcsFile(exam)}
                    className="flex-1 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold py-2 rounded-lg transition-colors border border-gray-100 dark:border-gray-600 flex justify-center items-center"
                  >
                    <Download size={14} className="mr-1.5" />
                    Apple/Outlook
                  </button>
                  <button 
                    onClick={() => shareAppContent(`Join me for ${exam.examName}`, `I am taking ${exam.examName} in ${exam.examCity} on ${new Date(exam.examDate).toLocaleDateString()}. Find me on Exam Buddy!`, window.location.href)}
                    className="flex-1 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold py-2 rounded-lg transition-colors border border-gray-100 dark:border-gray-600 flex justify-center items-center"
                  >
                    Share
                  </button>
                </div>
                <div className="pt-2">
                  <button 
                    onClick={() => handleJoinGroup(exam)}
                    disabled={joinedCenters[exam.id]}
                    className={`w-full text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center ${
                      joinedCenters[exam.id] 
                        ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400' 
                        : 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800'
                    }`}
                  >
                    <MessageCircle size={14} className="mr-1.5" />
                    {joinedCenters[exam.id] ? 'Joined Center Group' : 'Join Center Group Chat'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <AddExamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
