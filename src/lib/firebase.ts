import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY)
  ? import.meta.env.VITE_FIREBASE_API_KEY
  : (process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDS2V_B38FdQsT7wRdTqXgr-UdJAraZsdY');

const authDomain = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN)
  ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  : (process.env.VITE_FIREBASE_AUTH_DOMAIN || 'skillsnap-ai-a425b.firebaseapp.com');

const projectId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID)
  ? import.meta.env.VITE_FIREBASE_PROJECT_ID
  : (process.env.VITE_FIREBASE_PROJECT_ID || 'skillsnap-ai-a425b');

const storageBucket = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET)
  ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  : (process.env.VITE_FIREBASE_STORAGE_BUCKET || 'skillsnap-ai-a425b.firebasestorage.app');

const messagingSenderId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID)
  ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  : (process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '908200599883');

const appId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID)
  ? import.meta.env.VITE_FIREBASE_APP_ID
  : (process.env.VITE_FIREBASE_APP_ID || '1:908200599883:web:e28e85174f550b80dc88ce');

// Real environment check — confirms actual Firebase credentials exist
export const isLiveFirebaseConfigured = Boolean(
  apiKey &&
  projectId &&
  apiKey !== 'AIzaSyDemoPlaceholderKeySkillsSnapAI' &&
  !apiKey.includes('Placeholder')
);

if (!isLiveFirebaseConfigured) {
  const errorMsg = '❌ [Firebase Configuration Error] Missing required VITE_FIREBASE_* environment variables in .env file!';
  console.error(errorMsg);
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
