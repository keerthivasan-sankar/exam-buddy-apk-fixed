import React from 'react';
import { Shield, Users, MapPin, MessageCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SafetyModal({ isOpen, onClose }: SafetyModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 md:p-8 overflow-y-auto">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Welcome to Exam Buddy
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
              Your safety and privacy are our top priorities. Please review our community guidelines before proceeding.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Meet in Public Spaces</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Always arrange to meet your travel companions in well-lit, public areas like train stations, cafes, or directly at the exam center.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Keep Communication in App</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Use our built-in chat for all communications. Avoid sharing personal phone numbers or social media handles until you feel completely safe.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Share Your Journey</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Let friends or family know about your travel plans, including who you're meeting and your expected arrival times.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Trust Your Instincts</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    If something feels off or a user is making you uncomfortable, cancel the arrangement and use the report feature immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 mt-auto">
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              I Understand and Agree
            </button>
            <p className="text-xs text-center text-gray-500 mt-4">
              By continuing, you agree to our <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a> and <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>. We never share your exact location without your consent.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
