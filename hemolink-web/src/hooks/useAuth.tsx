import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Hemocentro } from '../types';

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
        // Buscar dados do hemocentro pelo ownerId
        try {
          const hemocentrosRef = await getDoc(doc(db, 'hemocentros', firebaseUser.uid));
          if (hemocentrosRef.exists()) {
            setHemocentro({ id: hemocentrosRef.id, ...hemocentrosRef.data() } as Hemocentro);
          } else {
            // Se não encontrou por ID direto, busca onde ownerId == uid
            // Por enquanto vamos assumir que o ID do documento é o ownerId
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
