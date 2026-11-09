import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { buscarRanking, calcularProgresso, NIVEIS } from '../services/pontuacao';
import { Colors } from '../constants';
import { Usuario } from '../types';

// ─── Medalhas top 3 ──────────────────────────────────────────────────────────
const MEDALHA: Record<number, { emoji: string; cor: string; corLight: string }> = {
  1: { emoji: '🥇', cor: '#B8860B', corLight: '#FEF3C7' },
  2: { emoji: '🥈', cor: '#6B7280', corLight: '#F3F4F6' },
  3: { emoji: '🥉', cor: '#92400E', corLight: '#FEF3C7' },
};

// ─── Card do top 3 ───────────────────────────────────────────────────────────
function CardPodio({
  usuario,
  posicao,
  ehEuMesmo,
}: {
  usuario: Usuario;
  posicao: number;
  ehEuMesmo: boolean;
}) {
  const medalha = MEDALHA[posicao];
  const inicial = (usuario.nome ?? 'D').charAt(0).toUpperCase();

  return (
    <View style={[styles.podioCard, ehEuMesmo && styles.podioCardEu]}>
      {/* Posição */}
      <Text style={styles.podioMedalha}>{medalha.emoji}</Text>

      {/* Avatar */}
      <View style={[styles.podioAvatar, { backgroundColor: medalha.corLight }]}>
        <Text style={[styles.podioAvatarLetra, { color: medalha.cor }]}>{inicial}</Text>
      </View>

      {/* Info */}
      <View style={styles.podioInfo}>
        <View style={styles.podioNomeRow}>
          <Text style={styles.podioNome} numberOfLines={1}>
            {usuario.nome}
          </Text>
          {ehEuMesmo && (
            <View style={styles.euBadge}>
              <Text style={styles.euBadgeTexto}>Você</Text>
            </View>
          )}
        </View>
        <Text style={styles.podioTitulo}>{usuario.titulo ?? '🩸 Iniciante'}</Text>
      </View>

      {/* Pontos */}
      <View style={[styles.podioPontosArea, { backgroundColor: medalha.corLight }]}>
        <Text style={[styles.podioPontos, { color: medalha.cor }]}>
          {(usuario.pontos ?? 0).toLocaleString('pt-BR')}
        </Text>
        <Text style={[styles.podioPtsLabel, { color: medalha.cor }]}>pts</Text>
      </View>
    </View>
  );
}

