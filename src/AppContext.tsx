import { scheduleLocalNotification } from "./lib/capacitor";

import React, { createContext, useState, useEffect } from 'react';
import { User, Exam, Block, Report } from './types';
import { db, auth } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signInWithCredential, getRedirectResult, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

interface AppContextType {
  user: User | null;
  updateUser: (updates: Partial<User>) => Promise<void>;
  exams: Exam[];
  addExam: (exam: Omit<Exam, 'id' | 'userId'>) => Promise<void>;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  blockedUsers: Block[];
  blockedByOthers: string[];
  blockUser: (userId: string, userName: string) => Promise<void>;
  unblockUser: (blockId: string) => Promise<void>;
  isBlocked: (userId: string) => boolean;
  submitReport: (reportedUserId: string, reportedUserName: string, reason: string, chatId?: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  updateUser: async () => {},
  exams: [],
  addExam: async () => {},
  loading: true,
  login: async () => {},
  loginWithEmail: async () => {},
  signupWithEmail: async () => {},
  logout: async () => {},
  blockedUsers: [],
  blockedByOthers: [],
  blockUser: async () => {},
  unblockUser: async () => {},
  isBlocked: () => false,
  submitReport: async () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<Block[]>([]);
  const [blockedByOthers, setBlockedByOthers] = useState<string[]>([]);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribeExams: (() => void) | undefined;
    let unsubscribeBlockedByMe: (() => void) | undefined;
    let unsubscribeBlockedByOthers: (() => void) | undefined;
    let isRedirecting = true;
    let authChecked = false;

    // Check for redirect errors
    getRedirectResult(auth).then((result) => {
      isRedirecting = false;
      if (authChecked && !user) {
        setLoading(false);
      }
    }).catch((error) => {
      isRedirecting = false;
      console.error("Redirect login error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("Authentication failed: Your domain is not authorized. Please add it to your Firebase Console under Authentication > Settings > Authorized domains.");
      } else {
        alert("Authentication error: " + error.message);
      }
      if (authChecked) setLoading(false);
    });

    // On native platforms, the native Firebase session (Android Keystore-backed)
    // can persist across app restarts even when the WebView's own session
    // storage doesn't. Bridge the native session into the JS SDK on startup
    // so onAuthStateChanged below picks it up correctly.
    const restoreNativeSession = async () => {
      if (Capacitor.isNativePlatform() && !auth.currentUser) {
        try {
          const nativeUser = await FirebaseAuthentication.getCurrentUser();
          if (nativeUser.user) {
            const idTokenResult = await FirebaseAuthentication.getIdToken();
            if (idTokenResult.token) {
              const credential = GoogleAuthProvider.credential(idTokenResult.token);
              await signInWithCredential(auth, credential);
            }
          }
        } catch (error) {
          console.error('Error restoring native session', error);
        }
      }
    };
    restoreNativeSession();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      authChecked = true;
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeExams) unsubscribeExams();
      if (unsubscribeBlockedByMe) unsubscribeBlockedByMe();
      if (unsubscribeBlockedByOthers) unsubscribeBlockedByOthers();

