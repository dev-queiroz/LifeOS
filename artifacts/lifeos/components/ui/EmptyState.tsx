import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  description?: string;
  color?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, description, color, actionLabel, onAction }: EmptyStateProps) {
  const displaySubtitle = subtitle || description;
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, color ? { backgroundColor: color + '20' } : {}]}>
        <Feather name={icon} size={32} color={color || Colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {displaySubtitle ? <Text style={styles.subtitle}>{displaySubtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  action: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.accentDim,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.accentGlow,
  },
});
