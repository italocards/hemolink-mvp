export { Colors } from './colors';

export const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const URGENCIA_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const URGENCIA_COLORS: Record<string, string> = {
  baixa: '#27AE60',
  media: '#F39C12',
  alta: '#E67E22',
  critica: '#C0392B',
};

// Localização padrão: Fortaleza-CE (para mock)
export const DEFAULT_LOCATION = {
  latitude: -3.7327,
  longitude: -38.5270,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
