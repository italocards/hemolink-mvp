import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';

export default function Perfil() {
  const { hemocentro, user } = useAuth();
  
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hemocentro) {
      setNome(hemocentro.nome || '');
      setEndereco(hemocentro.endereco || '');
      setHorarioFuncionamento(hemocentro.horarioFuncionamento || '');
    }
  }, [hemocentro]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!hemocentro?.id) {
      setError('Erro ao identificar hemocentro');
      return;
    }

    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const docRef = doc(db, 'hemocentros', hemocentro.id);
      await updateDoc(docRef, {
        nome,
        endereco,
        horarioFuncionamento,
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Perfil do Hemocentro</h1>
        <p className="text-gray-600 mt-1">Gerencie as informações do seu hemocentro</p>
      </div>

      {/* Mensagem de sucesso */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Perfil atualizado com sucesso!
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Informações da conta */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações da Conta</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de login</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 font-medium">{user?.email || 'Não disponível'}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Não é possível alterar o e-mail de login</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID do Hemocentro</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm font-mono truncate">{hemocentro?.id || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Conta verificada e ativa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Formulário de edição */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Informações Públicas</h2>
            
            <div className="space-y-6">
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Hemocentro
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  placeholder="Ex: HEMOCE - Centro de Hematologia"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nome será exibido para os doadores no aplicativo
                </p>
              </div>

              {/* Endereço */}
              <div>
                <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço Completo
                </label>
                <textarea
                  id="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none"
                  placeholder="Ex: Av. José Bastos, 3390 - Rodolfo Teófilo, Fortaleza - CE"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Inclua rua, número, bairro, cidade e estado
                </p>
              </div>

              {/* Horário de Funcionamento */}
              <div>
                <label htmlFor="horario" className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de Funcionamento
                </label>
                <input
                  id="horario"
                  type="text"
                  value={horarioFuncionamento}
                  onChange={(e) => setHorarioFuncionamento(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  placeholder="Ex: Seg-Sex: 7h30-18h30 | Sáb: 7h30-11h30"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Informe os horários de atendimento para doação
                </p>
              </div>

              {/* Botões */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setNome(hemocentro?.nome || '');
                    setEndereco(hemocentro?.endereco || '');
                    setHorarioFuncionamento(hemocentro?.horarioFuncionamento || '');
                    setError('');
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </form>

          {/* Card de ajuda */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-blue-900 text-sm">Informações importantes</p>
              <p className="text-blue-800 text-sm mt-1">
                As alterações feitas aqui serão refletidas imediatamente no aplicativo móvel dos doadores.
                Certifique-se de que todas as informações estão corretas antes de salvar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
