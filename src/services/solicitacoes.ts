import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Solicitacao, Resposta, Hemocentro } from '../types';

// ─── Buscar todas as solicitações pendentes ───────────────────────────────────
export async function buscarSolicitacoesPendentes(): Promise<Solicitacao[]> {
  // Sem orderBy para não exigir índice composto — ordenamos no cliente
  const q = query(
    collection(db, 'solicitacoes'),
    where('status', '==', 'pendente')
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Solicitacao));
  // Ordena por data decrescente no cliente
  return docs.sort((a, b) => (b.data > a.data ? 1 : -1));
}

// ─── Buscar solicitações aceitas por um doador ────────────────────────────────
export async function buscarSolicitacoesAceitas(doadorId: string): Promise<Solicitacao[]> {
  // Busca as respostas aceitas do doador
  const qResp = query(
    collection(db, 'respostas'),
    where('doadorId', '==', doadorId),
    where('resposta', '==', 'aceita')
  );
  const respSnap = await getDocs(qResp);

  // Para cada resposta, busca a solicitação correspondente
  const solicitacoes: Solicitacao[] = [];
  for (const respDoc of respSnap.docs) {
    const resp = respDoc.data() as Resposta;
    const solSnap = await getDoc(doc(db, 'solicitacoes', resp.solicitacaoId));
    if (solSnap.exists()) {
      solicitacoes.push({ id: solSnap.id, ...solSnap.data() } as Solicitacao);
    }
  }
  return solicitacoes;
}

// ─── Buscar detalhes de uma solicitação com hemocentro ────────────────────────
export async function buscarDetalhesSolicitacao(
  solicitacaoId: string
): Promise<{ solicitacao: Solicitacao; hemocentro: Hemocentro | null }> {
  const solSnap = await getDoc(doc(db, 'solicitacoes', solicitacaoId));
  if (!solSnap.exists()) throw new Error('Solicitação não encontrada');

  const solicitacao = { id: solSnap.id, ...solSnap.data() } as Solicitacao;

  let hemocentro: Hemocentro | null = null;
  if (solicitacao.hemocentroId) {
    // Buscar hemocentro pelo ownerId (que agora é igual ao hemocentroId da solicitação)
    const hemoQuery = query(
      collection(db, 'hemocentros'),
      where('ownerId', '==', solicitacao.hemocentroId)
    );
    const hemoSnap = await getDocs(hemoQuery);
    if (!hemoSnap.empty) {
      hemocentro = { id: hemoSnap.docs[0].id, ...hemoSnap.docs[0].data() } as Hemocentro;
    }
  }

  return { solicitacao, hemocentro };
}

// ─── Registrar resposta do doador ─────────────────────────────────────────────
export async function registrarResposta(
  solicitacaoId: string,
  doadorId: string,
  resposta: 'aceita' | 'recusada'
): Promise<void> {
  const novaResposta = {
    solicitacaoId,
    doadorId,
    resposta,
    data: new Date().toISOString(),
  };
  await addDoc(collection(db, 'respostas'), novaResposta);
  
  // Atualizar status na subcoleção candidatos (para o painel web)
  try {
    const candidatoRef = doc(db, 'solicitacoes', solicitacaoId, 'candidatos', doadorId);
    const candidatoSnap = await getDoc(candidatoRef);
    
    if (candidatoSnap.exists()) {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(candidatoRef, {
        status: resposta === 'aceita' ? 'aceitou' : 'recusou',
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar status do candidato:', error);
    // Não bloqueia a resposta se falhar
  }
}

// ─── Buscar todos os hemocentros ──────────────────────────────────────────────
export async function buscarHemocentros(): Promise<Hemocentro[]> {
  const snap = await getDocs(collection(db, 'hemocentros'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Hemocentro));
}

// ─── Verificar se doador já respondeu uma solicitação ─────────────────────────
export async function verificarResposta(
  solicitacaoId: string,
  doadorId: string
): Promise<Resposta | null> {
  const q = query(
    collection(db, 'respostas'),
    where('solicitacaoId', '==', solicitacaoId),
    where('doadorId', '==', doadorId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Resposta;
}
