import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { criarSolicitacao } from '../services/solicitacoes';
import { URGENCIA_LABELS, URGENCIA_COLORS } from '../types';
import type { TipoSanguineo, NivelUrgencia } from '../types';

const TIPOS_SANGUINEOS: (TipoSanguineo | 'todos')[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'todos'];
const NIVEIS_URGENCIA: NivelUrgencia[] = ['baixa', 'media', 'alta', 'critica'];

export default function NovaSolicitacao() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoSanguineo | 'todos' | null>(null);
  const [urgenciaSelecionada, setUrgenciaSelecionada] = useState<NivelUrgencia | null>(null);
  const [loteInicial, setLoteInicial] = useState(50);
  const [intervalo, setIntervalo] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!tipoSelecionado) {
      setError('Selecione um tipo sanguíneo');
      return;
    }
    
    if (!urgenciaSelecionada) {
      setError('Selecione o nível de urgência');
      return;
    }

    if (!user?.uid) {
      setError('Erro ao identificar hemocentro');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const solicitacaoId = await criarSolicitacao(
        user.uid, // Usar user.uid ao invés de hemocentro.id
        tipoSelecionado,
        urgenciaSelecionada,
        loteInicial
      );
      
      // Redirecionar para a lista ou para os detalhes
      navigate(`/solicitacoes/${solicitacaoId}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
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
        <h1 className="text-3xl font-bold text-gray-900">Nova Solicitação</h1>
        <p className="text-gray-600 mt-1">Crie uma solicitação de sangue para o seu hemocentro</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo Sanguíneo */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo Sanguíneo</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {TIPOS_SANGUINEOS.map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setTipoSelecionado(tipo)}
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  tipoSelecionado === tipo
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tipo === 'todos' ? 'Todos' : tipo}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {tipoSelecionado === 'todos' 
              ? '⚠️ Notificará doadores de todos os tipos compatíveis' 
              : tipoSelecionado
              ? `Notificará apenas doadores do tipo ${tipoSelecionado}`
              : 'Selecione o tipo sanguíneo necessário'}
          </p>
        </div>

        {/* Urgência */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nível de Urgência</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {NIVEIS_URGENCIA.map((urgencia) => {
              const cor = URGENCIA_COLORS[urgencia];
              return (
                <button
                  key={urgencia}
                  type="button"
                  onClick={() => setUrgenciaSelecionada(urgencia)}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    urgenciaSelecionada === urgencia
                      ? 'ring-2 ring-offset-2 scale-105'
                      : 'hover:scale-102'
                  }`}
                  style={{
                    backgroundColor: urgenciaSelecionada === urgencia ? cor : `${cor}20`,
                    color: urgenciaSelecionada === urgencia ? '#fff' : cor,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: urgenciaSelecionada === urgencia ? '#fff' : cor }}
                  />
                  {URGENCIA_LABELS[urgencia]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Seção de Classificação */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Classificação de Doadores</h2>
              <p className="text-sm text-gray-600 mt-1">
                Nosso modelo combina proximidade, histórico e disponibilidade para otimizar a taxa de resposta
              </p>
            </div>
          </div>

          {/* Configurações de lote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lote inicial de doadores
              </label>
              <select
                value={loteInicial}
                onChange={(e) => setLoteInicial(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={20}>20 doadores</option>
                <option value={50}>50 doadores</option>
                <option value={100}>100 doadores</option>
                <option value={200}>200 doadores</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Quantidade de doadores notificados inicialmente</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervalo até próximo lote
              </label>
              <select
                value={intervalo}
                onChange={(e) => setIntervalo(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={120}>2 horas</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Tempo de espera antes de notificar o próximo lote</p>
            </div>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Botões */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/solicitacoes')}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !tipoSelecionado || !urgenciaSelecionada}
            className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando...' : 'Criar Solicitação'}
          </button>
        </div>
      </form>
    </div>
  );
}
