import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SidebarToggle } from '@/components/Sidebar';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

const ITEMS = [
  { label: 'Notas & Journal', icon: 'file-text', color: Colors.accent, desc: 'Editor Markdown' },
  { label: 'Finanças', icon: 'dollar-sign', color: Colors.green, desc: 'Entradas e saídas' },
  { label: 'Freela', icon: 'briefcase', color: Colors.orange, desc: 'Pipeline de clientes' },
  { label: 'Configurações', icon: 'settings', color: Colors.textSecondary, desc: 'Preferências do app' },
];

export default function MaisScreen() {
  const insets = useSafeAreaInsets();
  const { settings } = useApp();
  const [pin, setPin] = React.useState('');
  const [locked, setLocked] = React.useState(!!settings.pin);

  if (locked) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 100, alignItems: 'center', paddingHorizontal: 40 }]}>
        <Feather name="lock" size={48} color={Colors.textMuted} style={{ marginBottom: 20 }} />
        <Text style={[styles.title, { marginBottom: 10 }]}>Acesso Restrito</Text>
        <Text style={[styles.itemDesc, { textAlign: 'center', marginBottom: 30 }]}>Digite seu PIN para acessar ferramentas sensíveis.</Text>
        
        <TextInput
          style={[styles.input, { width: '100%', textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
          value={pin}
          onChangeText={(v) => {
            setPin(v);
            if (v.length === (settings.pin?.length || 4) && v === settings.pin) {
              setLocked(false);
            }
          }}
          keyboardType="numeric"
          secureTextEntry
          maxLength={settings.pin?.length || 4}
          autoFocus
        />
        
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: Colors.textMuted, fontFamily: 'Inter_500Medium' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}
      >
        <View style={styles.header}>
          <SidebarToggle color={Colors.textSecondary} />
          <Text style={styles.title}>Mais</Text>
        </View>

        {ITEMS.map((item) => (
          <TouchableOpacity 
            key={item.label} 
            style={styles.item} 
            activeOpacity={0.7}
            onPress={() => {
              if (item.label === 'Configurações') router.push('/settings' as any);
              if (item.label === 'Finanças') router.push('/financas' as any);
              // Outras rotas seriam adicionadas aqui
            }}
          >
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
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, color: Colors.text, fontFamily: 'Inter_400Regular' },
});
