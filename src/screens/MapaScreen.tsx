import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { buscarHemocentros } from '../services/solicitacoes';
import { Colors, DEFAULT_LOCATION } from '../constants';
import { Hemocentro } from '../types';
import { useAuth } from '../hooks/useAuth';

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

// Gera o HTML completo com Leaflet + CartoDB Voyager (visual moderno)
function gerarHTML(
  userLat: number,
  userLon: number,
  hemocentros: Hemocentro[],
  casaLat?: number,
  casaLon?: number,
): string {
  const marcadores = hemocentros
    .map(
      (h) => `
      (function() {
        var el = document.createElement('div');
        el.className = 'marker-hemo';
        el.innerHTML = '<div class="marker-pin"><svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.5 2 5 5.5 5 10c0 5.25 7 12 7 12s7-6.75 7-12c0-4.5-3.5-8-7-8zm0 10.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 7.5 12 7.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div><div class="marker-pulse"></div>';
        el.addEventListener('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ id: '${h.id}' }));
        });
        var marker = L.marker([${h.latitude}, ${h.longitude}], {
          icon: L.divIcon({ html: el.outerHTML, className: '', iconSize: [44, 52], iconAnchor: [22, 52] })
        }).addTo(map);
      })();
    `
    )
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; font-family: -apple-system, sans-serif; }

    /* Esconde controles padrão do Leaflet */
    .leaflet-control-zoom,
    .leaflet-control-attribution { display: none !important; }

    /* Marcador hemocentro */
    .marker-hemo { position: relative; cursor: pointer; }
    .marker-pin {
      width: 44px; height: 44px;
      background: #C0392B;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(192,57,43,0.5);
      border: 3px solid #fff;
    }
    .marker-pin svg {
      width: 22px; height: 22px;
      transform: rotate(45deg);
    }
    .marker-pulse {
      position: absolute;
      bottom: -8px; left: 50%;
      transform: translateX(-50%);
      width: 10px; height: 10px;
      background: rgba(192,57,43,0.3);
      border-radius: 50%;
      animation: pulse 1.8s ease-out infinite;
    }
    @keyframes pulse {
      0%   { transform: translateX(-50%) scale(1); opacity: 1; }
      100% { transform: translateX(-50%) scale(3); opacity: 0; }
    }

    /* Marcador do usuário */
    .marker-user {
      width: 20px; height: 20px;
      background: #2E86C1;
      border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 0 0 4px rgba(46,134,193,0.3), 0 4px 12px rgba(0,0,0,0.2);
    }

    /* Marcador da casa */
    .marker-casa {
      width: 44px; height: 44px;
      background: #1A5276;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(26,82,118,0.5);
      border: 3px solid #fff;
    }
    .marker-casa svg {
      width: 20px; height: 20px;
      transform: rotate(45deg);
      fill: white;
    }

    /* Popup customizado */
    .leaflet-popup-content-wrapper {
      border-radius: 16px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
      border: none !important;
      padding: 0 !important;
      overflow: hidden;
    }
    .leaflet-popup-content {
      margin: 0 !important;
      min-width: 200px;
    }
    .leaflet-popup-tip-container { display: none; }
    .popup-body {
      padding: 14px 16px;
      background: #fff;
    }
    .popup-title {
      font-size: 14px; font-weight: 700;
      color: #1A1A1A; margin-bottom: 4px;
    }
    .popup-sub {
      font-size: 12px; color: #888; line-height: 1.4;
    }
    .popup-badge {
      display: inline-block;
      background: #FDEDEC; color: #C0392B;
      font-size: 11px; font-weight: 700;
      padding: 3px 8px; border-radius: 8px; margin-top: 8px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${userLat}, ${userLon}], 14);

    // MapTiler Streets — visual moderno tipo Google Maps / Waze (gratuito)
    var MAPTILER_KEY = 'KHp3SFUKOrqt2KwsUvAM';
    L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=' + MAPTILER_KEY, {
      maxZoom: 20,
      attribution: '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      crossOrigin: true,
    }).addTo(map);

    // Marcador do usuário
    var userIcon = L.divIcon({
      html: '<div class="marker-user"></div>',
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    L.marker([${userLat}, ${userLon}], { icon: userIcon })
      .addTo(map)
      .bindPopup('<div class="popup-body"><div class="popup-title">📍 Você está aqui</div></div>');

    ${casaLat && casaLon ? `
    // Marcador da casa do usuário
    var casaIcon = L.divIcon({
      html: '<div class="marker-casa"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></div>',
      className: '',
      iconSize: [44, 52],
      iconAnchor: [22, 52],
    });
    L.marker([${casaLat}, ${casaLon}], { icon: casaIcon })
      .addTo(map)
      .bindPopup('<div class="popup-body"><div class="popup-title">🏠 Sua casa</div></div>');
    ` : ''}

    // Marcadores dos hemocentros
    ${marcadores}

    // Receber foco do React Native
    document.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.lat && data.lon) {
          map.flyTo([data.lat, data.lon], 16, { duration: 0.8 });
        }
      } catch(err) {}
    });
    window.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.lat && data.lon) {
          map.flyTo([data.lat, data.lon], 16, { duration: 0.8 });
        }
      } catch(err) {}
    });
  </script>
