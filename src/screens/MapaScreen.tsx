import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { buscarHemocentros } from '../services/solicitacoes';
import { Colors, DEFAULT_LOCATION } from '../constants';
import { Hemocentro } from '../types';

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapaScreen() {
  const [hemocentros, setHemocentros] = useState<Hemocentro[]>([]);
  const [localizacao, setLocalizacao] = useState(DEFAULT_LOCATION);
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState<Hemocentro | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    inicializar();
  }, []);

  async function inicializar() {
    setCarregando(true);
    try {
      // Localização do usuário
      const { status } = await Location.requestForegroundPermissionsAsync();
      let userLat = DEFAULT_LOCATION.latitude;
      let userLon = DEFAULT_LOCATION.longitude;

      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        setLocalizacao({
          latitude: userLat,
          longitude: userLon,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }

      // Hemocentros
      const lista = await buscarHemocentros();
      const comDistancia = lista.map((h) => ({
        ...h,
        distancia: calcularDistancia(userLat, userLon, h.latitude, h.longitude),
      }));
      comDistancia.sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0));
      setHemocentros(comDistancia);
    } catch (e) {
      console.error('Erro no mapa:', e);
    } finally {
      setCarregando(false);
    }
  }

  function abrirRota(hemo: Hemocentro) {
    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${hemo.nome}@${hemo.latitude},${hemo.longitude}`
        : `geo:${hemo.latitude},${hemo.longitude}?q=${hemo.latitude},${hemo.longitude}(${encodeURIComponent(hemo.nome)})`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o mapa de rotas.')
    );
  }

  function focarHemocentro(hemo: Hemocentro) {
    setSelecionado(hemo);
    mapRef.current?.animateToRegion(
      {
        latitude: hemo.latitude,
        longitude: hemo.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      500
    );
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.carregandoTexto}>Carregando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.mapa}
        provider={PROVIDER_DEFAULT}
        initialRegion={localizacao}
        showsUserLocation
        showsMyLocationButton
      >
        {hemocentros.map((hemo) => (
          <Marker
            key={hemo.id}
            coordinate={{ latitude: hemo.latitude, longitude: hemo.longitude }}
            title={hemo.nome}
            description={hemo.endereco}
            pinColor={Colors.primary}
            onPress={() => setSelecionado(hemo)}
          />
        ))}
      </MapView>

      {/* Lista de hemocentros próximos */}
      <View style={styles.listaContainer}>
        <Text style={styles.listaTitulo}>Locais próximos</Text>
        <FlatList
          horizontal
          data={hemocentros}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listaScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.cardHemo, selecionado?.id === item.id && styles.cardHemoSelecionado]}
              onPress={() => focarHemocentro(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHemoTop}>
                <Ionicons name="business" size={18} color={Colors.primary} />
                <Text style={styles.cardHemoNome} numberOfLines={1}>{item.nome}</Text>
              </View>
              <Text style={styles.cardHemoEnd} numberOfLines={2}>{item.endereco}</Text>
              {item.distancia !== undefined && (
                <View style={styles.cardHemoDist}>
                  <Ionicons name="navigate-outline" size={13} color={Colors.textLight} />
                  <Text style={styles.cardHemoDistTexto}>
                    {item.distancia < 1
                      ? `${Math.round(item.distancia * 1000)}m`
                      : `${item.distancia.toFixed(1)}km`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Modal detalhes do hemocentro */}
      <Modal visible={selecionado !== null} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelecionado(null)}
        >
          <View style={styles.modalContainer}>
            {selecionado && (
              <>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <View style={styles.modalIcone}>
                    <Ionicons name="business" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.modalTextos}>
                    <Text style={styles.modalNome}>{selecionado.nome}</Text>
                    <Text style={styles.modalEndereco}>{selecionado.endereco}</Text>
                  </View>
                </View>

                <View style={styles.modalInfos}>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.modalInfoTexto}>{selecionado.horarioFuncionamento}</Text>
                  </View>
                  {selecionado.distancia !== undefined && (
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="navigate-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.modalInfoTexto}>
                        {selecionado.distancia < 1
                          ? `${Math.round(selecionado.distancia * 1000)} metros de você`
                          : `${selecionado.distancia.toFixed(1)} km de você`}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.botaoRota}
                  onPress={() => abrirRota(selecionado)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={18} color="#fff" />
                  <Text style={styles.botaoRotaTexto}>Como chegar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  carregandoTexto: { fontSize: 15, color: Colors.textSecondary },
  mapa: { flex: 1 },
  // Lista
  listaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingTop: 14,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  listaTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 16,
    marginBottom: 10,
  },
  listaScroll: { paddingHorizontal: 16, gap: 12 },
  cardHemo: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 5,
  },
  cardHemoSelecionado: { borderColor: Colors.primary, backgroundColor: '#FDEDEC' },
  cardHemoTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardHemoNome: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  cardHemoEnd: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  cardHemoDist: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardHemoDistTexto: { fontSize: 11, color: Colors.textLight },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  modalIcone: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FDEDEC', alignItems: 'center', justifyContent: 'center' },
  modalTextos: { flex: 1 },
  modalNome: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  modalEndereco: { fontSize: 13, color: Colors.textSecondary },
  modalInfos: { gap: 10, marginBottom: 20 },
  modalInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalInfoTexto: { fontSize: 14, color: Colors.textSecondary },
  botaoRota: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  botaoRotaTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
