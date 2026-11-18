import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Mesmo projeto Firebase do app mobile
const firebaseConfig = {
  apiKey: 'AIzaSyBPXhwqKl9WW1E2Z2MGDqm3FPOJ51heIi4',
  authDomain: 'hemolink-mvp.firebaseapp.com',
  projectId: 'hemolink-mvp',
  storageBucket: 'hemolink-mvp.firebasestorage.app',
  messagingSenderId: '579721890471',
  appId: '1:579721890471:web:90c7b6dac27ddfa3c56982',
  measurementId: 'G-N8DDZSR6SB',
};

// Evita inicializar múltiplas vezes
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
