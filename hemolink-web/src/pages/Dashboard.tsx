import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { buscarSolicitacoesHemocentro, buscarRespostasPorSolicitacoes, calcularMetricas } from '../services/solicitacoes';
import { URGENCIA_LABELS, URGENCIA_COLORS } from '../types';
import type { Solicitacao, Resposta } from '../types';
import MetricCard from '../components/MetricCard';

export default function Dashboard() {
  const { user, hemocentro } = useAuth();
  const navigate = useNavigate();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [user]);

  async function carregarDados() {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const solic = await buscarSolicitacoesHemocentro(user.uid);
      setSolicitacoes(solic);

      const solicitacaoIds = solic.map((s) => s.id);
      const resp = await buscarRespostasPorSolicitacoes(solicitacaoIds);
      setRespostas(resp);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const metricas = calcularMetricas(solicitacoes, respostas);
  const solicitacoesRecentes = solicitacoes.slice(0, 5);

  // Dados para o gráfico (simples, via CSS)
  const tiposOrdenados = Object.entries(metricas.tiposCont)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxValor = Math.max(...tiposOrdenados.map((t) => t[1]), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Painel de Gestão</p>
          <h1 className="text-2xl font-bold text-gray-900">
            {hemocentro?.nome || 'Hemocentro'}
          </h1>
          {hemocentro?.endereco && (
            <p className="text-sm text-gray-500 mt-0.5">{hemocentro.endereco}</p>
          )}
        </div>
        <button
          onClick={() => navigate('/solicitacoes')}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
        >
          + Nova Solicitação
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Solicitações Abertas"
          value={metricas.abertas}
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Confirmações"
          value={metricas.totalAceites}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <MetricCard
          title="Criadas Hoje"
          value={metricas.criadasHoje}
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <MetricCard
          title="Doadores Ativos"
          value={metricas.doadoresUnicos}
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          color="text-primary"
          bgColor="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Solicitações Recentes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Solicitações Recentes</h2>
            <button
              onClick={() => navigate('/solicitacoes')}
              className="text-primary hover:text-primary/80 text-sm font-semibold"
            >
              Ver todas →
            </button>
          </div>

          {solicitacoesRecentes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma solicitação criada ainda</p>
          ) : (
            <div className="space-y-3">
              {solicitacoesRecentes.map((solic) => {
                const respostasCount = respostas.filter((r) => r.solicitacaoId === solic.id && r.resposta === 'aceita').length;
                const tempo = calcularTempoRelativo(solic.data);
                const urgColor = URGENCIA_COLORS[solic.urgencia];

                return (
                  <div
                    key={solic.id}
                    onClick={() => navigate(`/solicitacoes/${solic.id}`)}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary/50 hover:bg-gray-50 cursor-pointer transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{solic.tipoSanguineo}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white"
                          style={{ backgroundColor: urgColor }}
                        >
                          {URGENCIA_LABELS[solic.urgencia]}
                        </span>
                        <span className="text-xs text-gray-500">{tempo}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {respostasCount} {respostasCount === 1 ? 'confirmação' : 'confirmações'}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gráfico de tipos mais solicitados */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Tipos Mais Solicitados</h2>

          {tiposOrdenados.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum dado disponível</p>
          ) : (
            <div className="space-y-4">
              {tiposOrdenados.map(([tipo, count]) => {
                const porcentagem = (count / maxValor) * 100;
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">{tipo}</span>
                      <span className="text-sm text-gray-600">{count} {count === 1 ? 'solicitação' : 'solicitações'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary h-3 rounded-full transition-all duration-500"
                        style={{ width: `${porcentagem}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function calcularTempoRelativo(data: string): string {
  const agora = new Date();
  const dataSolic = new Date(data);
  const diffMs = agora.getTime() - dataSolic.getTime();
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDias = Math.floor(diffHoras / 24);

  if (diffHoras < 1) return 'há poucos minutos';
  if (diffHoras === 1) return 'há 1 hora';
  if (diffHoras < 24) return `há ${diffHoras}h`;
  if (diffDias === 1) return 'há 1 dia';
  return `há ${diffDias} dias`;
}
