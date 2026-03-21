import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { GlowCard } from '@/components/ui/GlowCard';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatRow } from '@/components/ui/StatRow';
import { Colors } from '@/constants/colors';
import type { WeightLog, WorkoutLog } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';

const WORKOUT_TYPES = ['Musculacao', 'Corrida', 'Ciclismo', 'HIIT', 'Yoga', 'Natacao', 'Outros'];

export default function ShapeScreen() {
  const insets = useSafeAreaInsets();
  const { weightLogs, addWeightLog, deleteWeightLog, workoutLogs, addWorkoutLog, deleteWorkoutLog, settings } = useApp();

  const [showAddWeight, setShowAddWeight] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [weightNotes, setWeightNotes] = useState('');

  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [workoutType, setWorkoutType] = useState('Musculacao');
  const [workoutDuration, setWorkoutDuration] = useState('60');
  const [workoutNotes, setWorkoutNotes] = useState('');

  const lastWeight = weightLogs[0]?.weight ?? null;
  const firstWeight = weightLogs[weightLogs.length - 1]?.weight ?? null;
  const weightDelta = lastWeight && firstWeight ? (lastWeight - firstWeight).toFixed(1) : null;

  const workoutStreak = (() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (workoutLogs.some((w) => w.date === ds)) streak++;
      else break;
    }
    return streak;
  })();

  const weekWorkouts = workoutLogs.filter((w) => {
    const d = new Date(w.date);
    const week = new Date();
    week.setDate(week.getDate() - 7);
    return d >= week;
  }).length;

  const shapeScore = Math.min(100, Math.round((weekWorkouts / 4) * 100));
  const bmi = lastWeight ? (lastWeight / (1.78 * 1.78)).toFixed(1) : null;

  const handleAddWeight = async () => {
    const w = parseFloat(weightInput);
    if (isNaN(w)) return;
    const log: WeightLog = {
      id: genId(),
      weight: w,
      date: new Date().toISOString().split('T')[0],
      notes: weightNotes,
    };
    if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addWeightLog(log);
    setWeightInput('');
    setWeightNotes('');
    setShowAddWeight(false);
  };

  const handleAddWorkout = async () => {
    const log: WorkoutLog = {
      id: genId(),
      type: workoutType,
      duration: parseInt(workoutDuration) || 60,
      date: new Date().toISOString().split('T')[0],
      notes: workoutNotes,
    };
    if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addWorkoutLog(log);
    setWorkoutDuration('60');
    setWorkoutNotes('');
    setShowAddWorkout(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        <Text style={styles.screenTitle}>Shape & Saude</Text>

        <View style={styles.dashRow}>
          <ScoreRing
            value={shapeScore}
            size={100}
            strokeWidth={8}
            color={Colors.orange}
            label="Shape"
            sublabel="Score semanal"
          />
          <View style={{ flex: 1, gap: 8 }}>
            <StatRow items={[
              { label: 'Streak', value: `${workoutStreak}d`, color: Colors.orange },
              { label: 'Semana', value: `${weekWorkouts} treinos` },
            ]} />
            {bmi && (
              <View style={styles.bmiCard}>
                <Text style={styles.bmiValue}>{bmi}</Text>
                <Text style={styles.bmiLabel}>IMC</Text>
              </View>
            )}
          </View>
        </View>

        {/* Weight */}
        <SectionHeader
          title="Peso"
          actionLabel={showAddWeight ? 'Fechar' : '+ Registro'}
          onAction={() => setShowAddWeight(!showAddWeight)}
        />

        {lastWeight && (
          <StatRow items={[
            { label: 'Atual', value: `${lastWeight}kg`, color: Colors.orange },
            { label: 'Variacao', value: weightDelta ? `${parseFloat(weightDelta) > 0 ? '+' : ''}${weightDelta}kg` : '-', color: weightDelta && parseFloat(weightDelta) <= 0 ? Colors.green : Colors.red },
            { label: 'Registros', value: `${weightLogs.length}` },
          ]} />
        )}

        {showAddWeight && (
          <GlowCard color={Colors.orange} style={{ marginTop: 12 }}>
            <Text style={styles.formLabel}>Peso (kg)</Text>
            <TextInput
              style={styles.formInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
              placeholder="Ex: 78.5"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <Text style={[styles.formLabel, { marginTop: 12 }]}>Notas (opcional)</Text>
            <TextInput
              style={styles.formInput}
              value={weightNotes}
              onChangeText={setWeightNotes}
              placeholder="Ex: em jejum"
              placeholderTextColor={Colors.textMuted}
            />
            <Pressable onPress={handleAddWeight} style={[styles.saveBtn, { backgroundColor: Colors.orange }]}>
              <Text style={styles.saveBtnText}>Salvar</Text>
            </Pressable>
          </GlowCard>
        )}

        {/* Weight history mini */}
        {weightLogs.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            {weightLogs.slice(0, 5).map((w) => (
              <GlowCard key={w.id} color={Colors.border} padding={12}>
                <View style={styles.logRow}>
                  <Text style={styles.logDate}>{w.date}</Text>
                  <Text style={[styles.logValue, { color: Colors.orange }]}>{w.weight}kg</Text>
                  {w.notes ? <Text style={styles.logNotes}>{w.notes}</Text> : null}
                  <Pressable onPress={() => Alert.alert('Remover', 'Remover registro?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Remover', style: 'destructive', onPress: () => deleteWeightLog(w.id) }])}>
                    <Feather name="trash-2" size={14} color={Colors.textMuted} />
                  </Pressable>
                </View>
              </GlowCard>
            ))}
          </View>
        )}

        {/* Workouts */}
        <SectionHeader
          title="Treinos"
          actionLabel={showAddWorkout ? 'Fechar' : '+ Treino'}
          onAction={() => setShowAddWorkout(!showAddWorkout)}
        />

        {showAddWorkout && (
          <GlowCard color={Colors.orange}>
            <Text style={styles.formLabel}>Tipo de Treino</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {WORKOUT_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setWorkoutType(t)}
                  style={[styles.chip, workoutType === t && { backgroundColor: Colors.orangeDim, borderColor: Colors.orange }]}
                >
                  <Text style={[styles.chipText, workoutType === t && { color: Colors.orange }]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={[styles.formLabel, { marginTop: 12 }]}>Duracao (min)</Text>
            <TextInput
              style={styles.formInput}
              value={workoutDuration}
              onChangeText={setWorkoutDuration}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={[styles.formLabel, { marginTop: 12 }]}>Notas (opcional)</Text>
            <TextInput
              style={styles.formInput}
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              placeholder="Como foi o treino?"
              placeholderTextColor={Colors.textMuted}
            />
            <Pressable onPress={handleAddWorkout} style={[styles.saveBtn, { backgroundColor: Colors.orange }]}>
              <Text style={styles.saveBtnText}>Salvar Treino</Text>
            </Pressable>
          </GlowCard>
        )}

        {workoutLogs.length === 0 ? (
          <EmptyState
            icon="activity"
            title="Nenhum treino registrado"
            subtitle="Registre seus treinos para acompanhar seu progresso"
            actionLabel="+ Treino"
            onAction={() => setShowAddWorkout(true)}
          />
        ) : (
          workoutLogs.slice(0, 10).map((w) => (
            <GlowCard key={w.id} color={Colors.border} padding={12}>
              <View style={styles.logRow}>
                <Feather name="activity" size={14} color={Colors.orange} />
                <Text style={styles.logType}>{w.type}</Text>
                <Text style={[styles.logValue, { color: Colors.orange }]}>{w.duration}min</Text>
                <Text style={styles.logDate}>{w.date}</Text>
                <Pressable onPress={() => Alert.alert('Remover', 'Remover treino?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Remover', style: 'destructive', onPress: () => deleteWorkoutLog(w.id) }])}>
                  <Feather name="trash-2" size={14} color={Colors.textMuted} />
                </Pressable>
              </View>
              {w.notes ? <Text style={styles.logNotes}>{w.notes}</Text> : null}
            </GlowCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 16 },
  dashRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  bmiCard: { backgroundColor: Colors.bgCard, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.border },
  bmiValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.orange },
  bmiLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  formLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  formInput: { backgroundColor: Colors.bgMuted, borderRadius: 10, padding: 10, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  saveBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.white },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  logType: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  logValue: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  logNotes: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 4 },
});