// ─── Item da lista (posição 4+) ──────────────────────────────────────────────
function ItemRanking({
  usuario,
  posicao,
  ehEuMesmo,
}: {
  usuario: Usuario;
  posicao: number;
  ehEuMesmo: boolean;
}) {
  const inicial = (usuario.nome ?? 'D').charAt(0).toUpperCase();

  return (
    <View style={[styles.itemRow, ehEuMesmo && styles.itemRowEu]}>
      <Text style={styles.itemPosicao}>{posicao}º</Text>

      <View style={[styles.itemAvatar, ehEuMesmo && styles.itemAvatarEu]}>
        <Text style={[styles.itemAvatarLetra, ehEuMesmo && styles.itemAvatarLetraEu]}>
          {inicial}
        </Text>
      </View>

      <View style={styles.itemInfo}>
        <View style={styles.itemNomeRow}>
          <Text style={styles.itemNome} numberOfLines={1}>
            {usuario.nome}
          </Text>
          {ehEuMesmo && (
            <View style={styles.euBadge}>
              <Text style={styles.euBadgeTexto}>Você</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemTitulo}>{usuario.titulo ?? '🩸 Iniciante'}</Text>
      </View>

      <Text style={styles.itemPontos}>
        {(usuario.pontos ?? 0).toLocaleString('pt-BR')}{' '}
        <Text style={styles.itemPtsLabel}>pts</Text>
      </Text>
    </View>
  );
}

// ─── Card do usuário atual (fixo no topo) ────────────────────────────────────
function CardMeuRanking({
  usuario,
  posicao,
}: {
  usuario: Usuario;
  posicao: number;
}) {
  const pontos = usuario.pontos ?? 0;
  const { proximo, progresso, pontosRestantes } = calcularProgresso(pontos);
  const larguraBarra = `${Math.round(progresso * 100)}%` as const;

  return (
    <View style={styles.meuCard}>
      <View style={styles.meuCardTopo}>
        {/* Avatar + info */}
        <View style={styles.meuAvatarArea}>
          <View style={styles.meuAvatar}>
            <Text style={styles.meuAvatarLetra}>
              {(usuario.nome ?? 'D').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.meuInfo}>
            <Text style={styles.meuNome} numberOfLines={1}>{usuario.nome}</Text>
            <Text style={styles.meuTitulo}>{usuario.titulo ?? '🩸 Iniciante'}</Text>
          </View>
        </View>

        {/* Posição + pontos */}
        <View style={styles.meuPontosArea}>
          <Text style={styles.meuPosicao}>#{posicao}</Text>
          <Text style={styles.meuPontos}>{pontos.toLocaleString('pt-BR')} pts</Text>
        </View>
      </View>

      {/* Barra de progresso */}
      <View style={styles.progressoContainer}>
        <View style={styles.progressoBarra}>
          <View style={[styles.progressoPreenchido, { width: larguraBarra }]} />
        </View>
        <Text style={styles.progressoTexto}>
          {proximo
            ? `${pontosRestantes} pts para ${proximo}`
            : '🏆 Nível máximo atingido!'}
        </Text>
      </View>
    </View>
  );
}

// ─── Tela principal ──────────────────────────────────────────────────────────
export default function RankingScreen() {
  const { usuario } = useAuth();
  const [ranking, setRanking] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const minhaPosicao = ranking.findIndex((u) => u.id === usuario?.id) + 1;

  async function carregar(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setCarregando(true);
    try {
      const dados = await buscarRanking(50);
      setRanking(dados);
    } catch {
      // falha silenciosa; lista permanece vazia
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const onRefresh = useCallback(() => carregar(true), []);

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Separa top 3 do restante
  const top3 = ranking.slice(0, 3);
  const restante = ranking.slice(3);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <FlatList
        data={restante}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* ── Header ── */}
            <View style={styles.header}>
              <View style={styles.headerTextoArea}>
                <Text style={styles.headerTitulo}>Ranking</Text>
                <Text style={styles.headerSub}>Top doadores do HemoLink</Text>
              </View>
              <View style={styles.headerIconeArea}>
                <Ionicons name="trophy" size={32} color="rgba(255,255,255,0.9)" />
              </View>
            </View>

            {/* ── Card do usuário atual ── */}
            {usuario && (
              <View style={styles.meuCardWrapper}>
                <CardMeuRanking
                  usuario={usuario}
                  posicao={minhaPosicao > 0 ? minhaPosicao : ranking.length + 1}
                />
              </View>
            )}

            {/* ── Pódio (top 3) ── */}
            {top3.length > 0 && (
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>🏆 Pódio</Text>
                {top3.map((u, i) => (
                  <CardPodio
                    key={u.id}
                    usuario={u}
                    posicao={i + 1}
                    ehEuMesmo={u.id === usuario?.id}
                  />
                ))}
              </View>
            )}

            {/* ── Título da lista ── */}
            {restante.length > 0 && (
              <Text style={[styles.secaoTitulo, styles.secaoTituloLista]}>
                Classificação geral
              </Text>
            )}
          </>
        }
        renderItem={({ item, index }) => (
          <ItemRanking
            usuario={item}
            posicao={index + 4}
            ehEuMesmo={item.id === usuario?.id}
          />
        )}
        ListEmptyComponent={
          restante.length === 0 && ranking.length === 0 ? (
            <View style={styles.vazio}>
              <Ionicons name="trophy-outline" size={48} color={Colors.textLight} />
              <Text style={styles.vazioTexto}>Nenhum doador no ranking ainda.</Text>
              <Text style={styles.vazioSub}>Seja o primeiro a pontuar!</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.lista}
      />
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundGray },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { paddingBottom: 32 },

  // ── Header ──
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTextoArea: { gap: 4 },
  headerTitulo: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  headerIconeArea: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Card do usuário atual ──
  meuCardWrapper: { paddingHorizontal: 16, marginTop: -14 },
  meuCard: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...shadow,
  },
  meuCardTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  meuAvatarArea: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  meuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meuAvatarLetra: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  meuInfo: { flex: 1 },
  meuNome: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  meuTitulo: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  meuPontosArea: { alignItems: 'flex-end' },
  meuPosicao: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  meuPontos: { fontSize: 16, fontWeight: '900', color: Colors.primary },

  // Barra de progresso
  progressoContainer: { gap: 6 },
  progressoBarra: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressoPreenchido: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressoTexto: { fontSize: 11, color: Colors.textSecondary },

  // ── Seção ──
  secao: { paddingHorizontal: 16, marginTop: 20 },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  secaoTituloLista: { paddingHorizontal: 16, marginTop: 20 },

  // ── Pódio ──
  podioCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...shadow,
  },
  podioCardEu: { borderColor: Colors.primary, borderWidth: 1.5 },
  podioMedalha: { fontSize: 26, width: 32, textAlign: 'center' },
  podioAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podioAvatarLetra: { fontSize: 20, fontWeight: '800' },
  podioInfo: { flex: 1 },
  podioNomeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  podioNome: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  podioTitulo: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  podioPontosArea: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  podioPontos: { fontSize: 16, fontWeight: '900' },
  podioPtsLabel: { fontSize: 10, fontWeight: '600', marginTop: -2 },

  // ── Lista (4+) ──
  itemRow: {
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemRowEu: { backgroundColor: Colors.primaryLight },
  itemPosicao: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    width: 28,
    textAlign: 'center',
  },
  itemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAvatarEu: { backgroundColor: Colors.primary },
  itemAvatarLetra: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  itemAvatarLetraEu: { color: '#fff' },
  itemInfo: { flex: 1 },
  itemNomeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemNome: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  itemTitulo: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  itemPontos: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  itemPtsLabel: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary },

  // ── Badge "Você" ──
  euBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  euBadgeTexto: { fontSize: 10, fontWeight: '700', color: '#fff' },

  // ── Estado vazio ──
  vazio: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  vazioTexto: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  vazioSub: { fontSize: 13, color: Colors.textLight },
});
