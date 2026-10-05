import React, { useState } from 'react';
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
import TipoSanguineoTag from '../components/TipoSanguineoTag';
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
      const atualizado = {
        nome: nome.trim(),
        tipoSanguineo,
        ultimaDoacao: ultimaDoacao || null,
      };
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

  const ultimaDoacaoFormatada = usuario?.ultimaDoacao
    ? new Date(usuario.ultimaDoacao).toLocaleDateString('pt-BR')
    : 'Não informada';

  const temCasaSalva = !!(usuario?.latitude && usuario?.longitude);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header perfil */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetra}>
              {(usuario?.nome ?? 'D').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.nomeHeader}>{usuario?.nome ?? 'Doador'}</Text>
          <Text style={styles.emailHeader}>{usuario?.email ?? ''}</Text>
          {usuario?.tipoSanguineo && (
            <TipoSanguineoTag tipo={usuario.tipoSanguineo} tamanho="medio" />
          )}
        </View>

        {/* Dados do perfil */}
        {!editando ? (
          <>
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Informações pessoais</Text>
              <InfoRow icone="person-outline" label="Nome" valor={usuario?.nome ?? '-'} />
              <InfoRow icone="mail-outline" label="E-mail" valor={usuario?.email ?? '-'} />
              <InfoRow icone="water-outline" label="Tipo sanguíneo" valor={usuario?.tipoSanguineo ?? '-'} />
              <InfoRow icone="calendar-outline" label="Última doação" valor={ultimaDoacaoFormatada} />
            </View>

            <TouchableOpacity
              style={styles.botaoEditar}
              onPress={() => setEditando(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
              <Text style={styles.botaoEditarTexto}>Editar perfil</Text>
            </TouchableOpacity>

            {/* Localização da casa */}
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Localização</Text>

              <View style={styles.casaRow}>
                <View style={[styles.casaIcone, temCasaSalva && styles.casaIconeAtivo]}>
                  <Ionicons
                    name="home"
                    size={22}
                    color={temCasaSalva ? Colors.primary : Colors.textLight}
                  />
                </View>
                <View style={styles.casaTexto}>
                  <Text style={styles.casaLabel}>Casa</Text>
                  <Text style={styles.casaValor}>
                    {temCasaSalva
                      ? `${usuario!.latitude!.toFixed(4)}, ${usuario!.longitude!.toFixed(4)}`
                      : 'Não definida'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.casaBotao}
                  onPress={() => navigation.navigate('DefinirCasa')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.casaBotaoTexto}>
                    {temCasaSalva ? 'Alterar' : 'Definir'}
                  </Text>
                </TouchableOpacity>
              </View>

              {temCasaSalva && (
                <View style={styles.casaSalvaInfo}>
                  <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
                  <Text style={styles.casaSalvaTexto}>
                    Sua casa aparece no mapa como marcador azul
                  </Text>
                </View>
              )}
            </View>

            {/* Histórico simplificado */}
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Histórico de doações</Text>
              <View style={styles.historicoItem}>
                <Ionicons name="time-outline" size={20} color={Colors.textLight} />
                <Text style={styles.historicoTexto}>
                  Última doação:{' '}
                  <Text style={styles.historicoBold}>{ultimaDoacaoFormatada}</Text>
                </Text>
              </View>
              <Text style={styles.historicoInfo}>
                * O histórico completo estará disponível em uma versão futura.
              </Text>
            </View>
          </>
        ) : (
          // Modo de edição
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Editando perfil</Text>

            <InputCampo
              label="Nome"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              iconLeft="person-outline"
            />

            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Tipo sanguíneo</Text>
              <TouchableOpacity style={styles.seletor} onPress={() => setModalTipo(true)}>
                <Ionicons name="water-outline" size={18} color={Colors.textLight} />
                <Text style={styles.seletorTexto}>{tipoSanguineo || 'Selecionar'}</Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <InputData
              label="Data da última doação"
              value={ultimaDoacao}
              onChangeText={setUltimaDoacao}
            />

            <View style={styles.botoesEdicao}>
              <BotaoPrimario
                titulo="Cancelar"
                onPress={() => setEditando(false)}
                variante="secundario"
                style={{ flex: 1 }}
              />
              <BotaoPrimario
                titulo="Salvar"
                onPress={handleSalvar}
                carregando={salvando}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}

        {/* Sair */}
        <TouchableOpacity style={styles.botaoSair} onPress={handleSair} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.botaoSairTexto}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal tipo sanguíneo */}
      <Modal visible={modalTipo} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalTipo(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Tipo Sanguíneo</Text>
            <FlatList
              data={[...TIPOS_SANGUINEOS]}
              keyExtractor={(item) => item}
              numColumns={4}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.tipoItem, tipoSanguineo === item && styles.tipoItemSel]}
                  onPress={() => {
                    setTipoSanguineo(item as TipoSanguineo);
                    setModalTipo(false);
                  }}
                >
                  <Text style={[styles.tipoTexto, tipoSanguineo === item && styles.tipoTextoSel]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function InfoRow({
  icone,
  label,
  valor,
}: {
  icone: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  valor: string;
}) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.iconeCont}>
        <Ionicons name={icone} size={18} color={Colors.primary} />
      </View>
      <View style={infoStyles.texto}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.valor}>{valor}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconeCont: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FDEDEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { flex: 1 },
  label: { fontSize: 11, color: Colors.textLight, marginBottom: 2 },
  valor: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 6,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarLetra: { fontSize: 36, fontWeight: '800', color: '#fff' },
  nomeHeader: { fontSize: 22, fontWeight: '800', color: '#fff' },
  emailHeader: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  secao: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 16,
    marginBottom: 0,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  botaoEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginBottom: 0,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    gap: 8,
    backgroundColor: '#fff',
  },
  botaoEditarTexto: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  // Casa
  casaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  casaIcone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  casaIconeAtivo: { backgroundColor: '#FDEDEC' },
  casaTexto: { flex: 1 },
  casaLabel: { fontSize: 11, color: Colors.textLight, marginBottom: 2 },
  casaValor: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  casaBotao: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  casaBotaoTexto: { fontSize: 13, fontWeight: '700', color: '#fff' },
  casaSalvaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#EAFAF1',
    padding: 10,
    borderRadius: 10,
  },
  casaSalvaTexto: { fontSize: 12, color: Colors.success, fontWeight: '500' },
  // Histórico
  historicoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  historicoTexto: { fontSize: 14, color: Colors.textSecondary },
  historicoBold: { fontWeight: '700', color: Colors.textPrimary },
  historicoInfo: { fontSize: 11, color: Colors.textLight, fontStyle: 'italic' },
  // Sair
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    gap: 8,
    backgroundColor: '#fff',
  },
  botaoSairTexto: { fontSize: 15, fontWeight: '700', color: Colors.danger },
  // Edição
  campoContainer: { marginBottom: 16 },
  campoLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  seletor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
    gap: 8,
  },
  seletorTexto: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  botoesEdicao: { flexDirection: 'row', gap: 12, marginTop: 8 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%' },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  tipoItem: {
    flex: 1,
    margin: 6,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipoItemSel: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tipoTexto: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  tipoTextoSel: { color: '#fff' },
});
