import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, TipoSanguineo } from '../types';
import { Colors, TIPOS_SANGUINEOS } from '../constants';
import { cadastrarUsuario } from '../services/auth';
import InputCampo from '../components/InputCampo';
import BotaoPrimario from '../components/BotaoPrimario';

type Props = NativeStackScreenProps<RootStackParamList, 'Cadastro'>;

export default function CadastroScreen({ navigation }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState<TipoSanguineo | ''>('');
  const [ultimaDoacao, setUltimaDoacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [erros, setErros] = useState<Record<string, string>>({});

  function validar() {
    const novosErros: Record<string, string> = {};
    if (!nome.trim()) novosErros.nome = 'Informe seu nome';
    if (!email.trim()) novosErros.email = 'Informe seu e-mail';
    else if (!/\S+@\S+\.\S+/.test(email)) novosErros.email = 'E-mail inválido';
    if (!senha.trim()) novosErros.senha = 'Informe uma senha';
    else if (senha.length < 6) novosErros.senha = 'Mínimo 6 caracteres';
    if (!tipoSanguineo) novosErros.tipoSanguineo = 'Selecione seu tipo sanguíneo';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function handleCadastrar() {
    if (!validar()) return;
    setCarregando(true);
    try {
      await cadastrarUsuario(
        nome.trim(),
        email.trim(),
        senha,
        tipoSanguineo as TipoSanguineo,
        ultimaDoacao || null
      );
      // RootNavigator redireciona automaticamente
    } catch (error: any) {
      const msg =
        error.code === 'auth/email-already-in-use'
          ? 'Este e-mail já está em uso.'
          : error.code === 'auth/invalid-email'
          ? 'E-mail inválido.'
          : 'Erro ao criar conta. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.voltarBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Criar conta</Text>
          <Text style={styles.subtitulo}>Junte-se aos doadores</Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <InputCampo
            label="Nome completo"
            placeholder="Seu nome"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            iconLeft="person-outline"
            erro={erros.nome}
          />
          <InputCampo
            label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            iconLeft="mail-outline"
            erro={erros.email}
          />
          <InputCampo
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            value={senha}
            onChangeText={setSenha}
            senha
            iconLeft="lock-closed-outline"
            erro={erros.senha}
          />

          {/* Seletor de tipo sanguíneo */}
          <View style={styles.campoContainer}>
            <Text style={styles.campoLabel}>Tipo sanguíneo</Text>
            <TouchableOpacity
              style={[styles.seletor, erros.tipoSanguineo ? styles.seletorErro : null]}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="water-outline" size={18} color={Colors.textLight} />
              <Text style={[styles.seletorTexto, !tipoSanguineo && styles.seletorPlaceholder]}>
                {tipoSanguineo || 'Selecione seu tipo sanguíneo'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textLight} />
            </TouchableOpacity>
            {erros.tipoSanguineo ? (
              <Text style={styles.textoErro}>{erros.tipoSanguineo}</Text>
            ) : null}
          </View>

          <InputCampo
            label="Data da última doação (opcional)"
            placeholder="DD/MM/AAAA"
            value={ultimaDoacao}
            onChangeText={setUltimaDoacao}
            keyboardType="numeric"
            iconLeft="calendar-outline"
          />

          <BotaoPrimario
            titulo="Criar conta"
            onPress={handleCadastrar}
            carregando={carregando}
            style={styles.botaoCadastrar}
          />

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.jaTemConta}>
            <Text style={styles.jaTemContaTexto}>
              Já tem uma conta?{' '}
              <Text style={styles.jaTemContaLink}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal seleção tipo sanguíneo */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Tipo Sanguíneo</Text>
            <FlatList
              data={[...TIPOS_SANGUINEOS]}
              keyExtractor={(item) => item}
              numColumns={4}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.tipoItem,
                    tipoSanguineo === item && styles.tipoItemSelecionado,
                  ]}
                  onPress={() => {
                    setTipoSanguineo(item as TipoSanguineo);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.tipoItemTexto,
                      tipoSanguineo === item && styles.tipoItemTextoSelecionado,
                    ]}
                  >
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: 4,
  },
  voltarBtn: { marginBottom: 12 },
  titulo: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitulo: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  form: { padding: 24, paddingTop: 28 },
  campoContainer: { marginBottom: 16 },
  campoLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  seletor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
    gap: 8,
  },
  seletorErro: { borderColor: Colors.danger },
  seletorTexto: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  seletorPlaceholder: { color: Colors.textLight },
  textoErro: { color: Colors.danger, fontSize: 12, marginTop: 4 },
  botaoCadastrar: { marginTop: 8 },
  jaTemConta: { alignItems: 'center', marginTop: 20 },
  jaTemContaTexto: { fontSize: 14, color: Colors.textSecondary },
  jaTemContaLink: { color: Colors.primary, fontWeight: '700' },
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
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
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
  tipoItemSelecionado: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tipoItemTexto: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  tipoItemTextoSelecionado: { color: '#fff' },
});
