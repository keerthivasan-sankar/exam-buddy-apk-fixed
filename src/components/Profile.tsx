import React, { useContext, useState, useEffect } from 'react';
import { User, Bell, ChevronRight, Shield, LogOut, Settings, Moon, Sun, Compass, Ban } from 'lucide-react';
import { AppContext } from '../AppContext';
import { motion } from 'motion/react';
import { ThemeContext } from '../App';
import EditProfileModal from './EditProfileModal';

import { takePicture, checkNotificationPermission, requestNotificationPermission } from '../lib/capacitor';
import { Camera as CameraIcon } from 'lucide-react';

export default function Profile() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout, updateUser, blockedUsers, unblockUser } = useContext(AppContext);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    checkNotificationPermission().then(status => {
      setNotificationsEnabled(status === 'granted');
    });
  }, []);

  const handleUpdateAvatar = async () => {
    const photoUrl = await takePicture();
    if (photoUrl) {
      await updateUser({ avatar: photoUrl });
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-24 md:pb-0">
      <div className="bg-white dark:bg-gray-800 px-6 md:px-8 pt-12 md:pt-8 pb-6 shadow-sm sticky top-0 z-10 flex justify-center md:justify-start">
        <div className="w-full max-w-3xl md:mx-auto text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Profile</h1>
        </div>
      </div>
      
      <div className="p-6 md:p-8 overflow-y-auto flex-1 w-full max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center mb-6 text-center hover:shadow-md transition-shadow"
        >
          <div className="relative mb-5 group cursor-pointer" onClick={handleUpdateAvatar}>
            <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt={user.name} className="w-28 h-28 rounded-full bg-gray-100 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-md object-cover" />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <CameraIcon className="text-white w-8 h-8" />
            </div>
            {user.verified && (
              <div className="absolute bottom-1 right-1 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-sm z-10">
                <Shield size={22} className="text-green-500 fill-green-100 dark:fill-green-900/30" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
          <div className="flex gap-4 mt-6 w-full max-w-sm mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-2xl text-blue-700 dark:text-blue-400 flex-1 border border-blue-100/50 dark:border-blue-800/30">
              <span className="block text-xs font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider mb-1">Home City</span>
              <span className="font-bold text-sm">{user.homeCity || 'Not set'}</span>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-3 rounded-2xl text-purple-700 dark:text-purple-400 flex-1 border border-purple-100/50 dark:border-purple-800/30">
              <span className="block text-xs font-bold text-purple-400 dark:text-purple-500 uppercase tracking-wider mb-1">Gender</span>
              <span className="font-bold text-sm">{user.gender || 'Not set'}</span>
            </div>
          </div>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 tracking-tight flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
              <Compass size={16} className="text-gray-600 dark:text-gray-400" />
            </div>
            Travel Preferences
          </h3>
          <div className="space-y-4 ml-11">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700 last:border-0 last:pb-0">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Preferred Transport</span>
              <span className="text-gray-900 dark:text-white text-sm font-bold bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg">{user.preferredTransport || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700 last:border-0 last:pb-0">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Language</span>
              <span className="text-gray-900 dark:text-white text-sm font-bold bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg">{user.preferredLanguage || 'Not set'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 tracking-tight flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
              <User size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            Study Profile
          </h3>
          <div className="space-y-4 ml-11">
            {user.bio && (
              <div className="pb-3 border-b border-gray-50 dark:border-gray-700">
                <span className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Bio</span>
                <p className="text-gray-900 dark:text-white text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">{user.bio}</p>
              </div>
            )}
            <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Study Style</span>
              <span className="text-gray-900 dark:text-white text-sm font-bold bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg">{user.studyStyle || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Availability</span>
              <span className="text-gray-900 dark:text-white text-sm font-bold bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg">{user.availability || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Preferred Time</span>
              <span className="text-gray-900 dark:text-white text-sm font-bold bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg">{user.preferredStudyTime || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Time Zone</span>
              <span className="text-gray-900 dark:text-white text-sm font-bold bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg">{user.timeZone || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Target Score</span>
              <span className="text-gray-900 dark:text-white text-sm font-bold bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg">{user.targetScore || 'Not set'}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 tracking-tight flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
              <Settings size={16} className="text-gray-600 dark:text-gray-400" />
            </div>
            App Settings
          </h3>
          <div className="flex justify-between items-center py-2 ml-11">
            <div className="flex items-center">
              <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">Dark Mode</span>
            </div>
            <button 
              onClick={toggleTheme}
              className={`w-14 h-7 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'} shadow-inner`}
            >
              <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}>
                {theme === 'dark' ? <Moon size={12} className="text-blue-600" /> : <Sun size={12} className="text-orange-400" />}
              </div>
            </button>
          </div>
        </div>
        
        <div className="space-y-3 mb-8">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="w-full bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between active:scale-95 transition-all hover:border-gray-200 dark:hover:border-gray-600 group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mr-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                <User size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">Edit Personal Info</span>
            </div>
            <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="w-full bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mr-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                <Bell size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">Notifications</span>
            </div>
            <button 
              onClick={async () => {
                const status = await checkNotificationPermission();
                if (status === 'unsupported') {
                  alert('Notifications are not supported on this device.');
                } else if (status === 'granted') {
                  alert('Notifications are already enabled. You can disable them in your device settings.');
                } else if (status === 'denied') {
                  alert('Notifications are blocked. Please enable them in your device settings for this app.');
                } else {
                  const granted = await requestNotificationPermission();
                  setNotificationsEnabled(granted);
                }
              }}
              className={`w-14 h-7 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'} shadow-inner`}
            >
              <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-transform ${notificationsEnabled ? 'translate-x-7' : 'translate-x-0'}`}>
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsBlockedModalOpen(true)}
          className="w-full mt-4 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between active:scale-95 transition-all hover:border-gray-200 dark:hover:border-gray-600 group"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mr-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
              <Ban size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-200">Blocked Users</span>
          </div>
          <div className="flex items-center gap-2">
            {blockedUsers.length > 0 && (
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">{blockedUsers.length}</span>
            )}
            <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
        
        <div className="mt-8 mb-4">
          <button 
            onClick={logout}
            className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl p-4 font-bold flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors border border-transparent dark:border-red-900/30"
          >
            <LogOut size={18} className="mr-2" />
            Log Out
          </button>
        </div>
      </div>
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />

      {isBlockedModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setIsBlockedModalOpen(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-2xl w-full md:max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Blocked Users</h2>
              <button onClick={() => setIsBlockedModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                ✕
              </button>
            </div>
            <div className="p-4">
              {blockedUsers.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">You haven't blocked anyone.</p>
              ) : (
                blockedUsers.map((block) => (
                  <div key={block.id} className="flex items-center justify-between py-3 px-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{block.blockedUserName}</span>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Unblock ${block.blockedUserName}? They will be able to message you and appear in your matches again.`)) {
                          await unblockUser(block.id);
                        }
                      }}
                      className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
