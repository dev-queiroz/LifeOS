import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import type { QualityLevel, Session, SessionType } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';

interface QuickSessionModalProps {
  visible: boolean;
  onClose: () => void;
  defaultType?: SessionType;
}

const SESSION_TYPES: { type: SessionType; label: string; color: string }[] = [
  { type: 'faculdade', label: 'Faculdade', color: Colors.cyan },
  { type: 'ingles', label: 'Inglês', color: Colors.green },
  { type: 'programacao', label: 'Prog.', color: Colors.purple },
  { type: 'shape', label: 'Shape', color: Colors.orange },
  { type: 'geral', label: 'Geral', color: Colors.accent },
];

export function QuickSessionModal({ visible, onClose, defaultType = 'geral' }: QuickSessionModalProps) {
  const { addSession, settings } = useApp();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<SessionType>(defaultType);
  const [duration, setDuration] = useState(30);
  const [quality, setQuality] = useState<QualityLevel>(3);
  const [output, setOutput] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const session: Session = {
      id: genId(),
      type,
      duration,
      quality,
      output,
      notes,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    await addSession(session);
    setOutput('');
    setNotes('');
    setDuration(30);
    setQuality(3);
    onClose();
  };

  const adjustDuration = (delta: number) => {
    setDuration((prev) => Math.max(5, Math.min(480, prev + delta)));
    if (settings.haptics) Haptics.selectionAsync();
  };

  const selectedType = SESSION_TYPES.find((t) => t.type === type);

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Nova Sessao</Text>
            <Pressable onPress={onClose} style={styles.close}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Tipo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {SESSION_TYPES.map((t) => (
                <Pressable
                  key={t.type}
                  onPress={() => { setType(t.type); if (settings.haptics) Haptics.selectionAsync(); }}
                  style={[
                    styles.typeChip,
                    { borderColor: t.color },
                    type === t.type && { backgroundColor: t.color + '30' },
                  ]}
                >
                  <Text style={[styles.typeChipText, { color: type === t.type ? t.color : Colors.textSecondary }]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>Duracao (min)</Text>
            <View style={styles.durationRow}>
              {[5, 15].map((d) => (
                <Pressable key={`-${d}`} onPress={() => adjustDuration(-d)} style={styles.durationBtn}>
                  <Text style={styles.durationBtnText}>-{d}</Text>
                </Pressable>
              ))}
              <View style={styles.durationDisplay}>
                <Text style={[styles.durationValue, { color: selectedType?.color || Colors.accent }]}>
                  {duration}
                </Text>
                <Text style={styles.durationUnit}>min</Text>
              </View>
              {[5, 15].map((d) => (
                <Pressable key={`+${d}`} onPress={() => adjustDuration(d)} style={styles.durationBtn}>
                  <Text style={styles.durationBtnText}>+{d}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Qualidade</Text>
            <View style={styles.qualityRow}>
              {([1, 2, 3, 4, 5] as QualityLevel[]).map((q) => (
                <Pressable
                  key={q}
                  onPress={() => { setQuality(q); if (settings.haptics) Haptics.selectionAsync(); }}
                  style={[
                    styles.qualityBtn,
                    quality === q && { backgroundColor: selectedType?.color || Colors.accent },
                  ]}
                >
                  <Text style={[styles.qualityText, quality === q && { color: Colors.white }]}>{q}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Output / Resultado</Text>
            <TextInput
              style={styles.input}
              value={output}
              onChangeText={setOutput}
              placeholder="O que voce produziu?"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.sectionLabel}>Notas (opcional)</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="Observacoes..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={2}
            />

            <Pressable onPress={handleSave} style={[styles.saveBtn, { backgroundColor: selectedType?.color || Colors.accent }]}>
              <Text style={styles.saveBtnText}>Salvar Sessao</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  typeScroll: {
    flexDirection: 'row',
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    borderColor: Colors.border,
  },
  typeChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  durationBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.bgMuted,
  },
  durationBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  durationDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  durationValue: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
  },
  durationUnit: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    paddingTop: 10,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  qualityBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.bgMuted,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
  },
});
