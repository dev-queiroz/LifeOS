import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SidebarToggle } from '@/components/Sidebar';
import { Colors } from '@/constants/colors';

const ITEMS = [
  { label: 'Notas & Journal', icon: 'file-text', color: Colors.accent, desc: 'Editor Markdown' },
  { label: 'Finanças', icon: 'dollar-sign', color: Colors.green, desc: 'Entradas e saídas' },
  { label: 'Freela', icon: 'briefcase', color: Colors.orange, desc: 'Pipeline de clientes' },
  { label: 'Configurações', icon: 'settings', color: Colors.textSecondary, desc: 'Preferências do app' },
];

export default function MaisScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}
      >
        <View style={styles.header}>
          <SidebarToggle />
          <Text style={styles.title}>Mais</Text>
        </View>

        {ITEMS.map((item) => (
          <TouchableOpacity key={item.label} style={styles.item} activeOpacity={0.7}>
            <View style={[styles.itemIcon, { backgroundColor: item.color + '20' }]}>
              <Feather name={item.icon as never} size={20} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  itemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  itemDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
});