</body>
</html>
  `;
}

export default function MapaScreen() {
  const { usuario } = useAuth();
  const [hemocentros, setHemocentros] = useState<Hemocentro[]>([]);
  const [userLat, setUserLat] = useState(DEFAULT_LOCATION.latitude);
  const [userLon, setUserLon] = useState(DEFAULT_LOCATION.longitude);
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState<Hemocentro | null>(null);
  const [htmlPronto, setHtmlPronto] = useState('');
  const webViewRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      inicializar();
    }, [usuario?.latitude, usuario?.longitude])
  );

  async function inicializar() {
    setCarregando(true);
    try {
      let lat = DEFAULT_LOCATION.latitude;
      let lon = DEFAULT_LOCATION.longitude;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      }

      setUserLat(lat);
      setUserLon(lon);

      const lista = await buscarHemocentros();
      const comDistancia = lista.map((h) => ({
        ...h,
        distancia: calcularDistancia(lat, lon, h.latitude, h.longitude),
      }));
      comDistancia.sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0));
      setHemocentros(comDistancia);
      setHtmlPronto(gerarHTML(lat, lon, comDistancia, usuario?.latitude, usuario?.longitude));
    } catch (e) {
      console.error('Erro no mapa:', e);
    } finally {
      setCarregando(false);
    }
  }

  function focarHemocentro(hemo: Hemocentro) {
    setSelecionado(hemo);
    webViewRef.current?.injectJavaScript(`
      map.flyTo([${hemo.latitude}, ${hemo.longitude}], 16, { duration: 0.8 });
      true;
    `);
  }

  // Recebe clique no marcador do Leaflet
  function onMensagemWebView(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.id) {
        const hemo = hemocentros.find((h) => h.id === data.id);
        if (hemo) setSelecionado(hemo);
      }
    } catch {}
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
      {/* Mapa OpenStreetMap via WebView */}
      {htmlPronto ? (
        <WebView
          ref={webViewRef}
          style={styles.mapa}
          source={{ html: htmlPronto }}
          onMessage={onMensagemWebView}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.mapaCarregando}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
        />
      ) : (
        <View style={styles.mapaCarregando}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

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
              style={[
                styles.cardHemo,
                selecionado?.id === item.id && styles.cardHemoSelecionado,
              ]}
              onPress={() => focarHemocentro(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHemoTop}>
                <Ionicons name="business" size={18} color={Colors.primary} />
                <Text style={styles.cardHemoNome} numberOfLines={1}>
                  {item.nome}
                </Text>
              </View>
              <Text style={styles.cardHemoEnd} numberOfLines={2}>
                {item.endereco}
              </Text>
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
                    <Text style={styles.modalInfoTexto}>
                      {selecionado.horarioFuncionamento}
                    </Text>
                  </View>
                  {selecionado.distancia !== undefined && (
                    <View style={styles.modalInfoRow}>
                      <Ionicons
                        name="navigate-outline"
                        size={16}
                        color={Colors.textSecondary}
                      />
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
  mapaCarregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
  },
  // Lista
  listaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.97)',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  modalIcone: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FDEDEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTextos: { flex: 1 },
  modalNome: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
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
