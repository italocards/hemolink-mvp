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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors } from '../constants';
import { entrar } from '../services/auth';
import InputCampo from '../components/InputCampo';
import BotaoPrimario from '../components/BotaoPrimario';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  function validar() {
    let valido = true;
    setErroEmail('');
    setErroSenha('');
    if (!email.trim()) { setErroEmail('Informe seu e-mail'); valido = false; }
    if (!senha.trim()) { setErroSenha('Informe sua senha'); valido = false; }
    return valido;
  }

  async function handleEntrar() {
    if (!validar()) return;
    setCarregando(true);
    try {
      await entrar(email.trim(), senha);
      // RootNavigator redireciona automaticamente via onAuthStateChanged
    } catch (error: any) {
      const msg =
        error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
          ? 'E-mail ou senha incorretos.'
          : error.code === 'auth/invalid-email'
          ? 'E-mail inválido.'
          : error.code === 'auth/invalid-credential'
          ? 'Credenciais inválidas. Verifique e-mail e senha.'
          : 'Erro ao entrar. Tente novamente.';
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
        {/* Header vermelho */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🩸</Text>
          </View>
          <Text style={styles.titulo}>HemoLink</Text>
          <Text style={styles.subtitulo}>Bem-vindo de volta</Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <InputCampo
            label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            iconLeft="mail-outline"
            erro={erroEmail}
          />
          <InputCampo
            label="Senha"
            placeholder="Sua senha"
            value={senha}
            onChangeText={setSenha}
            senha
            iconLeft="lock-closed-outline"
            erro={erroSenha}
          />

          <BotaoPrimario
            titulo="Entrar"
            onPress={handleEntrar}
            carregando={carregando}
            style={styles.botaoEntrar}
          />

          <View style={styles.divisor}>
            <View style={styles.linha} />
            <Text style={styles.divisorTexto}>ou</Text>
            <View style={styles.linha} />
          </View>

          <BotaoPrimario
            titulo="Criar conta"
            onPress={() => navigation.navigate('Cadastro')}
            variante="secundario"
          />

          <Text style={styles.textoInfo}>
            Ao entrar, você concorda em salvar vidas. 🩸
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 80,
    paddingBottom: 48,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoEmoji: { fontSize: 36 },
  titulo: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },
  subtitulo: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  form: {
    padding: 24,
    paddingTop: 32,
  },
  botaoEntrar: { marginTop: 8 },
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  linha: { flex: 1, height: 1, backgroundColor: Colors.border },
  divisorTexto: { color: Colors.textLight, fontSize: 13 },
  textoInfo: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 12,
    marginTop: 24,
  },
});
