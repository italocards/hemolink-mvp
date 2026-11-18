import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import type { Hemocentro } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  hemocentro: Hemocentro | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [hemocentro, setHemocentro] = useState<Hemocentro | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Busca hemocentro onde ownerId == uid do usuário autenticado
        try {
          const q = query(
            collection(db, 'hemocentros'),
            where('ownerId', '==', firebaseUser.uid)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            setHemocentro({ id: docSnap.id, ...docSnap.data() } as Hemocentro);
          } else {
            setHemocentro(null);
          }
        } catch (error) {
          console.error('Erro ao buscar hemocentro:', error);
          setHemocentro(null);
        }
      } else {
        setHemocentro(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw new Error(error.message || 'Erro ao fazer login');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setHemocentro(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, hemocentro, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
