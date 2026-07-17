import React, { useState, useEffect, useContext, useRef } from 'react';
import { ArrowLeft, Send, MapPin, Flag } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppContext } from '../AppContext';
import { Chat, Message } from '../types';
import { getCurrentLocation } from '../lib/capacitor';

const getTimestamp = (ts: any) => {
  if (!ts) return Date.now();
  if (typeof ts === 'number') return ts;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
};

interface ChatRoomProps {
  chat: Chat;
  onBack: () => void;
}

export default function ChatRoom({ chat, onBack }: ChatRoomProps) {
  const { user, submitReport } = useContext(AppContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !chat) return;

    const q = query(
      collection(db, 'chats', chat.id, 'messages')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        loadedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      
      // Sort messages locally by timestamp to avoid requiring a composite index in Firestore
      loadedMessages.sort((a, b) => getTimestamp(a.timestamp) - getTimestamp(b.timestamp));
      setMessages(loadedMessages);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    return () => unsubscribe();
  }, [chat, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', chat.id, 'messages'), {
        chatId: chat.id,
        userId: user.id,
        userName: user.name,
        message: messageText,
        timestamp: Date.now(),
        isLocation: false
      });

      // Update last message in chat
      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: messageText,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleShareLocation = async () => {
    if (!user) return;

    const location = await getCurrentLocation();
    if (!location) {
      alert("Unable to retrieve your location. Please make sure location permission is enabled for this app in your device settings.");
      return;
    }

    const { latitude, longitude } = location;
    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    try {
      await addDoc(collection(db, 'chats', chat.id, 'messages'), {
        chatId: chat.id,
        userId: user.id,
        userName: user.name,
        message: locationUrl,
        timestamp: Date.now(),
        isLocation: true
      });

      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: '📍 Shared a location',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error sending location:", error);
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 fixed inset-0 h-[100dvh] z-[100]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 py-3 shadow-sm flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
        <button 
          onClick={onBack}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {chat.type === 'group' ? chat.name : chat.buddy?.name}
          </h2>
        </div>
        <button 
          onClick={async () => {
            const reportedName = chat.type === 'group' ? (chat.name || 'this group') : (chat.buddy?.name || 'this user');
            const reason = window.prompt(`Please describe the issue with ${reportedName} (e.g. harassment, spam, inappropriate behavior):`);
            if (reason && reason.trim()) {
              try {
                const reportedUserId = chat.type === 'group' ? chat.id : (chat.buddy?.id || '');
                await submitReport(reportedUserId, reportedName, reason.trim(), chat.id);
                alert("Report submitted. Thank you for keeping Exam Buddy safe.");
              } catch (error) {
                console.error("Error submitting report", error);
                alert("Failed to submit report. Please try again.");
              }
            }
          }}
          className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Report Chat"
        >
          <Flag size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10 text-sm">
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.userId === user?.id;
            return (
              <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {!isMe && chat.type === 'group' && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-0.5">{msg.userName}</p>
                  )}
                  {msg.isLocation ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={16} />
                        <span className="font-semibold text-sm">Location</span>
                      </div>
                      <a 
                        href={msg.message} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm underline hover:opacity-80"
                      >
                        View on Google Maps
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.message}</p>
                  )}
                  <p className={`text-[10px] text-right mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(getTimestamp(msg.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 pb-safe">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={handleShareLocation}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors shrink-0"
            title="Share Location"
          >
            <MapPin size={18} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
