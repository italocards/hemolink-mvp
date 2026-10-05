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
  Image,
  StatusBar,
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
    setErroEmail(''); setErroSenha('');
    if (!email.trim()) { setErroEmail('Informe seu e-mail'); valido = false; }
    if (!senha.trim()) { setErroSenha('Informe sua senha'); valido = false; }
    return valido;
  }

  async function handleEntrar() {
    if (!validar()) return;
    setCarregando(true);
    try {
      await entrar(email.trim(), senha);
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + título */}
        <View style={styles.topoArea}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.titulo}>Bem-vindo de volta!</Text>
          <Text style={styles.subtitulo}>Acesse sua conta para continuar</Text>
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

          <TouchableOpacity
            style={styles.botaoCriar}
            onPress={() => navigation.navigate('Cadastro')}
            activeOpacity={0.8}
          >
            <Text style={styles.botaoCriarTexto}>Criar conta</Text>
          </TouchableOpacity>
        </View>

        {/* Rodapé */}
        <Text style={styles.rodape}>
          Ao entrar, você concorda em salvar vidas. 🩸
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },

  // Topo
  topoArea: { alignItems: 'center', paddingTop: 64, paddingBottom: 40 },
  logo: { width: 180, height: 56, marginBottom: 32 },
  titulo: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  subtitulo: { fontSize: 15, color: Colors.textSecondary },

  // Formulário
  form: {},
  botaoEntrar: { marginTop: 8 },

  // Divisor
  divisor: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  linha: { flex: 1, height: 1, backgroundColor: Colors.border },
  divisorTexto: { fontSize: 13, color: Colors.textLight },

  // Botão criar conta
  botaoCriar: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  botaoCriarTexto: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  // Rodapé
  rodape: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginTop: 32 },
});
