// Firebase initialization
// NOTE: Values are currently hard-coded from provided config; for production move to environment variables.
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from 'firebase/analytics'; // Only in production + browser with measurement ID

// Support both Vite (browser/build) and plain Node (seed scripts) environments.
// Vite exposes vars on import.meta.env; Node seed scripts rely on process.env.
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : process.env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || 'AIzaSyAcj2Ub6TGkpd24iB6l9IBnWqeu4Jd-4X4',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || 'hireledger.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || 'hireledger',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || 'hireledger.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || '1690939787',
  appId: env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID || '1:1690939787:web:389d2e9d07d2a1982ebf8e',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || env.FIREBASE_MEASUREMENT_ID || 'G-K8JZYFP9ZD'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
