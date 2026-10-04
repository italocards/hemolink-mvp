import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { buscarSolicitacoesPendentes } from '../services/solicitacoes';
import { Colors } from '../constants';
import { MainTabParamList } from '../types';
import TipoSanguineoTag from '../components/TipoSanguineoTag';

type NavProp = BottomTabNavigationProp<MainTabParamList>;

export default function HomeScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [pendentes, setPendentes] = useState(0);
  const [carregando, setCarregando] = useState(false);

  async function carregarDados() {
    setCarregando(true);
    try {
      const solic = await buscarSolicitacoesPendentes();
      setPendentes(solic.length);
    } catch {
      // silencioso na home
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const saudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.saudacaoArea}>
            <Text style={styles.saudacao}>{saudacao()},</Text>
            <Text style={styles.nome}>{usuario?.nome?.split(' ')[0] ?? 'Doador'}! 👋</Text>
          </View>
          {usuario?.tipoSanguineo && (
            <TipoSanguineoTag tipo={usuario.tipoSanguineo} tamanho="medio" />
          )}
        </View>
        <Text style={styles.headerSub}>Obrigado por fazer parte desta rede.</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={carregarDados} tintColor={Colors.primary} />
        }
      >
        {/* Card solicitações pendentes */}
        <View style={[styles.card, pendentes > 0 ? styles.cardUrgente : styles.cardNormal]}>
          <View style={styles.cardIcone}>
            <Ionicons
              name={pendentes > 0 ? 'alert-circle' : 'checkmark-circle'}
              size={32}
              color={pendentes > 0 ? Colors.danger : Colors.success}
            />
          </View>
          <View style={styles.cardTexto}>
            {pendentes > 0 ? (
              <>
                <Text style={styles.cardTitulo}>
                  {pendentes} {pendentes === 1 ? 'solicitação pendente' : 'solicitações pendentes'}
                </Text>
                <Text style={styles.cardSubtitulo}>Sua doação pode salvar uma vida agora.</Text>
              </>
            ) : (
              <>
                <Text style={styles.cardTitulo}>Nenhuma solicitação no momento</Text>
                <Text style={styles.cardSubtitulo}>Você será notificado quando houver necessidade.</Text>
              </>
            )}
          </View>
        </View>

        {/* Botão Ver Solicitações */}
        {pendentes > 0 && (
          <TouchableOpacity
            style={styles.botaoVer}
            onPress={() => navigation.navigate('Solicitacoes')}
            activeOpacity={0.8}
          >
            <Ionicons name="water" size={18} color="#fff" />
            <Text style={styles.botaoVerTexto}>Ver solicitações</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Ações rápidas */}
        <Text style={styles.secaoTitulo}>Acesso rápido</Text>
        <View style={styles.acoesGrid}>
          <TouchableOpacity
            style={styles.acaoCard}
            onPress={() => navigation.navigate('Mapa')}
            activeOpacity={0.8}
          >
            <View style={[styles.acaoIcone, { backgroundColor: '#EBF5FB' }]}>
              <Ionicons name="map" size={26} color="#2E86C1" />
            </View>
            <Text style={styles.acaoTexto}>Locais de{'\n'}doação</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acaoCard}
            onPress={() => navigation.navigate('Solicitacoes')}
            activeOpacity={0.8}
          >
            <View style={[styles.acaoIcone, { backgroundColor: '#FDEDEC' }]}>
              <Ionicons name="water" size={26} color={Colors.primary} />
            </View>
            <Text style={styles.acaoTexto}>Solicitações{'\n'}de doação</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acaoCard}
            onPress={() => navigation.navigate('Perfil')}
            activeOpacity={0.8}
          >
            <View style={[styles.acaoIcone, { backgroundColor: '#EAFAF1' }]}>
              <Ionicons name="person" size={26} color="#27AE60" />
            </View>
            <Text style={styles.acaoTexto}>Meu{'\n'}perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Info tipo sanguíneo */}
        {usuario?.tipoSanguineo && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.infoTexto}>
              Tipo <Text style={styles.infoBold}>{usuario.tipoSanguineo}</Text> — Você pode ser
              solicitado para doações compatíveis com seu tipo.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  saudacaoArea: { flex: 1 },
  saudacao: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  nome: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scroll: { padding: 20, paddingBottom: 40 },
  // Card status
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardUrgente: { backgroundColor: '#FDEDEC', borderWidth: 1, borderColor: '#F5B7B1' },
  cardNormal: { backgroundColor: '#EAFAF1', borderWidth: 1, borderColor: '#A9DFBF' },
  cardIcone: {},
  cardTexto: { flex: 1 },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  cardSubtitulo: { fontSize: 13, color: Colors.textSecondary },
  // Botão ver
  botaoVer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 8,
  },
  botaoVerTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Ações
  secaoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
    marginTop: 4,
  },
  acoesGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  acaoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  acaoIcone: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  acaoTexto: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  // Info
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FDEDEC',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoTexto: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  infoBold: { fontWeight: '700', color: Colors.primary },
});
