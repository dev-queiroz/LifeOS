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
  const h = heightM > 0 ? heightM : 1.75;
  return parseFloat((weight / (h * h)).toFixed(1));
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
  const [rpe, setRpe] = useState('7');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const dur = parseInt(duration);
    if (!dur || dur < 5) { Alert.alert('Duração mínima: 5 min'); return; }
    onSave({ 
      type, 
      duration: dur, 
      rpe: parseInt(rpe),
      date: new Date().toISOString(), 
      notes 
    });
    setDuration('60'); setNotes(''); setRpe('7');
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
          <Text style={styles.fieldLabel}>Esforço (RPE 1-10)</Text>
          <View style={styles.typeGrid}>
            {['1','2','3','4','5','6','7','8','9','10'].map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.platformChip, rpe === v && { backgroundColor: Colors.orange + '25', borderColor: Colors.orange }]}
                onPress={() => setRpe(v)}
              >
                <Text style={[styles.typeLabel, rpe === v && { color: Colors.orange }]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Principais Exercícios / Notas</Text>
          <TextInput style={[styles.input, { minHeight: 60 }]} value={notes} onChangeText={setNotes} placeholder="Supino, Agachamento..." multiline placeholderTextColor={Colors.textMuted} />
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

  const initialWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null;
  const currentWeightValue = weightLogs[0]?.weight ?? null;
  const weightDelta = (currentWeightValue !== null && initialWeight !== null) ? currentWeightValue - initialWeight : null;
  
  const targetWeight = settings.targetWeight ?? 70;
  const weightProgress = (currentWeightValue !== null && initialWeight !== null) 
    ? Math.min(100, Math.max(0, Math.round(((initialWeight - currentWeightValue) / (initialWeight - targetWeight)) * 100)))
    : 0;

  const currentBmi = currentWeightValue ? bmi(currentWeightValue, settings.height) : null;
  const workoutStreak = useMemo(() => calcWorkoutStreak(workoutLogs), [workoutLogs]);
  const todayWater = getTodayWater();
  const waterPct = Math.min(100, Math.round((todayWater / WATER_TARGET_ML) * 100));

  const workoutsThisWeek = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return workoutLogs.filter((w) => new Date(w.date) >= cutoff).length;
  }, [workoutLogs]);

  const scoreValue = Math.min(100, Math.round((workoutsThisWeek / 4) * 100));

  const handleQuickWorkout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addWorkoutLog({
      type: 'Musculação',
      duration: 60,
      date: new Date().toISOString(),
      notes: 'Check-in rápido'
    });
  };

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
            <View style={styles.statLine}>
              <View>
                <Text style={[styles.statVal, { color: Colors.orange }]}>
                  {currentWeightValue?.toFixed(1) ?? '—'} <Text style={styles.unit}>kg</Text>
                </Text>
                <Text style={styles.statLabel}>Peso Atual</Text>
              </View>
              {weightDelta !== null && (
                <View style={[styles.deltaBadge, { backgroundColor: weightDelta <= 0 ? Colors.green + '25' : Colors.red + '25' }]}>
                  <Feather name={weightDelta <= 0 ? "trending-down" : "trending-up"} size={12} color={weightDelta <= 0 ? Colors.green : Colors.red} />
                  <Text style={[styles.deltaText, { color: weightDelta <= 0 ? Colors.green : Colors.red }]}>
                    {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Meta: {targetWeight}kg</Text>
                <Text style={styles.progressValue}>{weightProgress}%</Text>
              </View>
              <ProgressBar value={weightProgress} color={Colors.orange} height={6} />
            </View>
          </View>
        </View>

        <View style={styles.quickStatsRow}>
          <View style={styles.quickStat}>
            <Text style={[styles.quickStatVal, currentBmi ? { color: bmiColor(currentBmi) } : {}]}>{currentBmi ?? '—'}</Text>
            <Text style={styles.quickStatLabel}>IMC ({currentBmi ? bmiLabel(currentBmi) : '—'})</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={[styles.quickStatVal, { color: Colors.purple }]}>{workoutStreak}d</Text>
            <Text style={styles.quickStatLabel}>Streak</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={[styles.quickStatVal, { color: Colors.cyan }]}>{(todayWater/1000).toFixed(1)}L</Text>
            <Text style={styles.quickStatLabel}>Água</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.orange }]} onPress={() => setWeightModal(true)}>
            <Feather name="scale" size={16} color={Colors.white} />
            <Text style={styles.actionBtnText}>Peso</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: Colors.orangeDim, borderWidth: 1, borderColor: Colors.orange }]} 
            onPress={handleQuickWorkout}
            onLongPress={() => setWorkoutModal(true)}
          >
            <Feather name="check-circle" size={16} color={Colors.orange} />
            <Text style={[styles.actionBtnText, { color: Colors.orange }]}>Check Treino</Text>
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
            {[250, 500, 1000].map((ml) => (
              <TouchableOpacity key={ml} style={[styles.waterBtn, { backgroundColor: Colors.cyanDim }]} onPress={() => handleAddWater(ml)}>
                <Feather name="droplet" size={14} color={Colors.cyan} />
                <Text style={styles.waterBtnText}>+{ml >= 1000 ? '1L' : `${ml}ml`}</Text>
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
                <Text style={styles.workoutType}>
                  {w.type}
                  {w.rpe ? <Text style={styles.workoutRpe}> · RPE {w.rpe}</Text> : ''}
                </Text>
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
          weightLogs.slice(0, 6).map((w, idx) => {
            const prev = weightLogs[idx + 1];
            const diff = prev ? w.weight - prev.weight : null;
            return (
              <View key={w.id} style={styles.weightRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.weightVal, { color: Colors.orange }]}>{w.weight.toFixed(1)} kg</Text>
                  <Text style={styles.weightDate}>{w.date.slice(0, 10)}</Text>
                </View>
                {diff !== null && (
                  <Text style={[styles.weightDiff, { color: diff <= 0 ? Colors.green : Colors.red }]}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}kg
                  </Text>
                )}
                <Text style={[styles.weightBmi, { color: bmiColor(bmi(w.weight)) }]}>IMC {bmi(w.weight)}</Text>
                <TouchableOpacity onPress={() => deleteWeightLog(w.id)} style={{ marginLeft: 10 }}>
                  <Feather name="trash-2" size={13} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })
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
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  mainStats: { flex: 1, gap: 12 },
  statLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statVal: { fontSize: 32, fontFamily: 'Inter_800ExtraBold' },
  unit: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted, textTransform: 'uppercase' },
  deltaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  deltaText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  progressSection: { gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  progressValue: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.orange },
  quickStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickStat: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 2 },
  quickStatVal: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  quickStatLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.textMuted, textAlign: 'center' },
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
  workoutRpe: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  workoutMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  workoutRight: { alignItems: 'flex-end', gap: 4 },
  workoutDate: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
  weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bgCard, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  weightVal: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  weightDiff: { fontSize: 13, fontFamily: 'Inter_700Bold', marginRight: 10 },
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
  platformChip: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  typeLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 15 },
  saveBtn: { backgroundColor: Colors.orange, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
});
