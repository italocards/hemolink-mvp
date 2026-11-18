import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { buscarDetalhesSolicitacao, buscarHemocentro, encerrarSolicitacao, buscarDoadoresPorResposta } from '../services/solicitacoes';
import { Solicitacao, Hemocentro, Resposta, Usuario, URGENCIA_LABELS, URGENCIA_COLORS } from '../types';

export default function DetalhesSolicitacao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [hemocentro, setHemocentro] = useState<Hemocentro | null>(null);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [doadores, setDoadores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [encerrando, setEncerrando] = useState(false);
  const [doadorSelecionado, setDoadorSelecionado] = useState<Usuario | null>(null);

  useEffect(() => {
    if (!id) return;
    carregarDados();
    
    // Listener em tempo real para respostas
    const q = query(collection(db, 'respostas'), where('solicitacaoId', '==', id));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const resps = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resposta));
      setRespostas(resps);
      
      // Buscar dados dos doadores que responderam
      const doads = await buscarDoadoresPorResposta(resps);
      setDoadores(doads as Usuario[]);
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

  const respostasAceitas = respostas.filter((r) => r.resposta === 'aceita');
  const respostasRecusadas = respostas.filter((r) => r.resposta === 'recusada');
  const pendentes = 0; // Por enquanto não temos sistema de "visualizou mas não respondeu"

  // Preparar lista de candidatos com dados dos doadores
  const candidatos = respostas.map((resposta) => {
    const doador = doadores.find((d) => d.id === resposta.doadorId);
    return { resposta, doador };
  }).filter((c) => c.doador); // Remove respostas sem doador encontrado

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
                <span className="text-gray-600">Total de aceites</span>
                <span className="font-bold text-green-600 text-lg">{respostasAceitas.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Recusaram</span>
                <span className="font-semibold text-gray-900">{respostasRecusadas.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pendentes</span>
                <span className="font-semibold text-gray-900">{pendentes}</span>
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
                  <p className="text-gray-500">Nenhum doador respondeu ainda</p>
                </div>
              ) : (
                candidatos.map(({ resposta, doador }) => {
                  if (!doador) return null;
                  
                  const aceitou = resposta.resposta === 'aceita';
                  
                  return (
                    <div
                      key={resposta.id}
                      className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
                    >
                      {/* Avatar/Ícone */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${aceitou ? 'bg-green-100' : 'bg-red-100'}`}>
                        <svg className={`w-6 h-6 ${aceitou ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {aceitou ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          )}
                        </svg>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 truncate">{doador.nome}</p>
                          <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {doador.tipoSanguineo}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {doador.pontos || 0} pts • {doador.titulo || '🩸 Iniciante'}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          aceitou ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {aceitou ? '✓ Aceitou' : '✕ Recusou'}
                        </span>
                      </div>

                      {/* Botão ver mais */}
                      <button
                        onClick={() => setDoadorSelecionado(doador)}
                        className="text-primary hover:text-primary/80 font-semibold text-sm"
                      >
                        Ver mais →
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
              <p className="font-semibold text-blue-900 text-sm">Lote de notificação</p>
              <p className="text-blue-800 text-sm mt-1">
                O sistema de classificação e notificação em lotes será implementado no próximo semestre.
                Por enquanto, todos os doadores compatíveis recebem a notificação simultaneamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer simples para detalhes do doador */}
      {doadorSelecionado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDoadorSelecionado(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{doadorSelecionado.nome}</h3>
              <button onClick={() => setDoadorSelecionado(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Tipo sanguíneo</span>
                <span className="font-semibold text-gray-900">{doadorSelecionado.tipoSanguineo}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Pontuação</span>
                <span className="font-semibold text-gray-900">{doadorSelecionado.pontos || 0} pts</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Título</span>
                <span className="font-semibold text-gray-900">{doadorSelecionado.titulo || '🩸 Iniciante'}</span>
              </div>
              {doadorSelecionado.ultimaDoacao && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Última doação</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(doadorSelecionado.ultimaDoacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
