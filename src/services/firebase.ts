import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// ATENÇÃO: Substitua estes valores pelas credenciais do seu projeto Firebase.
// Crie um projeto em https://console.firebase.google.com e copie o firebaseConfig.
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyBPXhwqKl9WW1E2Z2MGDqm3FPOJ51heIi4',
  authDomain: 'hemolink-mvp.firebaseapp.com',
  projectId: 'hemolink-mvp',
  storageBucket: 'hemolink-mvp.firebasestorage.app',
  messagingSenderId: '579721890471',
  appId: '1:579721890471:web:90c7b6dac27ddfa3c56982',
  measurementId: 'G-N8DDZSR6SB',
};

// Evita inicializar múltiplas vezes (hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth com persistência via AsyncStorage — sessão sobrevive ao fechar o app
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export default app;
