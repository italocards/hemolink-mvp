import { doc, updateDoc, increment, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { TituloDoador, Usuario } from '../types';

// ─── Tabela de pontos ────────────────────────────────────────────────────────
export const PONTOS = {
  CONFIRMACAO_DOACAO: 100,
  ACEITAR_SOLICITACAO: 20,
  PERFIL_COMPLETO: 15,
  DEFINIR_CASA: 10,
} as const;

// ─── Tabela de níveis ────────────────────────────────────────────────────────
export const NIVEIS: { titulo: TituloDoador; minPontos: number }[] = [
  { titulo: '🩸 Iniciante',   minPontos: 0 },
  { titulo: '💉 Doador',      minPontos: 100 },
  { titulo: '❤️ Herói Local', minPontos: 300 },
  { titulo: '🏅 Guardião',    minPontos: 600 },
  { titulo: '🌟 Lenda',       minPontos: 1000 },
];

// ─── Calcula título com base nos pontos ──────────────────────────────────────
export function calcularTitulo(pontos: number): TituloDoador {
  let titulo: TituloDoador = '🩸 Iniciante';
  for (const nivel of NIVEIS) {
    if (pontos >= nivel.minPontos) titulo = nivel.titulo;
    else break;
  }
  return titulo;
}

// ─── Progresso para o próximo nível (0–1) ───────────────────────────────────
export function calcularProgresso(pontos: number): {
  atual: TituloDoador;
  proximo: TituloDoador | null;
  progresso: number; // 0 a 1
  pontosRestantes: number;
} {
  let indiceAtual = 0;
  for (let i = 0; i < NIVEIS.length; i++) {
    if (pontos >= NIVEIS[i].minPontos) indiceAtual = i;
    else break;
  }

  const nivelAtual = NIVEIS[indiceAtual];
  const nivelProximo = NIVEIS[indiceAtual + 1] ?? null;

  if (!nivelProximo) {
    return {
      atual: nivelAtual.titulo,
      proximo: null,
      progresso: 1,
      pontosRestantes: 0,
    };
  }

  const pontosNoNivel = pontos - nivelAtual.minPontos;
  const intervaloPontos = nivelProximo.minPontos - nivelAtual.minPontos;
  const progresso = Math.min(pontosNoNivel / intervaloPontos, 1);
  const pontosRestantes = nivelProximo.minPontos - pontos;

  return {
    atual: nivelAtual.titulo,
    proximo: nivelProximo.titulo,
    progresso,
    pontosRestantes,
  };
}

// ─── Adiciona pontos ao usuário e recalcula título ───────────────────────────
export async function adicionarPontos(userId: string, quantidade: number): Promise<void> {
  const ref = doc(db, 'users', userId);

  // Usa increment atômico para evitar race conditions
  await updateDoc(ref, { pontos: increment(quantidade) });

  // Lê o valor atualizado para recalcular o título
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const dados = snap.data();
  const pontosAtuais = (dados.pontos ?? 0) as number;
  const novoTitulo = calcularTitulo(pontosAtuais);

  await updateDoc(ref, { titulo: novoTitulo });
}

// ─── Verifica se o bônus de perfil completo já foi concedido ────────────────
export async function verificarBonusPerfilCompleto(userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return false;
  return snap.data().bonusPerfilCompleto === true;
}

// ─── Concede bônus de perfil completo (uma única vez) ───────────────────────
export async function concederBonusPerfilCompleto(userId: string): Promise<void> {
  const jaRecebeu = await verificarBonusPerfilCompleto(userId);
  if (jaRecebeu) return;

  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { bonusPerfilCompleto: true });
  await adicionarPontos(userId, PONTOS.PERFIL_COMPLETO);
}

// ─── Verifica se o bônus de casa já foi concedido ───────────────────────────
export async function verificarBonusCasa(userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return false;
  return snap.data().bonusCasa === true;
}

// ─── Concede bônus de casa definida (uma única vez) ─────────────────────────
export async function concederBonusCasa(userId: string): Promise<void> {
  const jaRecebeu = await verificarBonusCasa(userId);
  if (jaRecebeu) return;

  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { bonusCasa: true });
  await adicionarPontos(userId, PONTOS.DEFINIR_CASA);
}

// ─── Buscar ranking global (top N usuários por pontos) ──────────────────────
export async function buscarRanking(limite: number = 50): Promise<Usuario[]> {
  // Firestore não permite orderBy em campo que pode ser undefined,
  // então buscamos todos e ordenamos no cliente para o MVP
  const snap = await getDocs(collection(db, 'users'));
  const usuarios = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Usuario));

  return usuarios
    .map((u) => ({ ...u, pontos: u.pontos ?? 0 }))
    .sort((a, b) => (b.pontos ?? 0) - (a.pontos ?? 0))
    .slice(0, limite);
}
