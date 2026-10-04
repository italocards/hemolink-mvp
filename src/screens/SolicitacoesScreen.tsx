import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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
import { Colors, URGENCIA_COLORS, URGENCIA_LABELS } from '../constants';
import { Solicitacao, Hemocentro, SolicitacoesStackParamList } from '../types';
import TipoSanguineoTag from '../components/TipoSanguineoTag';
import UrgenciaBadge from '../components/UrgenciaBadge';

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

  useEffect(() => {
    carregar();
  }, [carregar]);

  const dados = aba === 'pendentes' ? pendentes : aceitas;

  function renderItem({ item }: { item: Solicitacao }) {
    const hemo = hemocentros[item.hemocentroId];
    const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR');

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DetalhesSolicitacao', { solicitacaoId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <TipoSanguineoTag tipo={item.tipoSanguineo} tamanho="medio" />
          <View style={styles.cardInfo}>
            <View style={styles.cardInfoRow}>
              <UrgenciaBadge urgencia={item.urgencia} />
            </View>
            <Text style={styles.cardHemo} numberOfLines={1}>
              <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />{' '}
              {hemo?.nome ?? 'Hemocentro'}
            </Text>
            <Text style={styles.cardEndereco} numberOfLines={1}>
              {hemo?.endereco ?? ''}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.cardData}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textLight} />
            <Text style={styles.cardDataTexto}>{dataFormatada}</Text>
          </View>
          {aba === 'aceitas' && (
            <View style={styles.aceitaBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.aceitaTexto}>Confirmado</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
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

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : dados.length === 0 ? (
        <View style={styles.centro}>
          <Ionicons name="water-outline" size={64} color={Colors.border} />
          <Text style={styles.vazio}>
            {aba === 'pendentes'
              ? 'Nenhuma solicitação pendente no momento.'
              : 'Você ainda não aceitou nenhuma solicitação.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={dados}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl refreshing={carregando} onRefresh={carregar} tintColor={Colors.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  abas: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  aba: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  abaAtiva: { borderBottomColor: Colors.primary },
  abaTexto: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  abaTextoAtivo: { color: Colors.primary },
  lista: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  cardInfo: { flex: 1, gap: 5 },
  cardInfoRow: { flexDirection: 'row', gap: 8 },
  cardHemo: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  cardEndereco: { fontSize: 12, color: Colors.textSecondary },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  cardData: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDataTexto: { fontSize: 12, color: Colors.textLight },
  aceitaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aceitaTexto: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 40 },
  vazio: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
});
