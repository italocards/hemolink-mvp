import React, { useEffect, useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { buscarSolicitacoesPendentes } from '../services/solicitacoes';
import { Colors } from '../constants';
import { MainTabParamList, Solicitacao } from '../types';

type NavProp = BottomTabNavigationProp<MainTabParamList>;

export default function HomeScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [pendentes, setPendentes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const solic = await buscarSolicitacoesPendentes();
      setPendentes(solic);
    } catch {
      // silencioso
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregarDados(); }, [carregarDados]));

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Doador';
  const totalPendentes = pendentes.length;
  const primeiraSolicPendente = pendentes[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={carregarDados} tintColor={Colors.primary} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>
            <Text style={styles.headerTituloVermelho}>Hemo</Text>Link
          </Text>
          <TouchableOpacity
            style={styles.headerRight}
            onPress={() => navigation.navigate('Solicitacoes')}
            activeOpacity={0.7}
          >
            {totalPendentes > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeTexto}>{totalPendentes}</Text>
              </View>
            )}
            <Ionicons name="notifications-outline" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Saudação ── */}
        <View style={styles.saudacaoArea}>
          <Text style={styles.saudacaoTexto}>{saudacao()}, {primeiroNome}!</Text>
          <Text style={styles.saudacaoSub}>Que bom te ver por aqui!</Text>
        </View>

        {/* ── Card tipo sanguíneo + status ── */}
        <View style={styles.tipoCard}>
          <View style={styles.tipoEsquerdo}>
            <Text style={styles.tipoLabel}>Seu tipo sanguíneo</Text>
            <Text style={styles.tipoValor}>{usuario?.tipoSanguineo ?? '--'}</Text>
          </View>
          <View style={styles.tipoDivisor} />
          <TouchableOpacity
            style={styles.tipoDireito}
            onPress={() => navigation.navigate('Solicitacoes')}
            activeOpacity={0.7}
          >
            <View style={styles.tipoIconeArea}>
              <Ionicons name="water" size={22} color={Colors.primary} />
            </View>
            <View style={styles.tipoStatusTexto}>
              <Text style={styles.tipoStatusTitulo}>
                {totalPendentes > 0 ? 'Solicitação pendente' : 'Você está apto para doar'}
              </Text>
              {usuario?.ultimaDoacao ? (
                <Text style={styles.tipoStatusSub}>
                  Última doação: {usuario.ultimaDoacao}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* ── Solicitações pendentes ── */}
        {totalPendentes > 0 && (
          <View style={styles.secao}>
            <View style={styles.secaoHeader}>
              <Text style={styles.secaoTitulo}>Solicitação pendente</Text>
              <View style={styles.secaoBadge}>
                <Text style={styles.secaoBadgeTexto}>{totalPendentes}</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Solicitacoes')}
                style={styles.verTodas}
                activeOpacity={0.7}
              >
                <Text style={styles.verTodasTexto}>Ver todas →</Text>
              </TouchableOpacity>
            </View>

            {primeiraSolicPendente && (
              <TouchableOpacity
                style={styles.solicCard}
                onPress={() => navigation.navigate('Solicitacoes')}
                activeOpacity={0.8}
              >
                <View style={styles.solicIconeArea}>
                  <Ionicons name="water" size={28} color={Colors.primary} />
                </View>
                <View style={styles.solicInfo}>
                  {(primeiraSolicPendente.urgencia === 'critica' || primeiraSolicPendente.urgencia === 'alta') && (
                    <View style={styles.urgenteBadge}>
                      <Text style={styles.urgenteBadgeTexto}>
                        {primeiraSolicPendente.urgencia === 'critica' ? 'URGENTE' : 'ALTA'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.solicTitulo}>
                    Necessidade de sangue {primeiraSolicPendente.tipoSanguineo}
                  </Text>
                  <View style={styles.solicRow}>
                    <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.solicTexto}>
                      {primeiraSolicPendente.hemocentroNome ?? 'Hemocentro'}
                    </Text>
                  </View>
                  <View style={styles.solicRow}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.solicTexto}>
                      Solicitação realizada hoje
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Ações rápidas ── */}
        <View style={styles.acoesGrid}>
          <TouchableOpacity
            style={styles.acaoCard}
            onPress={() => navigation.navigate('Mapa')}
            activeOpacity={0.8}
          >
            <View style={[styles.acaoIcone, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="location" size={28} color={Colors.primary} />
            </View>
            <View style={styles.acaoTextoArea}>
              <Text style={styles.acaoTitulo}>Encontrar locais{'\n'}para doar</Text>
              <Text style={styles.acaoSub}>Veja hemocentros próximos a você</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acaoCard}
            onPress={() => navigation.navigate('Solicitacoes')}
            activeOpacity={0.8}
          >
            <View style={[styles.acaoIcone, { backgroundColor: Colors.backgroundGray }]}>
              <Ionicons name="document-text" size={28} color={Colors.textPrimary} />
            </View>
            <View style={styles.acaoTextoArea}>
              <Text style={styles.acaoTitulo}>Minhas{'\n'}solicitações</Text>
              <Text style={styles.acaoSub}>Acompanhe suas solicitações e histórico</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* ── Dica ── */}
        <View style={styles.dicaCard}>
          <View style={styles.dicaIcone}>
            <Ionicons name="calendar-outline" size={22} color={Colors.textSecondary} />
          </View>
          <Text style={styles.dicaTexto}>
            A doação de sangue ajuda a salvar vidas.{'\n'}
            <Text style={styles.dicaLink}>Encontre um local próximo e faça a diferença.</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 20,
  },
  headerTitulo: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  headerTituloVermelho: { color: Colors.primary },
  headerRight: { position: 'relative' },
  notifBadge: {
    position: 'absolute',
    top: -4, right: -4,
    width: 18, height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  notifBadgeTexto: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Saudação
  saudacaoArea: { marginBottom: 24 },
  saudacaoTexto: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  saudacaoSub: { fontSize: 15, color: Colors.textSecondary, marginTop: 2 },

  // Card tipo sanguíneo
  tipoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundGray,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    alignItems: 'center',
    ...shadow,
  },
  tipoEsquerdo: { alignItems: 'center', minWidth: 72 },
  tipoLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  tipoValor: { fontSize: 36, fontWeight: '900', color: Colors.primary, letterSpacing: -1 },
  tipoDivisor: { width: 1, height: 48, backgroundColor: Colors.border, marginHorizontal: 16 },
  tipoDireito: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipoIconeArea: {
    width: 42, height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipoStatusTexto: { flex: 1 },
  tipoStatusTitulo: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  tipoStatusSub: { fontSize: 11, color: Colors.textSecondary },

  // Seção
  secao: { marginBottom: 28 },
  secaoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  secaoTitulo: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  secaoBadge: {
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secaoBadgeTexto: { fontSize: 12, fontWeight: '800', color: '#fff' },
  verTodas: { marginLeft: 'auto' as any },
  verTodasTexto: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Card solicitação
  solicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...shadow,
  },
  solicIconeArea: {
    width: 52, height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solicInfo: { flex: 1, gap: 4 },
  urgenteBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  urgenteBadgeTexto: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  solicTitulo: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  solicRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  solicTexto: { fontSize: 12, color: Colors.textSecondary },

  // Ações
  acoesGrid: { gap: 12, marginBottom: 28 },
  acaoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...shadow,
  },
  acaoIcone: {
    width: 52, height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acaoTextoArea: { flex: 1 },
  acaoTitulo: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  acaoSub: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },

  // Dica
  dicaCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.backgroundGray,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dicaIcone: {},
  dicaTexto: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  dicaLink: { color: Colors.textPrimary, fontWeight: '600' },
});
