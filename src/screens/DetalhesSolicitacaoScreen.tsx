import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import {
  buscarDetalhesSolicitacao,
  registrarResposta,
  verificarResposta,
} from '../services/solicitacoes';
import { Colors, URGENCIA_LABELS, URGENCIA_COLORS, URGENCIA_LIGHT_COLORS } from '../constants';
import { SolicitacoesStackParamList, Solicitacao, Hemocentro, Resposta } from '../types';

type Props = NativeStackScreenProps<SolicitacoesStackParamList, 'DetalhesSolicitacao'>;

export default function DetalhesSolicitacaoScreen({ route, navigation }: Props) {
  const { solicitacaoId } = route.params;
  const { usuario } = useAuth();

  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [hemocentro, setHemocentro] = useState<Hemocentro | null>(null);
  const [respostaExistente, setRespostaExistente] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [modalSucesso, setModalSucesso] = useState(false);

  useEffect(() => { carregarDetalhes(); }, [solicitacaoId]);

  async function carregarDetalhes() {
    setCarregando(true);
    try {
      const { solicitacao: sol, hemocentro: hemo } = await buscarDetalhesSolicitacao(solicitacaoId);
      setSolicitacao(sol);
      setHemocentro(hemo);
      if (usuario?.id) {
        const resp = await verificarResposta(solicitacaoId, usuario.id);
        setRespostaExistente(resp);
      }
    } catch {
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
        id: 'local', solicitacaoId, doadorId: usuario.id,
        resposta, data: new Date().toISOString(),
      });
      if (resposta === 'aceita') setModalSucesso(true);
      else Alert.alert('Registrado', 'Sua resposta foi registrada. Obrigado por informar.');
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar sua resposta.');
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

  const urgCor = URGENCIA_COLORS[solicitacao.urgencia] ?? Colors.textSecondary;
  const urgCorLight = URGENCIA_LIGHT_COLORS[solicitacao.urgencia] ?? Colors.backgroundGray;
  const urgLabel = (URGENCIA_LABELS[solicitacao.urgencia] ?? solicitacao.urgencia).toUpperCase();
  const dataFormatada = new Date(solicitacao.data).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const jaRespondeu = respostaExistente !== null;
  const aceitou = respostaExistente?.resposta === 'aceita';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroEsquerdo}>
            <Text style={styles.heroTipoLabel}>Tipo sanguíneo</Text>
            <Text style={styles.heroTipo}>{solicitacao.tipoSanguineo}</Text>
          </View>
          <View style={styles.heroDireito}>
            <View style={[styles.urgBadge, { backgroundColor: urgCorLight }]}>
              <Text style={[styles.urgBadgeTexto, { color: urgCor }]}>{urgLabel}</Text>
            </View>
            <Text style={styles.heroNecessidade}>Necessidade de sangue</Text>
            <Text style={styles.heroData}>{dataFormatada}</Text>
          </View>
        </View>

        {/* ── Local de doação ── */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Local de doação</Text>

          <View style={styles.infoCard}>
            <InfoItem
              icone="business-outline"
              cor="#2563EB"
              corLight="#DBEAFE"
              label="Hemocentro"
              valor={hemocentro?.nome ?? 'Não especificado'}
            />
            <View style={styles.divisor} />
            <InfoItem
              icone="location-outline"
              cor="#16A34A"
              corLight="#DCFCE7"
              label="Endereço"
              valor={hemocentro?.endereco ?? 'Não disponível'}
            />
            <View style={styles.divisor} />
            <InfoItem
              icone="time-outline"
              cor="#D97706"
              corLight="#FEF3C7"
              label="Horário de funcionamento"
              valor={hemocentro?.horarioFuncionamento ?? 'Consulte o local'}
            />
            <View style={styles.divisor} />
            <InfoItem
              icone="calendar-outline"
              cor={Colors.primary}
              corLight={Colors.primaryLight}
              label="Data da solicitação"
              valor={dataFormatada}
            />
          </View>
        </View>

        {/* ── Alerta urgência crítica/alta ── */}
        {(solicitacao.urgencia === 'critica' || solicitacao.urgencia === 'alta') && (
          <View style={[styles.alertaCard, { borderColor: urgCor, backgroundColor: urgCorLight }]}>
            <Ionicons name="warning" size={20} color={urgCor} />
            <Text style={[styles.alertaTexto, { color: urgCor }]}>
              Urgência {URGENCIA_LABELS[solicitacao.urgencia]}! Esta solicitação requer atenção imediata.
            </Text>
          </View>
        )}

        {/* ── Status da resposta ── */}
        {jaRespondeu && (
          <View style={[styles.statusCard, aceitou ? styles.statusAceito : styles.statusRecusado]}>
            <Ionicons
              name={aceitou ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={aceitou ? Colors.success : Colors.textSecondary}
            />
            <Text style={styles.statusTexto}>
              {aceitou
                ? 'Você confirmou disponibilidade para esta doação.'
                : 'Você informou que não pode comparecer.'}
            </Text>
          </View>
        )}

        {/* Espaço para os botões fixos */}
        {!jaRespondeu && <View style={{ height: 120 }} />}
      </ScrollView>

      {/* ── Botões fixos ── */}
      {!jaRespondeu && (
        <View style={styles.botoesArea}>
          <TouchableOpacity
            style={styles.botaoAceitar}
            onPress={() => handleResposta('aceita')}
            disabled={enviando}
            activeOpacity={0.85}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="heart" size={18} color="#fff" />
                <Text style={styles.botaoAceitarTexto}>Posso doar</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.botaoRecusar}
            onPress={() => handleResposta('recusada')}
            disabled={enviando}
            activeOpacity={0.85}
          >
            <Text style={styles.botaoRecusarTexto}>Não posso</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modal sucesso ── */}
      <Modal visible={modalSucesso} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconeArea}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            <Text style={styles.modalTitulo}>Disponibilidade{'\n'}confirmada!</Text>
            <Text style={styles.modalSub}>
              Obrigado! Sua presença pode salvar uma vida.{'\n'}
              Dirija-se ao hemocentro no horário combinado.
            </Text>
            {hemocentro && (
              <View style={styles.modalHemoCard}>
                <Text style={styles.modalHemoNome}>{hemocentro.nome}</Text>
                <Text style={styles.modalHemoEnd}>{hemocentro.endereco}</Text>
                <Text style={styles.modalHemoHorario}>{hemocentro.horarioFuncionamento}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.modalBotao}
              onPress={() => setModalSucesso(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBotaoTexto}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoItem({
  icone, cor, corLight, label, valor,
}: {
  icone: React.ComponentProps<typeof Ionicons>['name'];
  cor: string; corLight: string;
  label: string; valor: string;
}) {
  return (
    <View style={infoStyles.row}>
      <View style={[infoStyles.icone, { backgroundColor: corLight }]}>
        <Ionicons name={icone} size={18} color={cor} />
      </View>
      <View style={infoStyles.texto}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.valor}>{valor}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  icone: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  texto: { flex: 1 },
  label: { fontSize: 11, color: Colors.textLight, marginBottom: 2 },
  valor: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
});

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  erroTexto: { fontSize: 15, color: Colors.textSecondary },
  scroll: { padding: 20, paddingBottom: 40 },

  // Hero
  heroCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundGray,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    marginBottom: 20,
    alignItems: 'center',
    ...shadow,
  },
  heroEsquerdo: { alignItems: 'center', minWidth: 72 },
  heroTipoLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  heroTipo: { fontSize: 40, fontWeight: '900', color: Colors.primary, letterSpacing: -1 },
  heroDireito: { flex: 1, gap: 6 },
  urgBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  urgBadgeTexto: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  heroNecessidade: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  heroData: { fontSize: 12, color: Colors.textSecondary },

  // Seção
  secao: { marginBottom: 16 },
  secaoTitulo: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  infoCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...shadow,
  },
  divisor: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 52 },

  // Alerta
  alertaCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  alertaTexto: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  // Status resposta
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  statusAceito: { backgroundColor: Colors.successLight },
  statusRecusado: { backgroundColor: Colors.backgroundGray },
  statusTexto: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.textPrimary },

  // Botões fixos
  botoesArea: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background,
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  botaoAceitar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    gap: 8,
  },
  botaoAceitarTexto: { fontSize: 16, fontWeight: '700', color: '#fff' },
  botaoRecusar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundGray,
    borderRadius: 14,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  botaoRecusarTexto: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    ...shadow,
  },
  modalIconeArea: { marginBottom: 16 },
  modalTitulo: {
    fontSize: 24, fontWeight: '800', color: Colors.textPrimary,
    textAlign: 'center', marginBottom: 10, letterSpacing: -0.5,
  },
  modalSub: {
    fontSize: 14, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, marginBottom: 20,
  },
  modalHemoCard: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 14, padding: 16,
    width: '100%', marginBottom: 20, gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  modalHemoNome: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  modalHemoEnd: { fontSize: 13, color: Colors.textSecondary },
  modalHemoHorario: { fontSize: 12, color: Colors.textLight },
  modalBotao: {
    backgroundColor: Colors.primary,
    borderRadius: 14, height: 52,
    width: '100%', alignItems: 'center', justifyContent: 'center',
  },
  modalBotaoTexto: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
