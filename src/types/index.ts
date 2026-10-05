// ─── Usuário (doador) ────────────────────────────────────────────────────────
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipoSanguineo: TipoSanguineo;
  ultimaDoacao: string | null; // ISO date string
  latitude?: number;
  longitude?: number;
}

// ─── Hemocentro ──────────────────────────────────────────────────────────────
export interface Hemocentro {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  horarioFuncionamento: string;
  distancia?: number; // km, calculada em runtime
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

// ─── Enums / Tipos literais ──────────────────────────────────────────────────
export type TipoSanguineo = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type NivelUrgencia = 'baixa' | 'media' | 'alta' | 'critica';

export type StatusSolicitacao = 'pendente' | 'aceita' | 'encerrada';

export type RespostaValor = 'aceita' | 'recusada';

// ─── Navegação ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Cadastro: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Mapa: undefined;
  Solicitacoes: undefined;
  Perfil: undefined;
};

export type SolicitacoesStackParamList = {
  ListaSolicitacoes: undefined;
  DetalhesSolicitacao: { solicitacaoId: string };
};

export type PerfilStackParamList = {
  PerfilHome: undefined;
  DefinirCasa: undefined;
};
