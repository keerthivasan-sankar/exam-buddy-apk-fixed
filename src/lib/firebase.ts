import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

const isCustomFirebase = !!import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || (firebaseConfigJson as any).measurementId,
};

const app = initializeApp(firebaseConfig);

// If using custom Firebase in Vercel, default to '(default)' database unless specified
// If using AI Studio Firebase, use the auto-generated database ID
const databaseId = isCustomFirebase 
  ? (import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)')
  : firebaseConfigJson.firestoreDatabaseId;

export const db = getFirestore(app, databaseId);
import { enableIndexedDbPersistence } from "firebase/firestore";
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == "failed-precondition") {
    console.log("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
  } else if (err.code == "unimplemented") {
    console.log("The current browser does not support all of the features required to enable persistence");
  }
});

export const auth = getAuth(app);

// Ensure local persistence for sessions
setPersistence(auth, browserLocalPersistence)
  .catch((err) => console.error("Firebase persistence error:", err));

