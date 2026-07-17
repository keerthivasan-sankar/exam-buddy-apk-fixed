import React, { useState, useContext, useRef, useEffect } from 'react';
import Modal from './Modal';
import { AppContext } from '../AppContext';
import { Upload } from 'lucide-react';

export default function EditProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, updateUser } = useContext(AppContext);
  
  const [name, setName] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [gender, setGender] = useState('');
  const [preferredTransport, setPreferredTransport] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [bio, setBio] = useState('');
  const [studyStyle, setStudyStyle] = useState('');
  const [availability, setAvailability] = useState('');
  const [preferredStudyTime, setPreferredStudyTime] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [avatar, setAvatar] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setHomeCity(user.homeCity || '');
      setGender(user.gender || '');
      setPreferredTransport(user.preferredTransport || '');
      setPreferredLanguage(user.preferredLanguage || '');
      setBio(user.bio || '');
      setStudyStyle(user.studyStyle || '');
      setAvailability(user.availability || '');
      setPreferredStudyTime(user.preferredStudyTime || '');
      setTimeZone(user.timeZone || '');
      setTargetScore(user.targetScore || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  if (!user) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateUser({
      name,
      homeCity,
      gender,
      preferredTransport,
      preferredLanguage,
      bio,
      studyStyle,
      availability,
      preferredStudyTime,
      timeZone,
      targetScore,
      avatar
    });
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Personal Info">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3 group">
            <img 
              src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
              alt="Profile" 
              className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 object-cover" 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Upload size={24} className="text-white" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Click to change photo</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Home City</label>
          <input 
            type="text" 
            value={homeCity}
            onChange={(e) => setHomeCity(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
          <select 
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Transport</label>
          <input 
            type="text" 
            value={preferredTransport}
            onChange={(e) => setPreferredTransport(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
            placeholder="e.g. Train, Flight, Bus"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
          <input 
            type="text" 
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
            placeholder="e.g. English, Spanish"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
            placeholder="Tell us a little about yourself"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Study Style</label>
          <select 
            value={studyStyle}
            onChange={(e) => setStudyStyle(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
          >
            <option value="">Select Study Style</option>
            <option value="Visual">Visual</option>
            <option value="Auditory">Auditory</option>
            <option value="Reading/Writing">Reading/Writing</option>
            <option value="Kinesthetic">Kinesthetic</option>
            <option value="Group">Group</option>
            <option value="Solo">Solo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Availability</label>
          <input 
            type="text" 
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
            placeholder="e.g. Weekends, Evenings"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Study Time</label>
          <select 
            value={preferredStudyTime}
            onChange={(e) => setPreferredStudyTime(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
          >
            <option value="">Select Time</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
            <option value="Night">Night</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Zone</label>
          <input 
            type="text" 
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
            placeholder="e.g. EST, PST, GMT"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Score</label>
          <input 
            type="text" 
            value={targetScore}
            onChange={(e) => setTargetScore(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
            placeholder="e.g. 90%, A+, 700"
          />
        </div>
        <div className="pt-4">
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
