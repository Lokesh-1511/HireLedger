// Firebase initialization
// NOTE: Values are currently hard-coded from provided config; for production move to environment variables.
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from 'firebase/analytics'; // Only in production + browser with measurement ID

// Support both Vite (browser/build) and plain Node (seed scripts) environments.
// Vite exposes vars on import.meta.env; Node seed scripts rely on process.env.
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : process.env || {};
function requireEnv(key) {
  const val = env[key];
  if (!val) {
    throw new Error(`Missing required Firebase env variable: ${key}`);
  }
  return val;
}

const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('VITE_FIREBASE_APP_ID'),
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID // optional
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
