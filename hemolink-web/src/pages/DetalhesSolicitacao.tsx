import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { buscarDetalhesSolicitacao, buscarHemocentro, encerrarSolicitacao } from '../services/solicitacoes';
import { URGENCIA_LABELS, URGENCIA_COLORS } from '../types';
import type { Solicitacao, Hemocentro, Candidato } from '../types';

export default function DetalhesSolicitacao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [hemocentro, setHemocentro] = useState<Hemocentro | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [encerrando, setEncerrando] = useState(false);
  const [candidatoSelecionado, setCandidatoSelecionado] = useState<Candidato | null>(null);

  useEffect(() => {
    if (!id) return;
    carregarDados();
    
    // Listener em tempo real para candidatos (subcoleção)
    const candidatosRef = collection(db, 'solicitacoes', id, 'candidatos');
    const q = query(candidatosRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cands = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Candidato));
      
      // Ordenar por score (maior primeiro)
      cands.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      setCandidatos(cands);
    });

    return () => unsubscribe();
  }, [id]);

  async function carregarDados() {
    if (!id) return;
    
    setLoading(true);
    try {
      const solic = await buscarDetalhesSolicitacao(id);
      setSolicitacao(solic);
      
      if (solic?.hemocentroId) {
        const hemo = await buscarHemocentro(solic.hemocentroId);
        setHemocentro(hemo);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEncerrar() {
    if (!id || !confirm('Tem certeza que deseja encerrar esta solicitação?')) return;
    
    setEncerrando(true);
    try {
      await encerrarSolicitacao(id);
      alert('Solicitação encerrada com sucesso!');
      navigate('/solicitacoes');
    } catch (error) {
      alert('Erro ao encerrar solicitação. Tente novamente.');
    } finally {
      setEncerrando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!solicitacao) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Solicitação não encontrada.</p>
      </div>
    );
  }

  const urgColor = URGENCIA_COLORS[solicitacao.urgencia];
  const urgLabel = URGENCIA_LABELS[solicitacao.urgencia];
  const dataFormatada = new Date(solicitacao.data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const candidatosAceitos = candidatos.filter((c) => c.status === 'aceitou');
  const candidatosRecusados = candidatos.filter((c) => c.status === 'recusou');
  const candidatosPendentes = candidatos.filter((c) => c.status === 'pendente' || c.status === 'notificado' || c.status === 'visualizou');

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/solicitacoes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">{solicitacao.tipoSanguineo}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">Sangue {solicitacao.tipoSanguineo}</h1>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: urgColor }}
                >
                  {urgLabel}
                </span>
              </div>
              <p className="text-gray-600">Criada em {dataFormatada}</p>
            </div>
          </div>
        </div>
        
        {solicitacao.status !== 'encerrada' && (
          <button
            onClick={handleEncerrar}
            disabled={encerrando}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {encerrando ? 'Encerrando...' : 'Encerrar Solicitação'}
          </button>
        )}
      </div>

      {/* Layout dois painéis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo - Resumo */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            {solicitacao.status === 'pendente' && (
              <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 px-4 py-3 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-yellow-600"></span>
                <span className="font-semibold">Ativa</span>
              </div>
            )}
            {solicitacao.status === 'aceita' && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-green-600"></span>
                <span className="font-semibold">Aceita</span>
              </div>
            )}
            {solicitacao.status === 'encerrada' && (
              <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-4 py-3 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                <span className="font-semibold">Encerrada</span>
              </div>
            )}
          </div>

          {/* Card Resumo */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Confirmações</span>
                <span className="font-bold text-green-600 text-lg">{candidatosAceitos.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Recusaram</span>
                <span className="font-semibold text-gray-900">{candidatosRecusados.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pendentes</span>
                <span className="font-semibold text-gray-900">{candidatosPendentes.length}</span>
              </div>
            </div>
          </div>

          {/* Card Hemocentro */}
          {hemocentro && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Local</h2>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{hemocentro.nome}</p>
                <p className="text-sm text-gray-600">{hemocentro.endereco}</p>
                <p className="text-sm text-gray-600">{hemocentro.horarioFuncionamento}</p>
              </div>
            </div>
          )}
        </div>

        {/* Painel Direito - Candidatos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Candidatos ({candidatos.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">Acompanhe as respostas em tempo real</p>
            </div>

            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {candidatos.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-gray-500">Aguardando classificação de candidatos...</p>
                </div>
              ) : (
                candidatos.map((candidato, index) => {
                  const rank = index + 1;
                  const statusInfo: Record<string, { label: string; color: string }> = {
                    pendente:   { label: 'Não notificado', color: 'bg-gray-100 text-gray-600'   },
                    notificado: { label: 'Notificado',     color: 'bg-blue-100 text-blue-700'   },
                    visualizou: { label: 'Visualizou',     color: 'bg-yellow-100 text-yellow-700' },
                    aceitou:    { label: 'Confirmado',     color: 'bg-green-100 text-green-700' },
                    recusou:    { label: 'Recusou',        color: 'bg-red-100 text-red-700'     },
                  };
                  const status = statusInfo[candidato.status] || statusInfo.pendente;

                  return (
                    <div
                      key={candidato.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
                    >
                      {/* Posição */}
                      <div className="w-8 flex-shrink-0 text-center">
                        <span className="text-sm font-medium text-gray-400">{rank}</span>
                      </div>

                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-gray-900 truncate">{candidato.nome}</p>
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {candidato.tipoSanguineo}
                          </span>
                          {candidato.lote && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              Lote {candidato.lote}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {candidato.ultimaDoacao ? (
                            <span>Última doação: {new Date(candidato.ultimaDoacao).toLocaleDateString('pt-BR')}</span>
                          ) : (
                            <span>Sem registro de doação</span>
                          )}
                          {candidato.distancia !== undefined && (
                            <>
                              <span>·</span>
                              <span>{candidato.distancia.toFixed(1)} km do hemocentro</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-center w-16">
                        <div className="text-base font-semibold text-gray-800">{candidato.score?.toFixed(1) ?? '—'}</div>
                        <div className="text-xs text-gray-400">score</div>
                      </div>

                      {/* Status */}
                      <div className="min-w-[110px] text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Detalhes */}
                      <button
                        onClick={() => setCandidatoSelecionado(candidato)}
                        className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        Detalhes
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Info sobre algoritmo de classificação */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-blue-900 text-sm">Classificação Inteligente</p>
              <p className="text-blue-800 text-sm mt-1">
                Os candidatos são classificados por um score que combina proximidade geográfica, histórico de doações e disponibilidade.
                Esta é uma versão de demonstração. O algoritmo completo será implementado no próximo semestre.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer simples para detalhes do candidato */}
      {candidatoSelecionado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCandidatoSelecionado(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{candidatoSelecionado.nome}</h3>
                <p className="text-sm text-gray-500 mt-0.5">Detalhes do candidato</p>
              </div>
              <button onClick={() => setCandidatoSelecionado(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Tipo sanguíneo</span>
                <span className="text-sm font-semibold text-gray-900">{candidatoSelecionado.tipoSanguineo}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Score de prioridade</span>
                <span className="text-sm font-semibold text-gray-900">{candidatoSelecionado.score?.toFixed(1) ?? '—'}</span>
              </div>
              {candidatoSelecionado.distancia !== undefined && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">Distância</span>
                  <span className="text-sm font-semibold text-gray-900">{candidatoSelecionado.distancia.toFixed(1)} km</span>
                </div>
              )}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Última doação</span>
                <span className="text-sm font-semibold text-gray-900">
                  {candidatoSelecionado.ultimaDoacao
                    ? new Date(candidatoSelecionado.ultimaDoacao).toLocaleDateString('pt-BR')
                    : 'Sem registro'}
                </span>
              </div>
              {candidatoSelecionado.lote && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">Lote de notificação</span>
                  <span className="text-sm font-semibold text-gray-900">Lote {candidatoSelecionado.lote}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Status</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">{candidatoSelecionado.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
