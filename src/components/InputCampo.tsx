import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';

interface Props extends TextInputProps {
  label: string;
  erro?: string;
  iconLeft?: React.ComponentProps<typeof Ionicons>['name'];
  senha?: boolean;
}

export default function InputCampo({ label, erro, iconLeft, senha = false, ...rest }: Props) {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, erro ? styles.inputErro : null]}>
        {iconLeft && (
          <Ionicons name={iconLeft} size={18} color={Colors.textLight} style={styles.iconLeft} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textLight}
          secureTextEntry={senha && !mostrarSenha}
          autoCapitalize="none"
          {...rest}
        />
        {senha && (
          <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)} style={styles.iconRight}>
            <Ionicons
              name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Colors.textLight}
            />
          </TouchableOpacity>
        )}
      </View>
      {erro ? <Text style={styles.textoErro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
  },
  inputErro: { borderColor: Colors.danger },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  textoErro: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
