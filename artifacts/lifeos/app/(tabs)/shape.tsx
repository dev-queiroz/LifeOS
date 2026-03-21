import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
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

import { SidebarToggle } from '@/components/Sidebar';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlowCard } from '@/components/ui/GlowCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Colors } from '@/constants/colors';
import type { WeightLog, WorkoutLog } from '@/constants/types';
import { useApp } from '@/context/AppContext';
import { calcWorkoutStreak } from '@/services/score';

const WORKOUT_TYPES = ['Musculação', 'Corrida', 'Ciclismo', 'HIIT', 'Yoga', 'Natação', 'Outros'];
const WATER_TARGET_ML = 3000;

function bmi(weight: number, heightM = 1.75): number {
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
}

function bmiLabel(b: number): string {
  if (b < 18.5) return 'Abaixo do peso';
  if (b < 25) return 'Normal';
  if (b < 30) return 'Sobrepeso';
  return 'Obesidade';
}

function bmiColor(b: number): string {
  if (b < 18.5) return Colors.cyan;
  if (b < 25) return Colors.green;
  if (b < 30) return Colors.orange;
  return Colors.red;
}

function WeightModal({ visible, onClose, onSave }: {
  visible: boolean; onClose: () => void; onSave: (w: Omit<WeightLog, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const w = parseFloat(weight);
    if (!w || w < 30 || w > 300) { Alert.alert('Peso inválido (30-300kg)'); return; }
    onSave({ weight: w, date: new Date().toISOString(), notes });
    setWeight(''); setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Registrar Peso</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          <Text style={styles.fieldLabel}>Peso (kg)</Text>
          <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="Ex: 75.5" placeholderTextColor={Colors.textMuted} autoFocus />
          <Text style={styles.fieldLabel}>Observações</Text>
          <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Opcional" placeholderTextColor={Colors.textMuted} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Salvar Peso</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function WorkoutModal({ visible, onClose, onSave }: {
  visible: boolean; onClose: () => void; onSave: (w: Omit<WorkoutLog, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState('Musculação');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const dur = parseInt(duration);
    if (!dur || dur < 5) { Alert.alert('Duração mínima: 5 min'); return; }
    onSave({ type, duration: dur, date: new Date().toISOString(), notes });
    setDuration('60'); setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Registrar Treino</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.fieldLabel}>Tipo</Text>
          <View style={styles.typeGrid}>
            {WORKOUT_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type === t && { backgroundColor: Colors.orange + '25', borderColor: Colors.orange }]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeLabel, type === t && { color: Colors.orange }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Duração (min)</Text>
          <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Notas</Text>
          <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Opcional" placeholderTextColor={Colors.textMuted} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Salvar Treino</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ShapeScreen() {
  const insets = useSafeAreaInsets();
  const { weightLogs, addWeightLog, deleteWeightLog, workoutLogs, addWorkoutLog, deleteWorkoutLog, addWaterLog, getTodayWater, settings } = useApp();
  const [weightModal, setWeightModal] = useState(false);
  const [workoutModal, setWorkoutModal] = useState(false);

  const currentWeight = weightLogs[0]?.weight ?? null;
  const currentBmi = currentWeight ? bmi(currentWeight) : null;
  const workoutStreak = useMemo(() => calcWorkoutStreak(workoutLogs), [workoutLogs]);
  const todayWater = getTodayWater();
  const waterPct = Math.min(100, Math.round((todayWater / WATER_TARGET_ML) * 100));

  const workoutsThisWeek = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return workoutLogs.filter((w) => new Date(w.date) >= cutoff).length;
  }, [workoutLogs]);

  const scoreValue = Math.min(100, Math.round((workoutsThisWeek / 4) * 100));

  const handleAddWater = (ml: number) => {
    if (settings.haptics && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addWaterLog(ml);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}
      >
        <View style={styles.header}>
          <SidebarToggle color={Colors.orange} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: Colors.orange }]}>Shape & Saúde</Text>
            <Text style={styles.subtitle}>Streak: {workoutStreak} dias · {workoutsThisWeek}/4 treinos/sem</Text>
          </View>
        </View>

        <View style={styles.mainRow}>
          <ScoreRing value={scoreValue} size={100} color={Colors.orange} />
          <View style={styles.mainStats}>
            <View style={styles.statBlock}>
              <Text style={[styles.statVal, currentBmi !== null ? { color: bmiColor(currentBmi) } : { color: Colors.textMuted }]}>
                {currentWeight?.toFixed(1) ?? '—'}
              </Text>
              <Text style={styles.statLabel}>Peso kg</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={[styles.statVal, currentBmi !== null ? { color: bmiColor(currentBmi) } : { color: Colors.textMuted }]}>
                {currentBmi ?? '—'}
              </Text>
              <Text style={styles.statLabel}>IMC — {currentBmi ? bmiLabel(currentBmi) : '—'}</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={[styles.statVal, { color: Colors.orange }]}>{workoutStreak}d</Text>
              <Text style={styles.statLabel}>Streak treino</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.orange }]} onPress={() => setWeightModal(true)}>
            <Feather name="trending-down" size={16} color={Colors.white} />
            <Text style={styles.actionBtnText}>Peso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.orangeDim, borderWidth: 1, borderColor: Colors.orange }]} onPress={() => setWorkoutModal(true)}>
            <Feather name="activity" size={16} color={Colors.orange} />
            <Text style={[styles.actionBtnText, { color: Colors.orange }]}>Treino</Text>
          </TouchableOpacity>
        </View>

        <GlowCard color={Colors.cyan}>
          <View style={styles.waterHeader}>
            <Text style={styles.waterTitle}>Hidratação</Text>
            <Text style={[styles.waterPct, { color: waterPct >= 100 ? Colors.green : Colors.cyan }]}>
              {(todayWater / 1000).toFixed(1)}L / {WATER_TARGET_ML / 1000}L
            </Text>
          </View>
          <ProgressBar value={waterPct} color={Colors.cyan} height={10} />
          <View style={styles.waterBtns}>
            {[250, 500].map((ml) => (
              <TouchableOpacity key={ml} style={[styles.waterBtn, { backgroundColor: Colors.cyanDim }]} onPress={() => handleAddWater(ml)}>
                <Feather name="droplet" size={14} color={Colors.cyan} />
                <Text style={styles.waterBtnText}>+{ml}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlowCard>

        <Text style={styles.sectionTitle}>Histórico Treinos</Text>
        {workoutLogs.length === 0 ? (
          <EmptyState icon="activity" title="Nenhum treino" description="Registre seus treinos para acompanhar o progresso." color={Colors.orange} />
        ) : (
          workoutLogs.slice(0, 8).map((w) => (
            <View key={w.id} style={styles.workoutRow}>
              <View style={[styles.workoutIcon, { backgroundColor: Colors.orangeDim }]}>
                <Feather name="activity" size={14} color={Colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutType}>{w.type}</Text>
                <Text style={styles.workoutMeta}>{w.duration}min{w.notes ? ` · ${w.notes}` : ''}</Text>
              </View>
              <View style={styles.workoutRight}>
                <Text style={styles.workoutDate}>{w.date.slice(5, 10)}</Text>
                <TouchableOpacity onPress={() => {
                  Alert.alert('Remover', 'Remover esse treino?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Remover', style: 'destructive', onPress: () => deleteWorkoutLog(w.id) },
                  ]);
                }}>
                  <Feather name="trash-2" size={13} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Histórico Peso</Text>
        {weightLogs.length === 0 ? (
          <EmptyState icon="trending-down" title="Nenhum registro" description="Registre seu peso diariamente." color={Colors.orange} />
        ) : (
          weightLogs.slice(0, 6).map((w) => (
            <View key={w.id} style={styles.weightRow}>
              <Text style={[styles.weightVal, { color: Colors.orange }]}>{w.weight.toFixed(1)} kg</Text>
              <Text style={styles.weightDate}>{w.date.slice(0, 10)}</Text>
              <Text style={[styles.weightBmi, { color: bmiColor(bmi(w.weight)) }]}>IMC {bmi(w.weight)}</Text>
              <TouchableOpacity onPress={() => deleteWeightLog(w.id)}>
                <Feather name="trash-2" size={13} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <WeightModal visible={weightModal} onClose={() => setWeightModal(false)} onSave={(w) => addWeightLog(w)} />
      <WorkoutModal visible={workoutModal} onClose={() => setWorkoutModal(false)} onSave={(w) => addWorkoutLog(w)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  mainStats: { flex: 1, gap: 10 },
  statBlock: {},
  statVal: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { color: Colors.white, fontSize: 14, fontFamily: 'Inter_700Bold' },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  waterTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text },
  waterPct: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  waterBtns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  waterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  waterBtnText: { color: Colors.cyan, fontSize: 14, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 10, marginTop: 16 },
  workoutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  workoutIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  workoutType: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  workoutMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  workoutRight: { alignItems: 'flex-end', gap: 4 },
  workoutDate: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
  weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bgCard, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  weightVal: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  weightDate: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
  weightBmi: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  modal: { flex: 1, backgroundColor: Colors.bg },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text },
  modalContent: { padding: 20, gap: 12 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  typeLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 15 },
  saveBtn: { backgroundColor: Colors.orange, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
});
