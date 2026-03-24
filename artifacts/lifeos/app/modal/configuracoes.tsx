import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

export default function SettingsModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useApp();

  const [name, setName] = useState(settings.name ?? 'Douglas');
  const [targetWeight, setTargetWeight] = useState(settings.targetWeight?.toString() ?? '');
  const [height, setHeight] = useState(settings.height?.toString() ?? '');
  const [reserveTarget, setReserveTarget] = useState(settings.reserveTarget?.toString() ?? '');
  const [pin, setPin] = useState(settings.pin ?? '');
  const [confirmPin, setConfirmPin] = useState('');

  const handleSave = () => {
    // Validação do PIN
    if (pin.length > 0 && pin.length !== 4) {
      Alert.alert('PIN inválido', 'O PIN deve ter exatamente 4 dígitos ou ficar vazio.');
      return;
    }
    if (pin.length === 4 && pin !== confirmPin) {
      Alert.alert('PIN não confere', 'Os dois PINs devem ser iguais.');
      return;
    }

    updateSettings({
      name: name.trim() || 'Douglas',
      targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
      height: height ? parseFloat(height) : undefined,
      reserveTarget: reserveTarget ? parseFloat(reserveTarget) : undefined,
      pin: pin.length === 4 ? pin : undefined,
    });

    Alert.alert('✅ Sucesso', 'Configurações salvas com sucesso!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
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
        {/* Perfil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Seu Nome</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Como quer ser chamado?"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        {/* Saúde e Corpo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saúde & Corpo</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Peso Meta (kg)</Text>
            <TextInput
              style={styles.input}
              value={targetWeight}
              onChangeText={setTargetWeight}
              keyboardType="numeric"
              placeholder="Ex: 78.5"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Altura (metros)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="Ex: 1.78"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        {/* Finanças */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finanças</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Meta de Reserva (R$)</Text>
            <TextInput
              style={styles.input}
              value={reserveTarget}
              onChangeText={setReserveTarget}
              keyboardType="numeric"
              placeholder="Ex: 80000"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        {/* Segurança */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Segurança</Text>
          <View style={styles.field}>
            <Text style={styles.label}>PIN de Acesso (4 dígitos)</Text>
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={(v) => {
                const clean = v.replace(/[^0-9]/g, '');
                if (clean.length <= 4) setPin(clean);
              }}
              keyboardType="numeric"
              placeholder="Deixe vazio para desativar"
              placeholderTextColor={Colors.textMuted}
              maxLength={4}
              secureTextEntry
            />
          </View>

          {pin.length === 4 && (
            <View style={styles.field}>
              <Text style={styles.label}>Confirme o PIN</Text>
              <TextInput
                style={styles.input}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                placeholder="Digite o PIN novamente"
                placeholderTextColor={Colors.textMuted}
                maxLength={4}
                secureTextEntry
              />
            </View>
          )}
        </View>

        {/* Preferências */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => updateSettings({ haptics: !settings.haptics })}
          >
            <View style={styles.settingInfo}>
              <Feather name="zap" size={20} color={settings.haptics ? Colors.accent : Colors.textMuted} />
              <Text style={styles.settingLabel}>Vibração (Haptics)</Text>
            </View>
            <View style={[styles.toggle, settings.haptics && styles.toggleActive]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => updateSettings({ quickMode: !settings.quickMode })}
          >
            <View style={styles.settingInfo}>
              <Feather name="clock" size={20} color={settings.quickMode ? Colors.accent : Colors.textMuted} />
              <Text style={styles.settingLabel}>Modo Rápido (entrada em até 8s)</Text>
            </View>
            <View style={[styles.toggle, settings.quickMode && styles.toggleActive]} />
          </TouchableOpacity>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Salvar Todas as Alterações</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>LifeOS • Versão 2.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text },
  closeBtn: { padding: 6 },

  content: { padding: 20 },

  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  field: { marginBottom: 18 },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text },

  toggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: Colors.green,
  },

  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },

  footer: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
