import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { buscarSolicitacoesHemocentro, buscarRespostasPorSolicitacoes } from '../services/solicitacoes';
import { URGENCIA_LABELS, URGENCIA_COLORS } from '../types';
import type { Solicitacao, Resposta, TipoSanguineo, NivelUrgencia, StatusSolicitacao } from '../types';

export default function Solicitacoes() {
  const { user, hemocentro } = useAuth();
  const navigate = useNavigate();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<StatusSolicitacao | 'todas'>('todas');
  const [filtroUrgencia, setFiltroUrgencia] = useState<NivelUrgencia | 'todas'>('todas');
  const [filtroTipo, setFiltroTipo] = useState<TipoSanguineo | 'todos'>('todos');

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
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  }

  // Aplicar filtros
  const solicitacoesFiltradas = solicitacoes.filter((s) => {
    if (filtroStatus !== 'todas' && s.status !== filtroStatus) return false;
    if (filtroUrgencia !== 'todas' && s.urgencia !== filtroUrgencia) return false;
    if (filtroTipo !== 'todos' && s.tipoSanguineo !== filtroTipo) return false;
    return true;
  });

  const contarConfirmacoes = (solicitacaoId: string) => {
    return respostas.filter((r) => r.solicitacaoId === solicitacaoId && r.resposta === 'aceita').length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solicitações</h1>
          <p className="text-gray-600 mt-1">Gerencie suas solicitações de sangue</p>
        </div>
        <button
          onClick={() => navigate('/solicitacoes/nova')}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Solicitação
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as StatusSolicitacao | 'todas')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="todas">Todas</option>
              <option value="pendente">Pendente</option>
              <option value="aceita">Aceita</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </div>

          {/* Filtro Urgência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgência</label>
            <select
              value={filtroUrgencia}
              onChange={(e) => setFiltroUrgencia(e.target.value as NivelUrgencia | 'todas')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="todas">Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          {/* Filtro Tipo Sanguíneo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Sanguíneo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as TipoSanguineo | 'todos')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="todos">Todos</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela/Lista de Solicitações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {solicitacoesFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">Nenhuma solicitação encontrada</p>
            <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros ou crie uma nova solicitação</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Urgência
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Confirmações
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {solicitacoesFiltradas.map((solic) => {
                  const confirmacoes = contarConfirmacoes(solic.id);
                  const urgColor = URGENCIA_COLORS[solic.urgencia];
                  const dataFormatada = new Date(solic.data).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={solic.id}
                      onClick={() => navigate(`/solicitacoes/${solic.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{solic.tipoSanguineo}</span>
                          </div>
                          <span className="font-medium text-gray-900">Sangue {solic.tipoSanguineo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: urgColor }}
                        >
                          {URGENCIA_LABELS[solic.urgencia]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {solic.status === 'pendente' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span>
                            Pendente
                          </span>
                        )}
                        {solic.status === 'aceita' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                            Aceita
                          </span>
                        )}
                        {solic.status === 'encerrada' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                            Encerrada
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">{confirmacoes}</span>
                        <span className="text-sm text-gray-500 ml-1">{confirmacoes === 1 ? 'confirmação' : 'confirmações'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {dataFormatada}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/solicitacoes/${solic.id}`);
                          }}
                          className="text-primary hover:text-primary/80 font-semibold text-sm"
                        >
                          Ver detalhes →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer com contagem */}
      <div className="text-center text-sm text-gray-500">
        Mostrando {solicitacoesFiltradas.length} de {solicitacoes.length} solicitações
      </div>
    </div>
  );
}
