import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show if supported and not already granted/denied
    if ('Notification' in window && 'serviceWorker' in navigator) {
      if (Notification.permission === 'default') {
        // Delay showing prompt slightly
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        // Simulate a welcome notification
        registration.showNotification('Exam Buddy Alerts Enabled', {
          body: 'You will now receive alerts for new matches and exam reminders!',
          icon: '/icon-192.png'
        });
      }
    } catch (e) {
      console.error('Error requesting notification permission', e);
    }
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-blue-100 dark:border-blue-900 z-50 flex items-start gap-4"
        >
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center shrink-0">
            <Bell className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Enable Notifications</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Get instant alerts for new study buddies, chat messages, and upcoming exam reminders.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={handleEnable}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex-1 transition-colors"
              >
                Enable
              </button>
              <button 
                onClick={() => setShowPrompt(false)}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-bold py-2 px-4 rounded-lg flex-1 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
