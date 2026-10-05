import React from 'react';
import InputCampo from './InputCampo';

interface Props {
  label: string;
  value: string;
  onChangeText: (valor: string) => void;
  erro?: string;
}

function formatarData(texto: string): string {
  // Remove tudo que não for número
  const numeros = texto.replace(/\D/g, '');

  // Aplica máscara DD/MM/AAAA progressivamente
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
}

export default function InputData({ label, value, onChangeText, erro }: Props) {
  function handleChange(texto: string) {
    // Se o usuário apagou uma barra, remove o número anterior também
    // para não travar o cursor
    const formatado = formatarData(texto);
    onChangeText(formatado);
  }

  return (
    <InputCampo
      label={label}
      placeholder="DD/MM/AAAA"
      value={value}
      onChangeText={handleChange}
      keyboardType="numeric"
      maxLength={10}
      iconLeft="calendar-outline"
      erro={erro}
    />
  );
}
