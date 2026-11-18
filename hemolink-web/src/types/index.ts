// ─── Usuário (doador) ────────────────────────────────────────────────────────
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipoSanguineo: TipoSanguineo;
  ultimaDoacao: string | null; // ISO date string
  latitude?: number;
  longitude?: number;
  pontos?: number;
  titulo?: TituloDoador;
}

// ─── Títulos de doador ───────────────────────────────────────────────────────
export type TituloDoador =
  | '🩸 Iniciante'
  | '💉 Doador'
  | '❤️ Herói Local'
  | '🏅 Guardião'
  | '🌟 Lenda';

// ─── Hemocentro ──────────────────────────────────────────────────────────────
export interface Hemocentro {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  horarioFuncionamento: string;
  distancia?: number; // km, calculada em runtime
  email?: string; // adicionado para o painel web
  ownerId?: string; // uid do Firebase Auth do hemocentro
}

// ─── Solicitação ─────────────────────────────────────────────────────────────
export interface Solicitacao {
  id: string;
  tipoSanguineo: TipoSanguineo;
  urgencia: NivelUrgencia;
  hemocentroId: string;
  hemocentroNome?: string; // populado em runtime
  hemocentroEndereco?: string;
  distancia?: number;
  data: string; // ISO date string
  status: StatusSolicitacao;
}

// ─── Resposta do doador ──────────────────────────────────────────────────────
export interface Resposta {
  id: string;
  solicitacaoId: string;
  doadorId: string;
  resposta: RespostaValor;
  data: string; // ISO date string
}

// ─── Candidato (para painel de classificação) ────────────────────────────────
export interface Candidato {
  id: string; // uid do doador
  nome: string;
  tipoSanguineo: TipoSanguineo;
  pontos: number;
  titulo: TituloDoador;
  ultimaDoacao: string | null;
  distancia?: number;
  status: StatusCandidato;
  lote?: number; // qual lote de notificação (1, 2, 3...)
  score?: number; // score do algoritmo (placeholder por enquanto)
}

export type StatusCandidato = 'pendente' | 'notificado' | 'visualizou' | 'aceitou' | 'recusou';

// ─── Enums / Tipos literais ──────────────────────────────────────────────────
export type TipoSanguineo = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type NivelUrgencia = 'baixa' | 'media' | 'alta' | 'critica';

export type StatusSolicitacao = 'pendente' | 'aceita' | 'encerrada';

export type RespostaValor = 'aceita' | 'recusada';

// ─── Constantes de cores por urgência ───────────────────────────────────────
export const URGENCIA_COLORS: Record<NivelUrgencia, string> = {
  critica: '#DC2626',
  alta: '#EA580C',
  media: '#F59E0B',
  baixa: '#16A34A',
};

export const URGENCIA_LABELS: Record<NivelUrgencia, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};
