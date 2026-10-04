import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Colors } from '../constants';

interface Props {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
  variante?: 'primario' | 'secundario' | 'perigo';
  style?: ViewStyle;
}

export default function BotaoPrimario({
  titulo,
  onPress,
  carregando = false,
  desabilitado = false,
  variante = 'primario',
  style,
}: Props) {
  const bgColor =
    variante === 'secundario'
      ? 'transparent'
      : variante === 'perigo'
      ? Colors.danger
      : Colors.primary;

  const textColor = variante === 'secundario' ? Colors.primary : '#fff';

  const borderColor = variante === 'secundario' ? Colors.primary : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.botao,
        { backgroundColor: bgColor, borderColor, borderWidth: variante === 'secundario' ? 1.5 : 0 },
        desabilitado && styles.desabilitado,
        style,
      ]}
      onPress={onPress}
      disabled={desabilitado || carregando}
      activeOpacity={0.8}
    >
      {carregando ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.texto, { color: textColor }]}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  texto: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  desabilitado: {
    opacity: 0.5,
  },
});
