export { Colors } from './colors';

export const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const URGENCIA_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const URGENCIA_COLORS: Record<string, string> = {
  baixa: '#16A34A',
  media: '#D97706',
  alta: '#EA580C',
  critica: '#DC2626',
};

export const URGENCIA_LIGHT_COLORS: Record<string, string> = {
  baixa: '#DCFCE7',
  media: '#FEF3C7',
  alta: '#FFEDD5',
  critica: '#FEE2E2',
};

// Localização padrão: Fortaleza-CE
export const DEFAULT_LOCATION = {
  latitude: -3.7327,
  longitude: -38.5270,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
