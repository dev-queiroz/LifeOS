import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';

interface GlowCardProps {
  children: React.ReactNode;
  color?: string;
  onPress?: () => void;
  style?: object;
  padding?: number;
}

export function GlowCard({ children, color = Colors.accent, onPress, style, padding = 16 }: GlowCardProps) {
  const content = (
    <View style={[styles.card, { borderColor: color + '30', padding }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
});
