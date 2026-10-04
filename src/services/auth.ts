import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Usuario, TipoSanguineo } from '../types';

// ─── Cadastrar novo doador ────────────────────────────────────────────────────
export async function cadastrarUsuario(
  nome: string,
  email: string,
  senha: string,
  tipoSanguineo: TipoSanguineo,
  ultimaDoacao: string | null
): Promise<Usuario> {
  const credential = await createUserWithEmailAndPassword(auth, email, senha);
  const uid = credential.user.uid;

  const novoUsuario: Usuario = {
    id: uid,
    nome,
    email,
    tipoSanguineo,
    ultimaDoacao,
  };

  await setDoc(doc(db, 'users', uid), novoUsuario);
  return novoUsuario;
}

// ─── Entrar ───────────────────────────────────────────────────────────────────
export async function entrar(email: string, senha: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, senha);
  return credential.user;
}

// ─── Sair ─────────────────────────────────────────────────────────────────────
export async function sair(): Promise<void> {
  await signOut(auth);
}

// ─── Buscar dados do usuário no Firestore ─────────────────────────────────────
export async function buscarUsuario(uid: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as Usuario;
}

// ─── Observer de autenticação ────────────────────────────────────────────────
export function observarAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
