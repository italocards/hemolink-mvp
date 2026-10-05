import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { sair } from '../services/auth';
import { db } from '../services/firebase';
import { Colors, TIPOS_SANGUINEOS } from '../constants';
import { TipoSanguineo, PerfilStackParamList } from '../types';
import InputCampo from '../components/InputCampo';
import InputData from '../components/InputData';
import BotaoPrimario from '../components/BotaoPrimario';

type NavProp = NativeStackNavigationProp<PerfilStackParamList, 'PerfilHome'>;

export default function PerfilScreen() {
  const { usuario, setUsuario } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [ultimaDoacao, setUltimaDoacao] = useState(usuario?.ultimaDoacao ?? '');
  const [tipoSanguineo, setTipoSanguineo] = useState<TipoSanguineo | ''>(usuario?.tipoSanguineo ?? '');
  const [modalTipo, setModalTipo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    if (!usuario?.id || !tipoSanguineo) return;
    setSalvando(true);
    try {
      const atualizado = { nome: nome.trim(), tipoSanguineo, ultimaDoacao: ultimaDoacao || null };
      await updateDoc(doc(db, 'users', usuario.id), atualizado);
      setUsuario({ ...usuario, ...atualizado });
      setEditando(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleSair() {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => sair() },
    ]);
  }

  function formatarExibicaoData(data: string | null): string {
    if (!data) return 'Não informada';
    if (data.includes('/')) {
      const partes = data.split('/');
      if (partes.length === 3 && partes[2].length === 4) return data;
    }
    if (data.includes('-')) {
      const partes = data.split('T')[0].split('-');
      if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return data;
  }

  const ultimaDoacaoFormatada = formatarExibicaoData(usuario?.ultimaDoacao ?? null);
  const temCasaSalva = !!(usuario?.latitude && usuario?.longitude);

  const [enderecoСasa, setEnderecoСasa] = useState('');
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);

  useEffect(() => {
    if (!usuario?.latitude || !usuario?.longitude) { setEnderecoСasa(''); return; }
    setBuscandoEndereco(true);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${usuario.latitude}&lon=${usuario.longitude}&format=json&accept-language=pt-BR`,
      { headers: { 'User-Agent': 'HemoLink-MVP/1.0' } }
    )
      .then((r) => r.json())
      .then((data) => {
        const addr = data.address ?? {};
        const partes = [
          addr.road ?? addr.pedestrian ?? addr.suburb,
          addr.house_number,
          addr.suburb ?? addr.neighbourhood,
          addr.city ?? addr.town ?? addr.village,
          addr.state,
        ].filter(Boolean);
        setEnderecoСasa(partes.join(', ') || data.display_name || 'Endereço encontrado');
      })
      .catch(() => setEnderecoСasa('Endereço não disponível'))
      .finally(() => setBuscandoEndereco(false));
  }, [usuario?.latitude, usuario?.longitude]);

  const inicial = (usuario?.nome ?? 'D').charAt(0).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header perfil ── */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetra}>{inicial}</Text>
          </View>
          <Text style={styles.nomeHeader}>{usuario?.nome ?? 'Doador'}</Text>
          <Text style={styles.emailHeader}>{usuario?.email ?? ''}</Text>
          <View style={styles.tipoTag}>
            <Ionicons name="water" size={14} color={Colors.primary} />
            <Text style={styles.tipoTagTexto}>{usuario?.tipoSanguineo ?? '--'}</Text>
          </View>
        </View>

        {!editando ? (
          <>
            {/* ── Informações pessoais ── */}
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Informações pessoais</Text>
              <View style={styles.infoCard}>
                <InfoRow icone="person-outline" cor={Colors.primary} corLight={Colors.primaryLight} label="Nome" valor={usuario?.nome ?? '-'} />
                <View style={styles.divisor} />
                <InfoRow icone="mail-outline" cor="#2563EB" corLight="#DBEAFE" label="E-mail" valor={usuario?.email ?? '-'} />
                <View style={styles.divisor} />
                <InfoRow icone="water-outline" cor={Colors.primary} corLight={Colors.primaryLight} label="Tipo sanguíneo" valor={usuario?.tipoSanguineo ?? '-'} />
                <View style={styles.divisor} />
                <InfoRow icone="calendar-outline" cor="#D97706" corLight="#FEF3C7" label="Última doação" valor={ultimaDoacaoFormatada} />
              </View>
            </View>

            <TouchableOpacity style={styles.botaoEditar} onPress={() => setEditando(true)} activeOpacity={0.8}>
              <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
              <Text style={styles.botaoEditarTexto}>Editar perfil</Text>
            </TouchableOpacity>

            {/* ── Localização ── */}
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Localização</Text>
              <View style={styles.infoCard}>
                <View style={styles.casaRow}>
                  <View style={[styles.casaIcone, { backgroundColor: temCasaSalva ? Colors.primaryLight : Colors.backgroundGray }]}>
                    <Ionicons name="home" size={20} color={temCasaSalva ? Colors.primary : Colors.textLight} />
                  </View>
                  <View style={styles.casaTexto}>
                    <Text style={styles.casaLabel}>Casa</Text>
                    <Text style={styles.casaValor} numberOfLines={2}>
                      {temCasaSalva
                        ? buscandoEndereco ? 'Buscando endereço...' : enderecoСasa || 'Endereço não disponível'
                        : 'Não definida'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.casaBotao}
                    onPress={() => navigation.navigate('DefinirCasa')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.casaBotaoTexto}>{temCasaSalva ? 'Alterar' : 'Definir'}</Text>
                  </TouchableOpacity>
                </View>
                {temCasaSalva && (
                  <>
                    <View style={styles.divisor} />
                    <View style={styles.casaSalvaInfo}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                      <Text style={styles.casaSalvaTexto}>Marcador de casa visível no mapa</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* ── Histórico ── */}
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Histórico de doações</Text>
              <View style={styles.infoCard}>
                <View style={styles.historicoRow}>
                  <View style={[styles.casaIcone, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="time-outline" size={20} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.casaLabel}>Última doação</Text>
                    <Text style={styles.casaValor}>{ultimaDoacaoFormatada}</Text>
                  </View>
                </View>
                <View style={styles.divisor} />
                <Text style={styles.historicoInfo}>
                  O histórico completo estará disponível em uma versão futura.
                </Text>
              </View>
            </View>
          </>
        ) : (
          // ── Modo edição ──
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Editando perfil</Text>
            <View style={[styles.infoCard, { padding: 16 }]}>
              <InputCampo label="Nome" value={nome} onChangeText={setNome} autoCapitalize="words" iconLeft="person-outline" />
              <View style={styles.campoContainer}>
                <Text style={styles.campoLabel}>Tipo sanguíneo</Text>
                <TouchableOpacity style={styles.seletor} onPress={() => setModalTipo(true)}>
                  <Ionicons name="water-outline" size={18} color={Colors.textLight} />
                  <Text style={[styles.seletorTexto, !tipoSanguineo && { color: Colors.textLight }]}>
                    {tipoSanguineo || 'Selecionar'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.textLight} />
                </TouchableOpacity>
              </View>
              <InputData label="Data da última doação" value={ultimaDoacao} onChangeText={setUltimaDoacao} />
              <View style={styles.botoesEdicao}>
                <BotaoPrimario titulo="Cancelar" onPress={() => setEditando(false)} variante="secundario" style={{ flex: 1 }} />
                <BotaoPrimario titulo="Salvar" onPress={handleSalvar} carregando={salvando} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        )}

        {/* ── Sair ── */}
        <TouchableOpacity style={styles.botaoSair} onPress={handleSair} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.botaoSairTexto}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal tipo sanguíneo */}
      <Modal visible={modalTipo} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalTipo(false)}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Tipo Sanguíneo</Text>
            <FlatList
              data={[...TIPOS_SANGUINEOS]}
              keyExtractor={(item) => item}
              numColumns={4}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.tipoItem, tipoSanguineo === item && styles.tipoItemSel]}
                  onPress={() => { setTipoSanguineo(item as TipoSanguineo); setModalTipo(false); }}
                >
                  <Text style={[styles.tipoTexto, tipoSanguineo === item && styles.tipoTextoSel]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ icone, cor, corLight, label, valor }: {
  icone: React.ComponentProps<typeof Ionicons>['name'];
  cor: string; corLight: string; label: string; valor: string;
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
  shadowColor: '#000', shadowOpacity: 0.06,
  shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 48, paddingBottom: 32,
    alignItems: 'center', gap: 6,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  avatarLetra: { fontSize: 34, fontWeight: '800', color: '#fff' },
  nomeHeader: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  emailHeader: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  tipoTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginTop: 4,
  },
  tipoTagTexto: { fontSize: 14, fontWeight: '800', color: Colors.primary },

  // Seção
  secao: { paddingHorizontal: 20, marginTop: 20 },
  secaoTitulo: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12, letterSpacing: -0.3 },
  infoCard: {
    backgroundColor: Colors.background,
    borderRadius: 16, paddingHorizontal: 16,
    borderWidth: 1, borderColor: Colors.border, ...shadow,
  },
  divisor: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 52 },

  // Casa
  casaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  casaIcone: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  casaTexto: { flex: 1 },
  casaLabel: { fontSize: 11, color: Colors.textLight, marginBottom: 2 },
  casaValor: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  casaBotao: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  casaBotaoTexto: { fontSize: 12, fontWeight: '700', color: '#fff' },
  casaSalvaInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  casaSalvaTexto: { fontSize: 12, color: Colors.success, fontWeight: '500' },

  // Histórico
  historicoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  historicoInfo: { fontSize: 11, color: Colors.textLight, fontStyle: 'italic', paddingVertical: 10 },

  // Botão editar
  botaoEditar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginTop: 12,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.background, gap: 8, ...shadow,
  },
  botaoEditarTexto: { fontSize: 15, fontWeight: '700', color: Colors.primary },

  // Botão sair
  botaoSair: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginTop: 12,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background, gap: 8,
  },
  botaoSairTexto: { fontSize: 15, fontWeight: '600', color: Colors.danger },

  // Edição
  campoContainer: { marginBottom: 16 },
  campoLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  seletor: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, height: 50, paddingHorizontal: 14, gap: 8,
  },
  seletorTexto: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  botoesEdicao: { flexDirection: 'row', gap: 12, marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContainer: { backgroundColor: Colors.background, borderRadius: 20, padding: 24, width: '100%' },
  modalTitulo: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 20, textAlign: 'center' },
  tipoItem: { flex: 1, margin: 6, height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  tipoItemSel: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tipoTexto: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  tipoTextoSel: { color: '#fff' },
});
