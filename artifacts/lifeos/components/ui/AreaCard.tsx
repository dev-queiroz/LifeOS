import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

interface AreaCardProps {
  label: string;
  value: number;
  color: string;
  colorDim: string;
  icon?: React.ReactNode;
  subtitle?: string;
  onPress?: () => void;
}

export function AreaCard({ label, value, color, colorDim, icon, subtitle, onPress }: AreaCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderColor: colorDim, opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colorDim }]}>
        {icon}
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.scoreWrap}>
        <Text style={[styles.score, { color }]}>{value}</Text>
        <Text style={styles.scoreMax}>/100</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  score: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  scoreMax: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    paddingBottom: 3,
  },
});
