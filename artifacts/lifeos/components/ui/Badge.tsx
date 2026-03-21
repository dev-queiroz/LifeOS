import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color = Colors.accent, bg = Colors.accentDim, size = 'sm' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'md' && styles.badgeMd]}>
      <Text style={[styles.text, { color }, size === 'md' && styles.textMd]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  textMd: {
    fontSize: 12,
  },
});
