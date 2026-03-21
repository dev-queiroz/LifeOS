import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import type { QualityLevel, SessionType } from '@/constants/types';
import { useApp } from '@/context/AppContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultType?: SessionType;
}

const TYPES: { key: SessionType; label: string; color: string; icon: string }[] = [
  { key: 'faculdade', label: 'Faculdade', color: Colors.cyan, icon: 'book' },
  { key: 'ingles', label: 'Inglês', color: Colors.green, icon: 'mic' },
  { key: 'programacao', label: 'Programação', color: Colors.purple, icon: 'code' },
  { key: 'shape', label: 'Shape', color: Colors.orange, icon: 'activity' },
  { key: 'geral', label: 'Geral', color: Colors.accent, icon: 'zap' },
];

const QUALITY_LABELS: Record<number, string> = {
  1: 'Péssimo', 2: 'Ruim', 3: 'Fraco', 4: 'Regular', 5: 'Médio',
  6: 'Bom', 7: 'Ótimo', 8: 'Excelente', 9: 'Incrível', 10: 'Perfeito',
};

export function QuickSessionModal({ visible, onClose, defaultType = 'geral' }: Props) {
  const { addSession, settings } = useApp();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<SessionType>(defaultType);
  const [duration, setDuration] = useState(30);
  const [quality, setQuality] = useState<QualityLevel>(7);
  const [output, setOutput] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedType = TYPES.find((t) => t.key === type) ?? TYPES[0];

  const handleSave = async () => {
    setSaving(true);
    const result = await addSession({
      type,
      duration,
      quality,
      output,
      notes: '',
      date: new Date().toISOString(),
    });
    setSaving(false);
    if (result.error) {
      Alert.alert('Sessão inválida', result.error);
      return;
    }
    if (settings.haptics && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setOutput('');
    setDuration(30);
    setQuality(7);
    setType(defaultType);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Sessão Rápida</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>Tipo</Text>
          <View style={styles.typeRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeChip, type === t.key && { backgroundColor: t.color + '25', borderColor: t.color }]}
                onPress={() => setType(t.key)}
                activeOpacity={0.7}
              >
                <Feather name={t.icon as never} size={14} color={type === t.key ? t.color : Colors.textMuted} />
                <Text style={[styles.typeLabel, type === t.key && { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Duração: {duration} min</Text>
          <View style={styles.durationRow}>
            {[15, 25, 30, 45, 60, 90, 120].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.durationChip, duration === d && { backgroundColor: selectedType.color + '25', borderColor: selectedType.color }]}
                onPress={() => setDuration(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.durationLabel, duration === d && { color: selectedType.color }]}>{d}m</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.distractionRow}>
            <TouchableOpacity style={styles.distractionBtn} onPress={() => setDuration((d) => Math.max(5, d - 5))}>
              <Feather name="minus" size={14} color={Colors.orange} />
              <Text style={styles.distractionLabel}>-5 Distração</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.distractionBtn} onPress={() => setDuration((d) => Math.max(5, d - 15))}>
              <Feather name="minus-circle" size={14} color={Colors.orange} />
              <Text style={styles.distractionLabel}>-15 Distração</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>
            Qualidade: {quality}/10 — {QUALITY_LABELS[quality]}
          </Text>
          <View style={styles.qualityRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((q) => (
              <TouchableOpacity
                key={q}
                style={[
                  styles.qualityDot,
                  {
                    backgroundColor:
                      quality >= q
                        ? q <= 3 ? Colors.red : q <= 6 ? Colors.orange : Colors.green
                        : Colors.bgMuted,
                  },
                ]}
                onPress={() => setQuality(q as QualityLevel)}
                activeOpacity={0.7}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Output (o que produziu?)</Text>
          <TextInput
            style={styles.outputInput}
            placeholder="Ex: Resumi capítulo 3, 2 exercícios..."
            placeholderTextColor={Colors.textMuted}
            value={output}
            onChangeText={setOutput}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: selectedType.color }, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Feather name="check" size={18} color={Colors.white} />
            <Text style={styles.saveBtnText}>Salvar Sessão</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text },
  closeBtn: { padding: 8 },
  content: { padding: 20, gap: 12 },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  typeLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  durationLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  distractionRow: { flexDirection: 'row', gap: 8 },
  distractionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.orangeDim, borderWidth: 1, borderColor: Colors.orange + '40' },
  distractionLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.orange },
  qualityRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  qualityDot: { flex: 1, height: 28, borderRadius: 6 },
  outputInput: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
});
