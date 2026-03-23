import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

export default function SettingsModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useApp();
  
  const [targetWeight, setTargetWeight] = useState(settings.targetWeight?.toString() ?? '');
  const [height, setHeight] = useState(settings.height?.toString() ?? '');
  const [reserveTarget, setReserveTarget] = useState(settings.reserveTarget?.toString() ?? '');

  const handleSave = () => {
    updateSettings({
      targetWeight: parseFloat(targetWeight) || undefined,
      height: parseFloat(height) || undefined,
      reserveTarget: parseFloat(reserveTarget) || undefined,
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Configurações</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil & Saúde</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Peso Meta (kg)</Text>
            <TextInput 
              style={styles.input} 
              value={targetWeight} 
              onChangeText={setTargetWeight} 
              keyboardType="numeric" 
              placeholder="Ex: 75" 
              placeholderTextColor={Colors.textMuted} 
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Altura (m)</Text>
            <TextInput 
              style={styles.input} 
              value={height} 
              onChangeText={setHeight} 
              keyboardType="numeric" 
              placeholder="Ex: 1.80" 
              placeholderTextColor={Colors.textMuted} 
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Meta de Reserva (R$)</Text>
            <TextInput 
              style={styles.input} 
              value={reserveTarget} 
              onChangeText={setReserveTarget} 
              keyboardType="numeric" 
              placeholder="Ex: 50000" 
              placeholderTextColor={Colors.textMuted} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => updateSettings({ haptics: !settings.haptics })}
          >
            <View style={styles.settingInfo}>
              <Feather name="zap" size={18} color={settings.haptics ? Colors.accent : Colors.textMuted} />
              <Text style={styles.settingLabel}>Haptics (Vibração)</Text>
            </View>
            <View style={[styles.toggle, settings.haptics && styles.toggleOn]} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => updateSettings({ quickMode: !settings.quickMode })}
          >
            <View style={styles.settingInfo}>
              <Feather name="clock" size={18} color={settings.quickMode ? Colors.accent : Colors.textMuted} />
              <Text style={styles.settingLabel}>Modo Rápido</Text>
            </View>
            <View style={[styles.toggle, settings.quickMode && styles.toggleOn]} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Salvar Alterações</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>LifeOS v2.0.26 • Build 159</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  closeBtn: { padding: 4 },
  content: { padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.accent, textTransform: 'uppercase', marginBottom: 16, letterSpacing: 0.5 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border + '50' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.border, padding: 2 },
  toggleOn: { backgroundColor: Colors.green },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 10, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
  footerNote: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 40, textAlign: 'center' },
});
