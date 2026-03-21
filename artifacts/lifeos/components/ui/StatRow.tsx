import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

interface StatItem {
  label: string;
  value: string;
  color?: string;
}

interface StatRowProps {
  items: StatItem[];
}

export function StatRow({ items }: StatRowProps) {
  return (
    <View style={styles.row}>
      {items.map((item, i) => (
        <View key={i} style={styles.item}>
          <Text style={[styles.value, { color: item.color || Colors.text }]}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  item: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  value: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
