import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import {
  buscarSolicitacoesPendentes,
  buscarSolicitacoesAceitas,
  buscarHemocentros,
} from '../services/solicitacoes';
import { Colors, URGENCIA_LABELS, URGENCIA_COLORS, URGENCIA_LIGHT_COLORS } from '../constants';
import { Solicitacao, Hemocentro, SolicitacoesStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<SolicitacoesStackParamList, 'ListaSolicitacoes'>;

export default function SolicitacoesScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<NavProp>();

  const [aba, setAba] = useState<'pendentes' | 'aceitas'>('pendentes');
  const [pendentes, setPendentes] = useState<Solicitacao[]>([]);
  const [aceitas, setAceitas] = useState<Solicitacao[]>([]);
  const [hemocentros, setHemocentros] = useState<Record<string, Hemocentro>>({});
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [hemos, pend] = await Promise.all([
        buscarHemocentros(),
        buscarSolicitacoesPendentes(),
      ]);
      const mapaHemos: Record<string, Hemocentro> = {};
      hemos.forEach((h) => (mapaHemos[h.id] = h));
      setHemocentros(mapaHemos);
      setPendentes(pend);
      if (usuario?.id) {
        const aceit = await buscarSolicitacoesAceitas(usuario.id);
        setAceitas(aceit);
      }
    } catch (e) {
      console.error('Erro ao carregar solicitações:', e);
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const dados = aba === 'pendentes' ? pendentes : aceitas;

  function renderItem({ item }: { item: Solicitacao }) {
    const hemo = hemocentros[item.hemocentroId];
    const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR');
    const urgCor = URGENCIA_COLORS[item.urgencia] ?? Colors.textSecondary;
    const urgCorLight = URGENCIA_LIGHT_COLORS[item.urgencia] ?? Colors.backgroundGray;
    const urgLabel = (URGENCIA_LABELS[item.urgencia] ?? item.urgencia).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DetalhesSolicitacao', { solicitacaoId: item.id })}
        activeOpacity={0.8}
      >
        {/* Tipo sanguíneo */}
        <View style={styles.cardTipoArea}>
          <Text style={styles.cardTipo}>{item.tipoSanguineo}</Text>
        </View>

        {/* Conteúdo */}
        <View style={styles.cardConteudo}>
          {/* Badge urgência */}
          <View style={[styles.urgBadge, { backgroundColor: urgCorLight }]}>
            <Text style={[styles.urgBadgeTexto, { color: urgCor }]}>{urgLabel}</Text>
          </View>

          {/* Hemocentro */}
          <Text style={styles.cardHemoNome} numberOfLines={1}>
            {hemo?.nome ?? 'Hemocentro'}
          </Text>
          <View style={styles.cardRow}>
            <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.cardRowTexto} numberOfLines={1}>
              {hemo?.endereco ?? ''}
            </Text>
          </View>

          {/* Data */}
          <View style={styles.cardRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.cardRowTexto}>{dataFormatada}</Text>

            {aba === 'aceitas' && (
              <View style={styles.aceitaTag}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                <Text style={styles.aceitaTagTexto}>Confirmado</Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Solicitações</Text>
      </View>

      {/* Abas */}
      <View style={styles.abas}>
        <TouchableOpacity
          style={[styles.aba, aba === 'pendentes' && styles.abaAtiva]}
          onPress={() => setAba('pendentes')}
        >
          <Text style={[styles.abaTexto, aba === 'pendentes' && styles.abaTextoAtivo]}>
            Pendentes {pendentes.length > 0 ? `(${pendentes.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.aba, aba === 'aceitas' && styles.abaAtiva]}
          onPress={() => setAba('aceitas')}
        >
          <Text style={[styles.abaTexto, aba === 'aceitas' && styles.abaTextoAtivo]}>
            Aceitas {aceitas.length > 0 ? `(${aceitas.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : dados.length === 0 ? (
        <View style={styles.centro}>
          <View style={styles.vazioIcone}>
            <Ionicons name="water-outline" size={40} color={Colors.textLight} />
          </View>
          <Text style={styles.vazioTitulo}>Nenhuma solicitação</Text>
          <Text style={styles.vazioSub}>
            {aba === 'pendentes'
              ? 'Não há solicitações pendentes no momento.'
              : 'Você ainda não aceitou nenhuma solicitação.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={dados}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={carregando} onRefresh={carregar} tintColor={Colors.primary} />
          }
        />
      )}
    </View>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  headerTitulo: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },

  // Abas
  abas: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  aba: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  abaAtiva: { borderBottomColor: Colors.primary },
  abaTexto: { fontSize: 14, fontWeight: '600', color: Colors.textLight },
  abaTextoAtivo: { color: Colors.primary },

  // Lista
  lista: { padding: 20, gap: 12 },

  // Card
  card: {
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
  cardTipoArea: {
    width: 52, height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTipo: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  cardConteudo: { flex: 1, gap: 4 },
  urgBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  urgBadgeTexto: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardHemoNome: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardRowTexto: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  aceitaTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' as any },
  aceitaTagTexto: { fontSize: 11, color: Colors.success, fontWeight: '600' },

  // Vazio
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  vazioIcone: {
    width: 80, height: 80,
    borderRadius: 24,
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vazioTitulo: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  vazioSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
