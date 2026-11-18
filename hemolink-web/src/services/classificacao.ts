import { collection, getDocs, query, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Usuario, Candidato, TipoSanguineo, Hemocentro } from '../types';

/**
 * Calcula a distância entre dois pontos (em km) usando a fórmula de Haversine
 */
function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula um score mock para um doador baseado em:
 * - Proximidade geográfica (40%)
 * - Histórico de doações/pontos (30%)
 * - Tempo desde última doação (30%)
 * 
 * NOTA: Este é um algoritmo simplificado para demonstração.
 * O algoritmo real será implementado no próximo semestre.
 */
function calcularScoreMock(
  doador: Usuario,
  hemocentro: Hemocentro
): number {
  let score = 0;

  // 1. Proximidade (0-40 pontos)
  if (doador.latitude && doador.longitude) {
    const distancia = calcularDistancia(
      doador.latitude,
      doador.longitude,
      hemocentro.latitude,
      hemocentro.longitude
    );
    // Quanto mais próximo, maior o score
    // 0km = 40pts, 50km+ = 0pts
    const proximidadeScore = Math.max(0, 40 - distancia * 0.8);
    score += proximidadeScore;
  }

  // 2. Histórico/Pontos (0-30 pontos)
  const pontos = doador.pontos || 0;
  // Normalizar pontos (assumindo max ~500 pontos)
  const historicoScore = Math.min(30, (pontos / 500) * 30);
  score += historicoScore;

  // 3. Tempo desde última doação (0-30 pontos)
  if (doador.ultimaDoacao) {
    const ultimaDoacao = new Date(doador.ultimaDoacao);
    const agora = new Date();
    const diasDesdeUltimaDoacao = Math.floor(
      (agora.getTime() - ultimaDoacao.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Entre 60-90 dias é o ideal (doador elegível e provavelmente disponível)
    // Menos de 60 dias = não elegível (score baixo)
    // Mais de 90 dias = bom (score alto, mas não máximo)
    if (diasDesdeUltimaDoacao < 60) {
      score += (diasDesdeUltimaDoacao / 60) * 10; // Penalizar muito
    } else if (diasDesdeUltimaDoacao <= 120) {
      score += 30; // Ideal
    } else {
      // Decai lentamente após 120 dias
      const penalidade = Math.max(0, (diasDesdeUltimaDoacao - 120) / 30);
      score += Math.max(15, 30 - penalidade);
    }
  } else {
    // Nunca doou, score médio
    score += 20;
  }

  // Adicionar pequena variação aleatória para desempate
  score += Math.random() * 5;

  return Math.round(score * 10) / 10; // Arredondar para 1 casa decimal
}

/**
 * Verifica compatibilidade de tipo sanguíneo
 */
function verificarCompatibilidade(
  tipoDoador: TipoSanguineo,
  tipoSolicitado: TipoSanguineo | 'todos'
): boolean {
  if (tipoSolicitado === 'todos') return true;
  if (tipoDoador === tipoSolicitado) return true;

  // Matriz de compatibilidade (doador -> receptor)
  const compatibilidades: Record<TipoSanguineo, TipoSanguineo[]> = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Doador universal
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'], // Receptor universal
  };

  return compatibilidades[tipoDoador]?.includes(tipoSolicitado) || false;
}

/**
 * Gera classificação mock de candidatos para uma solicitação e "notifica" os doadores do lote inicial
 * 
 * @param solicitacaoId - ID da solicitação
 * @param hemocentro - Dados do hemocentro
 * @param tipoSanguineo - Tipo sanguíneo solicitado (ou 'todos')
 * @param loteInicial - Quantidade de doadores no lote inicial
 * 
 * @returns Array de candidatos com score calculado
 */
export async function gerarClassificacaoMock(
  solicitacaoId: string,
  hemocentro: Hemocentro,
  tipoSanguineo: TipoSanguineo | 'todos',
  loteInicial: number = 50
): Promise<Candidato[]> {
  try {
    // Buscar todos os usuários (doadores) do Firestore
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const doadores: Usuario[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Usuario));

    // Filtrar doadores compatíveis
    const doadoresCompativeis = doadores.filter((doador) =>
      verificarCompatibilidade(doador.tipoSanguineo, tipoSanguineo)
    );

    // Calcular score para cada doador
    const candidatos: Candidato[] = doadoresCompativeis.map((doador) => {
      const score = calcularScoreMock(doador, hemocentro);
      
      let distancia: number | undefined = undefined;
      if (doador.latitude && doador.longitude) {
        distancia = calcularDistancia(
          doador.latitude,
          doador.longitude,
          hemocentro.latitude,
          hemocentro.longitude
        );
        distancia = Math.round(distancia * 10) / 10; // Arredondar
      }

      return {
        id: doador.id,
        nome: doador.nome,
        tipoSanguineo: doador.tipoSanguineo,
        pontos: doador.pontos || 0,
        titulo: doador.titulo || '🩸 Iniciante',
        ultimaDoacao: doador.ultimaDoacao,
        distancia,
        status: 'pendente',
        lote: undefined,
        score,
      };
    });

    // Ordenar por score (maior primeiro)
    candidatos.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Marcar os primeiros N como lote 1 e status "notificado"
    candidatos.slice(0, loteInicial).forEach((candidato) => {
      candidato.lote = 1;
      candidato.status = 'notificado';
    });

    // Salvar candidatos no Firestore (subcoleção de cada solicitação)
    const batch: Promise<void>[] = [];
    candidatos.forEach((candidato) => {
      const candidatoRef = doc(
        db,
        'solicitacoes',
        solicitacaoId,
        'candidatos',
        candidato.id
      );
      batch.push(setDoc(candidatoRef, candidato));
    });

    await Promise.all(batch);

    // Mock: Simular envio de notificação push para os candidatos do lote 1
    // Em produção, isso seria feito via Cloud Functions / Firebase Cloud Messaging
    console.log(`✅ ${loteInicial} candidatos notificados (mock)`);

    return candidatos;
  } catch (error) {
    console.error('Erro ao gerar classificação mock:', error);
    throw error;
  }
}

/**
 * Busca candidatos de uma solicitação
 */
export async function buscarCandidatos(solicitacaoId: string): Promise<Candidato[]> {
  try {
    const candidatosRef = collection(db, 'solicitacoes', solicitacaoId, 'candidatos');
    const q = query(candidatosRef);
    const snapshot = await getDocs(q);
    
    const candidatos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Candidato));

    // Ordenar por score
    candidatos.sort((a, b) => (b.score || 0) - (a.score || 0));

    return candidatos;
  } catch (error) {
    console.error('Erro ao buscar candidatos:', error);
    return [];
  }
}

/**
 * Atualiza o status de um candidato quando ele responde à solicitação
 */
export async function atualizarStatusCandidato(
  solicitacaoId: string,
  doadorId: string,
  novoStatus: 'visualizou' | 'aceitou' | 'recusou'
): Promise<void> {
  try {
    const candidatoRef = doc(
      db,
      'solicitacoes',
      solicitacaoId,
      'candidatos',
      doadorId
    );
    
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(candidatoRef, { status: novoStatus });
  } catch (error) {
    console.error('Erro ao atualizar status do candidato:', error);
    throw error;
  }
}
