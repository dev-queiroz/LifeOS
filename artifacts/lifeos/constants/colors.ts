export const Colors = {
  bg: '#0A0F1E',
  bgCard: '#0F1629',
  bgElevated: '#151D35',
  bgMuted: '#1A2340',

  accent: '#3B82F6',
  accentGlow: '#60A5FA',
  accentDim: '#1D3A6B',

  cyan: '#22D3EE',
  cyanDim: '#0E4A5A',

  green: '#10B981',
  greenDim: '#064E3B',

  orange: '#F59E0B',
  orangeDim: '#5C3A00',

  red: '#EF4444',
  redDim: '#4B1313',

  purple: '#8B5CF6',
  purpleDim: '#2D1B69',

  pink: '#EC4899',
  pinkDim: '#5C1A3A',

  text: '#F0F4FF',
  textSecondary: '#8B9CC8',
  textMuted: '#4A5578',

  border: '#1E2D52',
  borderLight: '#253460',

  white: '#FFFFFF',
  black: '#000000',
};

export type AreaColor = {
  primary: string;
  dim: string;
  label: string;
};

export const AreaColors: Record<string, AreaColor> = {
  faculdade: { primary: Colors.cyan, dim: Colors.cyanDim, label: 'Faculdade' },
  ingles: { primary: Colors.green, dim: Colors.greenDim, label: 'Inglês' },
  programacao: { primary: Colors.purple, dim: Colors.purpleDim, label: 'Programação' },
  shape: { primary: Colors.orange, dim: Colors.orangeDim, label: 'Shape' },
  plano2031: { primary: Colors.accent, dim: Colors.accentDim, label: 'Plano 2031' },
};
