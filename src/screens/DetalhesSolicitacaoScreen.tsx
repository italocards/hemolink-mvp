import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import {
  buscarDetalhesSolicitacao,
  registrarResposta,
  verificarResposta,
} from '../services/solicitacoes';
import { Colors, URGENCIA_LABELS, URGENCIA_COLORS } from '../constants';
import { SolicitacoesStackParamList, Solicitacao, Hemocentro, Resposta } from '../types';
import TipoSanguineoTag from '../components/TipoSanguineoTag';
import UrgenciaBadge from '../components/UrgenciaBadge';
import BotaoPrimario from '../components/BotaoPrimario';

type Props = NativeStackScreenProps<SolicitacoesStackParamList, 'DetalhesSolicitacao'>;

export default function DetalhesSolicitacaoScreen({ route }: Props) {
  const { solicitacaoId } = route.params;
  const { usuario } = useAuth();

  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [hemocentro, setHemocentro] = useState<Hemocentro | null>(null);
  const [respostaExistente, setRespostaExistente] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [modalSucesso, setModalSucesso] = useState(false);

  useEffect(() => {
    carregarDetalhes();
  }, [solicitacaoId]);

  async function carregarDetalhes() {
    setCarregando(true);
    try {
      const { solicitacao: sol, hemocentro: hemo } =
        await buscarDetalhesSolicitacao(solicitacaoId);
      setSolicitacao(sol);
      setHemocentro(hemo);

      if (usuario?.id) {
        const resp = await verificarResposta(solicitacaoId, usuario.id);
        setRespostaExistente(resp);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes.');
    } finally {
      setCarregando(false);
    }
  }

  async function handleResposta(resposta: 'aceita' | 'recusada') {
    if (!usuario?.id) return;
    setEnviando(true);
    try {
      await registrarResposta(solicitacaoId, usuario.id, resposta);
      setRespostaExistente({
        id: 'local',
        solicitacaoId,
        doadorId: usuario.id,
        resposta,
        data: new Date().toISOString(),
      });
      if (resposta === 'aceita') {
        setModalSucesso(true);
      } else {
        Alert.alert('Registrado', 'Sua resposta foi registrada. Obrigado por informar.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar sua resposta. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!solicitacao) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erroTexto}>Solicitação não encontrada.</Text>
      </View>
    );
  }

  const dataFormatada = new Date(solicitacao.data).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const jaRespondeu = respostaExistente !== null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header tipo sanguíneo */}
        <View style={styles.tipoHeader}>
          <TipoSanguineoTag tipo={solicitacao.tipoSanguineo} tamanho="grande" />
          <View style={styles.tipoInfo}>
            <Text style={styles.tipoLabel}>Tipo sanguíneo necessário</Text>
            <UrgenciaBadge urgencia={solicitacao.urgencia} />
          </View>
        </View>

        {/* Detalhes */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Local de doação</Text>

          <View style={styles.detalheRow}>
            <View style={[styles.detalheIcone, { backgroundColor: '#EBF5FB' }]}>
              <Ionicons name="business" size={18} color="#2E86C1" />
            </View>
            <View style={styles.detalheTexto}>
              <Text style={styles.detalheLabel}>Hemocentro</Text>
              <Text style={styles.detalheValor}>{hemocentro?.nome ?? 'Não especificado'}</Text>
            </View>
          </View>

          <View style={styles.detalheRow}>
            <View style={[styles.detalheIcone, { backgroundColor: '#EAFAF1' }]}>
              <Ionicons name="location" size={18} color="#27AE60" />
            </View>
            <View style={styles.detalheTexto}>
              <Text style={styles.detalheLabel}>Endereço</Text>
              <Text style={styles.detalheValor}>{hemocentro?.endereco ?? 'Não disponível'}</Text>
            </View>
          </View>

          <View style={styles.detalheRow}>
            <View style={[styles.detalheIcone, { backgroundColor: '#FEF9E7' }]}>
              <Ionicons name="time" size={18} color="#F39C12" />
            </View>
            <View style={styles.detalheTexto}>
              <Text style={styles.detalheLabel}>Horário de funcionamento</Text>
              <Text style={styles.detalheValor}>
                {hemocentro?.horarioFuncionamento ?? 'Consulte o local'}
              </Text>
            </View>
          </View>

          <View style={styles.detalheRow}>
            <View style={[styles.detalheIcone, { backgroundColor: '#FDEDEC' }]}>
              <Ionicons name="calendar" size={18} color={Colors.primary} />
            </View>
            <View style={styles.detalheTexto}>
              <Text style={styles.detalheLabel}>Data da solicitação</Text>
              <Text style={styles.detalheValor}>{dataFormatada}</Text>
            </View>
          </View>
        </View>

        {/* Aviso de urgência */}
        {(solicitacao.urgencia === 'alta' || solicitacao.urgencia === 'critica') && (
          <View style={[styles.alertaUrgencia, { borderColor: URGENCIA_COLORS[solicitacao.urgencia] }]}>
            <Ionicons name="warning" size={20} color={URGENCIA_COLORS[solicitacao.urgencia]} />
            <Text style={[styles.alertaTexto, { color: URGENCIA_COLORS[solicitacao.urgencia] }]}>
              Urgência {URGENCIA_LABELS[solicitacao.urgencia]}! Esta solicitação requer atenção imediata.
            </Text>
          </View>
        )}

        {/* Status de resposta */}
        {jaRespondeu && (
          <View
            style={[
              styles.statusResposta,
              respostaExistente?.resposta === 'aceita' ? styles.statusAceita : styles.statusRecusada,
            ]}
          >
            <Ionicons
              name={respostaExistente?.resposta === 'aceita' ? 'checkmark-circle' : 'close-circle'}
              size={22}
              color={respostaExistente?.resposta === 'aceita' ? Colors.success : Colors.textSecondary}
            />
            <Text style={styles.statusTexto}>
              {respostaExistente?.resposta === 'aceita'
                ? 'Você confirmou disponibilidade para esta doação.'
                : 'Você informou que não pode comparecer.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Botões de ação (apenas se não respondeu) */}
      {!jaRespondeu && (
        <View style={styles.acoes}>
          <BotaoPrimario
            titulo="Posso doar"
            onPress={() => handleResposta('aceita')}
            carregando={enviando}
            style={styles.botaoAceitar}
          />
          <BotaoPrimario
            titulo="Não posso"
            onPress={() => handleResposta('recusada')}
            variante="secundario"
            desabilitado={enviando}
            style={styles.botaoRecusar}
          />
        </View>
      )}

      {/* Modal de sucesso */}
      <Modal visible={modalSucesso} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconeArea}>
              <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
            </View>
            <Text style={styles.modalTitulo}>Disponibilidade confirmada!</Text>
            <Text style={styles.modalSubtitulo}>
              Obrigado! Sua presença pode salvar uma vida.{'\n'}Dirija-se ao hemocentro no horário
              combinado.
            </Text>
            {hemocentro && (
              <View style={styles.modalHemo}>
                <Text style={styles.modalHemoNome}>{hemocentro.nome}</Text>
                <Text style={styles.modalHemoEnd}>{hemocentro.endereco}</Text>
                <Text style={styles.modalHemoHorario}>{hemocentro.horarioFuncionamento}</Text>
              </View>
            )}
            <BotaoPrimario
              titulo="Entendido"
              onPress={() => setModalSucesso(false)}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  erroTexto: { color: Colors.textSecondary, fontSize: 15 },
  scroll: { padding: 20, paddingBottom: 120 },
  // Tipo header
  tipoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tipoInfo: { flex: 1, gap: 8 },
  tipoLabel: { fontSize: 13, color: Colors.textSecondary },
  // Seção detalhes
  secao: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  detalheRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detalheIcone: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detalheTexto: { flex: 1 },
  detalheLabel: { fontSize: 11, color: Colors.textLight, marginBottom: 2 },
  detalheValor: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  // Alerta urgência
  alertaUrgencia: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  alertaTexto: { flex: 1, fontSize: 13, fontWeight: '600' },
  // Status resposta
  statusResposta: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  statusAceita: { backgroundColor: '#EAFAF1' },
  statusRecusada: { backgroundColor: '#F2F3F4' },
  statusTexto: { flex: 1, fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  // Botões
  acoes: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  botaoAceitar: {},
  botaoRecusar: {},
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  modalIconeArea: { marginBottom: 16 },
  modalTitulo: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  modalSubtitulo: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalHemo: { backgroundColor: Colors.background, borderRadius: 14, padding: 16, width: '100%', marginBottom: 16, gap: 4 },
  modalHemoNome: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  modalHemoEnd: { fontSize: 13, color: Colors.textSecondary },
  modalHemoHorario: { fontSize: 12, color: Colors.textLight },
});
