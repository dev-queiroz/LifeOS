import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  borderRadius?: number;
}

export function ProgressBar({ value, max = 100, color = Colors.accent, height = 6, borderRadius = 4 }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={[styles.track, { height, borderRadius }]}>
      <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: color, borderRadius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: Colors.bgMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
