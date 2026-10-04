import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TipoSanguineo } from '../types';
import { Colors } from '../constants';

interface Props {
  tipo: TipoSanguineo;
  tamanho?: 'pequeno' | 'medio' | 'grande';
}

export default function TipoSanguineoTag({ tipo, tamanho = 'medio' }: Props) {
  const fontSize = tamanho === 'pequeno' ? 13 : tamanho === 'grande' ? 22 : 17;
  const padding = tamanho === 'pequeno' ? 6 : tamanho === 'grande' ? 16 : 10;

  return (
    <View style={[styles.container, { padding }]}>
      <Text style={[styles.texto, { fontSize }]}>{tipo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
