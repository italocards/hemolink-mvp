import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NivelUrgencia } from '../types';
import { URGENCIA_LABELS, URGENCIA_COLORS } from '../constants';

interface Props {
  urgencia: NivelUrgencia;
}

export default function UrgenciaBadge({ urgencia }: Props) {
  const cor = URGENCIA_COLORS[urgencia] ?? '#999';
  const label = URGENCIA_LABELS[urgencia] ?? urgencia;

  return (
    <View style={[styles.badge, { backgroundColor: cor }]}>
      <Text style={styles.texto}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  texto: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
