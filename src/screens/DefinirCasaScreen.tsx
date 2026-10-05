import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { Colors, DEFAULT_LOCATION } from '../constants';
import { PerfilStackParamList } from '../types';

type Props = NativeStackScreenProps<PerfilStackParamList, 'DefinirCasa'>;

const MAPTILER_KEY = 'KHp3SFUKOrqt2KwsUvAM';

function gerarHTML(centerLat: number, centerLon: number, casaLat?: number, casaLon?: number): string {
  const marcadorCasa =
    casaLat && casaLon
      ? `casaMarker = L.marker([${casaLat}, ${casaLon}], { icon: casaIcon }).addTo(map);`
      : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    .leaflet-control-zoom, .leaflet-control-attribution { display:none !important; }

    /* Marcador de casa */
    .casa-marker {
      width: 48px; height: 48px;
      background: #2E86C1;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(46,134,193,0.5);
      border: 3px solid #fff;
    }
    .casa-marker svg {
      width: 22px; height: 22px;
      transform: rotate(45deg);
      fill: white;
    }

    /* Crosshair central */
    #crosshair {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1000;
    }
    #crosshair svg { filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4)); }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="crosshair">
    <svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 2C15.163 2 8 9.163 8 18c0 11.25 16 34 16 34S40 29.25 40 18C40 9.163 32.837 2 24 2z" fill="#C0392B" stroke="white" stroke-width="2"/>
      <circle cx="24" cy="18" r="6" fill="white"/>
    </svg>
  </div>

  <script>
    var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLon}], 15);

    L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}', {
      maxZoom: 20, crossOrigin: true
    }).addTo(map);

    var casaIcon = L.divIcon({
      html: '<div class="casa-marker"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></div>',
      className: '', iconSize: [48, 48], iconAnchor: [24, 48]
    });

    var casaMarker = null;
    ${marcadorCasa}

    // Envia centro do mapa ao React Native quando o movimento para
    map.on('moveend', function() {
      var c = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'center',
        lat: c.lat,
        lon: c.lng
      }));
    });

    // Recebe comando para colocar marcador de casa
    document.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'confirmar') {
          var c = map.getCenter();
          if (casaMarker) map.removeLayer(casaMarker);
          casaMarker = L.marker([c.lat, c.lng], { icon: casaIcon }).addTo(map);
        }
      } catch(err) {}
    });
    window.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'confirmar') {
          var c = map.getCenter();
          if (casaMarker) map.removeLayer(casaMarker);
          casaMarker = L.marker([c.lat, c.lng], { icon: casaIcon }).addTo(map);
        }
      } catch(err) {}
    });
  </script>
</body>
</html>`;
}

export default function DefinirCasaScreen({ navigation }: Props) {
  const { usuario, setUsuario } = useAuth();
  const webViewRef = useRef<any>(null);
  const [centerLat, setCenterLat] = useState(usuario?.latitude ?? DEFAULT_LOCATION.latitude);
  const [centerLon, setCenterLon] = useState(usuario?.longitude ?? DEFAULT_LOCATION.longitude);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [html, setHtml] = useState('');

  useEffect(() => {
    inicializar();
  }, []);

  async function inicializar() {
    let lat = usuario?.latitude ?? DEFAULT_LOCATION.latitude;
    let lon = usuario?.longitude ?? DEFAULT_LOCATION.longitude;

    // Se não tem casa salva, começa pela localização atual
    if (!usuario?.latitude) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      }
    }

    setCenterLat(lat);
    setCenterLon(lon);
    setHtml(gerarHTML(lat, lon, usuario?.latitude, usuario?.longitude));
    setCarregando(false);
  }

  function onMensagem(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'center') {
        setCenterLat(data.lat);
        setCenterLon(data.lon);
      }
    } catch {}
  }

  async function handleSalvar() {
    if (!usuario?.id) return;
    setSalvando(true);
    try {
      // Confirma marcador no mapa
      webViewRef.current?.injectJavaScript(`
        window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'confirmar' }) }));
        true;
      `);

      await updateDoc(doc(db, 'users', usuario.id), {
        latitude: centerLat,
        longitude: centerLon,
      });
      setUsuario({ ...usuario, latitude: centerLat, longitude: centerLon });

      Alert.alert(
        'Casa salva!',
        'Sua localização residencial foi salva com sucesso.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a localização.');
    } finally {
      setSalvando(false);
    }
  }

  async function usarLocalizacaoAtual() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Ative a localização nas configurações.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    setCenterLat(lat);
    setCenterLon(lon);
    webViewRef.current?.injectJavaScript(`
      map.setView([${lat}, ${lon}], 16);
      true;
    `);
  }

  return (
    <View style={styles.container}>
      {/* Instrução */}
      <View style={styles.instrucao}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
        <Text style={styles.instrucaoTexto}>
          Mova o mapa para centralizar o pino na sua casa e toque em <Text style={styles.bold}>Confirmar</Text>
        </Text>
      </View>

      {/* Mapa */}
      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          style={styles.mapa}
          source={{ html }}
          onMessage={onMensagem}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.centro}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
        />
      )}

      {/* Botões */}
      <View style={styles.rodape}>
        <TouchableOpacity style={styles.botaoSecundario} onPress={usarLocalizacaoAtual} activeOpacity={0.8}>
          <Ionicons name="navigate" size={18} color={Colors.primary} />
          <Text style={styles.botaoSecundarioTexto}>Usar minha localização</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botaoPrimario, salvando && styles.botaoDesabilitado]}
          onPress={handleSalvar}
          disabled={salvando}
          activeOpacity={0.8}
        >
          {salvando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="home" size={18} color="#fff" />
              <Text style={styles.botaoPrimarioTexto}>Confirmar localização</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  instrucao: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FDEDEC',
    padding: 14,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5B7B1',
  },
  instrucaoTexto: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  bold: { fontWeight: '700', color: Colors.primary },
  mapa: { flex: 1 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rodape: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  botaoSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    gap: 8,
  },
  botaoSecundarioTexto: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  botaoPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  botaoPrimarioTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
  botaoDesabilitado: { opacity: 0.6 },
});