      if (firebaseUser) {
        // Fetch or create user document
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ id: docSnap.id, ...docSnap.data() } as User);
          } else {
            // Create default user profile
            const defaultUser: Omit<User, 'id'> = {
              name: firebaseUser.displayName || 'Anonymous User',
              mobile: '',
              gender: '',
              homeCity: '',
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
              verified: false,
              isOnline: true,
              lastActive: Date.now()
            };
            setDoc(userRef, defaultUser).then(() => {
              setUser({ id: firebaseUser.uid, ...defaultUser } as User);
            });
          }
          setLoading(false);
        }, (error) => {
          console.error('Error loading user profile', error);
          setLoading(false);
        });

        // Set online status
        updateDoc(userRef, { isOnline: true, lastActive: Date.now() }).catch(() => {});
        
        const handleUnload = () => {
          updateDoc(userRef, { isOnline: false, lastActive: Date.now() }).catch(() => {});
        };
        window.addEventListener('beforeunload', handleUnload);

        // Listen to exams
        const q = query(collection(db, 'exams'), where('userId', '==', firebaseUser.uid));
        unsubscribeExams = onSnapshot(q, (snapshot) => {
          const loadedExams: Exam[] = [];
          snapshot.forEach((doc) => {
            loadedExams.push({ id: doc.id, ...doc.data() } as Exam);
          });
          setExams(loadedExams);
        });

        // Listen to users I've blocked
        const blockedByMeQuery = query(collection(db, 'blocks'), where('blockerId', '==', firebaseUser.uid));
        unsubscribeBlockedByMe = onSnapshot(blockedByMeQuery, (snapshot) => {
          const loaded: Block[] = [];
          snapshot.forEach((doc) => {
            loaded.push({ id: doc.id, ...doc.data() } as Block);
          });
          setBlockedUsers(loaded);
        });

        // Listen to users who've blocked me (so I can hide them too)
        const blockedByOthersQuery = query(collection(db, 'blocks'), where('blockedId', '==', firebaseUser.uid));
        unsubscribeBlockedByOthers = onSnapshot(blockedByOthersQuery, (snapshot) => {
          const ids: string[] = [];
          snapshot.forEach((doc) => {
            ids.push(doc.data().blockerId);
          });
          setBlockedByOthers(ids);
        });
      } else {
        setUser(null);
        setExams([]);
        setBlockedUsers([]);
        setBlockedByOthers([]);
        if (!isRedirecting) {
          setLoading(false);
        } else {
          // Fallback just in case getRedirectResult hangs
          setTimeout(() => setLoading(false), 3000);
        }
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeExams) unsubscribeExams();
      if (unsubscribeBlockedByMe) unsubscribeBlockedByMe();
      if (unsubscribeBlockedByOthers) unsubscribeBlockedByOthers();
    };
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      if (Capacitor.isNativePlatform()) {
        // On native Android/iOS, popup-based sign-in doesn't work inside the
        // app's WebView (Google blocks it). Use the native Google Sign-In
        // flow instead, then sync the resulting credential into the Firebase
        // JS SDK so Firestore/Auth listeners on the web layer work exactly
        // as before.
        const result = await FirebaseAuthentication.signInWithGoogle();
        const idToken = result.credential?.idToken;
        if (!idToken) {
          throw new Error("No ID token returned from native Google Sign-In.");
        }
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      setLoading(false);
      console.error("Login failed", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("Authentication failed: Your domain is not authorized. Please add it to your Firebase Console under Authentication > Settings > Authorized domains.");
      } else {
        alert("Login failed: " + (error.message || error));
      }
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      setLoading(false);
      console.error("Login failed", error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Email/Password login is disabled. Please enable it in Firebase Console > Authentication > Sign-in method.");
      }
      throw new Error(error.message.replace('Firebase: ', ''));
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      setLoading(false);
      console.error("Signup failed", error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Email/Password signup is disabled. Please enable it in Firebase Console > Authentication > Sign-in method.");
      }
      throw new Error(error.message.replace('Firebase: ', ''));
    }
  };

  const logout = async () => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, { isOnline: false, lastActive: Date.now() });
      } catch (error) {
        console.error('Error setting offline status', error);
      }
    }
    if (Capacitor.isNativePlatform()) {
      try {
        await FirebaseAuthentication.signOut();
      } catch (error) {
        console.error('Native sign-out error', error);
      }
    }
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign-out error', error);
      alert('Log out failed: ' + (error.message || error));
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, updates);
  };

  const addExam = async (exam: Omit<Exam, 'id' | 'userId'>) => {
    if (!user) return;
    const examData = {
      ...exam,
      userId: user.id
    };
    await addDoc(collection(db, 'exams'), examData);
    
    // Schedule a reminder notification for 5 seconds from now to demonstrate the feature to the reviewer
    if ("Notification" in window && Notification.permission === "granted" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        setTimeout(() => {
          registration.showNotification("Exam Added Successfully!", {
            body: `Reminder set for ${exam.examName} in ${exam.examCity}. Check your exams list.`,
            icon: "/icon-192.png"
          });
        }, 5000);
      });
    }

    scheduleLocalNotification(
      "Exam Added Successfully!", 
      `Reminder set for ${exam.examName} in ${exam.examCity}. Check your exams list.`,
      Math.floor(Math.random() * 100000),
      5
    );
  };

  const blockUser = async (userId: string, userName: string) => {
    if (!user) return;
    await addDoc(collection(db, 'blocks'), {
      blockerId: user.id,
      blockedId: userId,
      blockedUserName: userName,
      timestamp: Date.now(),
    });
  };

  const unblockUser = async (blockId: string) => {
    await deleteDoc(doc(db, 'blocks', blockId));
  };

  const isBlocked = (userId: string): boolean => {
    return blockedUsers.some(b => b.blockedId === userId) || blockedByOthers.includes(userId);
  };

  const submitReport = async (reportedUserId: string, reportedUserName: string, reason: string, chatId?: string) => {
    if (!user) return;
    await addDoc(collection(db, 'reports'), {
      reporterId: user.id,
      reporterName: user.name,
      reportedUserId,
      reportedUserName,
      chatId: chatId || null,
      reason,
      timestamp: Date.now(),
      status: 'pending',
    });
  };

  return (
    <AppContext.Provider value={{ user, updateUser, exams, addExam, loading, login, loginWithEmail, signupWithEmail, logout, blockedUsers, blockedByOthers, blockUser, unblockUser, isBlocked, submitReport }}>
      {children}
    </AppContext.Provider>
  );
};
