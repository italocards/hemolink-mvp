import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Solicitacao, Resposta, Hemocentro } from '../types';

/**
 * Busca todas as solicitações de um hemocentro
 */
export async function buscarSolicitacoesHemocentro(hemocentroId: string): Promise<Solicitacao[]> {
  try {
    const q = query(
      collection(db, 'solicitacoes'),
      where('hemocentroId', '==', hemocentroId)
    );
    const snapshot = await getDocs(q);
    const solicitacoes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Solicitacao));
    
    // Ordenar manualmente no cliente
    solicitacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
    return solicitacoes;
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    return [];
  }
}

/**
 * Busca respostas para uma lista de solicitações
 */
export async function buscarRespostasPorSolicitacoes(solicitacaoIds: string[]): Promise<Resposta[]> {
  if (solicitacaoIds.length === 0) return [];
  
  try {
    const q = query(
      collection(db, 'respostas'),
      where('solicitacaoId', 'in', solicitacaoIds.slice(0, 10)) // Firestore limita 'in' a 10 itens
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resposta));
  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    return [];
  }
}

/**
 * Busca dados do hemocentro
 */
export async function buscarHemocentro(hemocentroId: string): Promise<Hemocentro | null> {
  try {
    const docRef = doc(db, 'hemocentros', hemocentroId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Hemocentro;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar hemocentro:', error);
    return null;
  }
}

/**
 * Calcula métricas do dashboard
 */
export function calcularMetricas(solicitacoes: Solicitacao[], respostas: Resposta[]) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const abertas = solicitacoes.filter((s) => s.status === 'pendente' || s.status === 'aceita').length;
  const criadasHoje = solicitacoes.filter((s) => {
    const dataSolic = new Date(s.data);
    dataSolic.setHours(0, 0, 0, 0);
    return dataSolic.getTime() === hoje.getTime();
  }).length;

  const respostasAceitas = respostas.filter((r) => r.resposta === 'aceita');
  const totalAceites = respostasAceitas.length;
  
  // Contar doadores únicos que aceitaram
  const doadoresUnicos = new Set(respostasAceitas.map((r) => r.doadorId)).size;

  // Tipos mais solicitados
  const tiposCont: Record<string, number> = {};
  solicitacoes.forEach((s) => {
    tiposCont[s.tipoSanguineo] = (tiposCont[s.tipoSanguineo] || 0) + 1;
  });

  return {
    abertas,
    criadasHoje,
    totalAceites,
    doadoresUnicos,
    tiposCont,
  };
}

/**
 * Cria uma nova solicitação no Firestore e gera classificação de candidatos
 */
export async function criarSolicitacao(
  userUid: string, // UID do Firebase Auth (ownerId do hemocentro)
  tipoSanguineo: string,
  urgencia: string,
  loteInicial: number = 50
): Promise<string> {
  try {
    const { addDoc, collection } = await import('firebase/firestore');
    const { gerarClassificacaoMock } = await import('./classificacao');
    
    const novaSolicitacao = {
      tipoSanguineo,
      urgencia,
      hemocentroId: userUid, // Salvar o UID do Firebase Auth
      data: new Date().toISOString(),
      status: 'pendente',
    };

    const docRef = await addDoc(collection(db, 'solicitacoes'), novaSolicitacao);
    
    // Buscar hemocentro pelo ownerId (userUid)
    const hemocentrosRef = collection(db, 'hemocentros');
    const q = query(hemocentrosRef, where('ownerId', '==', userUid));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const hemocentro = { 
        id: snapshot.docs[0].id, 
        ...snapshot.docs[0].data() 
      } as Hemocentro;
      
      // Gerar classificação mock em segundo plano
      gerarClassificacaoMock(
        docRef.id,
        hemocentro,
        tipoSanguineo as any,
        loteInicial
      ).catch((err) => {
        console.error('Erro ao gerar classificação:', err);
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar solicitação:', error);
    throw error;
  }
}

/**
 * Busca detalhes de uma solicitação específica
 */
export async function buscarDetalhesSolicitacao(solicitacaoId: string): Promise<Solicitacao | null> {
  try {
    const docRef = doc(db, 'solicitacoes', solicitacaoId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Solicitacao;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar detalhes da solicitação:', error);
    return null;
  }
}

/**
 * Encerra uma solicitação
 */
export async function encerrarSolicitacao(solicitacaoId: string): Promise<void> {
  try {
    const { updateDoc, doc } = await import('firebase/firestore');
    const docRef = doc(db, 'solicitacoes', solicitacaoId);
    await updateDoc(docRef, { status: 'encerrada' });
  } catch (error) {
    console.error('Erro ao encerrar solicitação:', error);
    throw error;
  }
}

/**
 * Busca doadores (usuários) que responderam a uma solicitação
 */
export async function buscarDoadoresPorResposta(respostas: Resposta[]) {
  if (respostas.length === 0) return [];
  
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    // Pegar IDs únicos de doadores
    const doadorIds = [...new Set(respostas.map((r) => r.doadorId))];
    
    // Firestore limita 'in' a 10 itens por vez
    const chunks: string[][] = [];
    for (let i = 0; i < doadorIds.length; i += 10) {
      chunks.push(doadorIds.slice(i, i + 10));
    }
    
    const doadores = [];
    for (const chunk of chunks) {
      const q = query(collection(db, 'users'), where('id', 'in', chunk));
      const snapshot = await getDocs(q);
      doadores.push(...snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }
    
    return doadores;
  } catch (error) {
    console.error('Erro ao buscar doadores:', error);
    return [];
  }
}
