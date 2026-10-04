import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { observarAuth, buscarUsuario } from '../services/auth';
import { Usuario } from '../types';

interface AuthContextData {
  firebaseUser: User | null;
  usuario: Usuario | null;
  carregando: boolean;
  setUsuario: (u: Usuario | null) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = observarAuth(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const dados = await buscarUsuario(user.uid);
        setUsuario(dados);
      } else {
        setUsuario(null);
      }
      setCarregando(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, usuario, carregando, setUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
