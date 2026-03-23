import { Feather } from '@expo/vector-icons';
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
import type { EnglishSession, Simulation } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';
import { calcEnglishHours, calcEnglishStreak } from '@/services/score';

const SESSION_TYPES: { key: EnglishSession['type']; label: string; icon: string }[] = [
  { key: 'speaking', label: 'Speaking', icon: 'mic' },
  { key: 'listening', label: 'Listening', icon: 'headphones' },
  { key: 'reading', label: 'Reading', icon: 'book-open' },
  { key: 'writing', label: 'Writing', icon: 'edit-3' },
  { key: 'vocab', label: 'Vocabulário', icon: 'type' },
  { key: 'class', label: 'Aula', icon: 'user' },
];

const TARGET_HOURS = 500;

const LEVELS = [
  { min: 0, label: 'A1 (Iniciante)' },
  { min: 40, label: 'A2 (Básico)' },
  { min: 120, label: 'B1 (Intermediário)' },
  { min: 250, label: 'B2 (Independente)' },
  { min: 500, label: 'C1 (Fluente)' },
];

const PLATFORMS = ['Busuu', 'Duolingo', 'Italki', 'YouTube', 'Livros', 'Outros'];

function AddSessionModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (s: Omit<EnglishSession, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<EnglishSession['type']>('speaking');
  const [duration, setDuration] = useState('60');
  const [platform, setPlatform] = useState('Busuu');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const dur = parseInt(duration);
    if (!dur || dur < 5) { Alert.alert('Duração mínima: 5 min'); return; }
    onSave({
      type,
      duration: dur,
      platform,
      score: score ? parseFloat(score) : undefined,
      notes,
      date: new Date().toISOString(),
    });
    setDuration('60'); setScore(''); setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Sessão Inglês</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.fieldLabel}>Tipo</Text>
          <View style={styles.typeGrid}>
            {SESSION_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeChip, type === t.key && { backgroundColor: Colors.green + '25', borderColor: Colors.green }]}
                onPress={() => setType(t.key)}
              >
                <Feather name={t.icon as never} size={14} color={type === t.key ? Colors.green : Colors.textMuted} />
                <Text style={[styles.typeLabel, type === t.key && { color: Colors.green }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Duração (min)</Text>
          <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Plataforma</Text>
          <View style={styles.typeGrid}>
            {PLATFORMS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.platformChip, platform === p && { backgroundColor: Colors.green + '25', borderColor: Colors.green }]}
                onPress={() => setPlatform(p)}
              >
                <Text style={[styles.typeLabel, platform === p && { color: Colors.green }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Nota (opcional)</Text>
          <TextInput style={styles.input} value={score} onChangeText={setScore} keyboardType="numeric" placeholder="0-10" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Notas</Text>
          <TextInput style={[styles.input, { minHeight: 60 }]} value={notes} onChangeText={setNotes} multiline placeholder="O que aprendeu?" placeholderTextColor={Colors.textMuted} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Salvar Sessão</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function SimModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (s: Omit<Simulation, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const s = parseFloat(score);
    const m = parseFloat(maxScore);
    if (!s || !m) { Alert.alert('Preencha nota e máximo'); return; }
    onSave({ type: 'ingles', score: s, maxScore: m, notes, date: new Date().toISOString() });
    setScore(''); setMaxScore('100'); setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Registrar Simulado</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          <Text style={styles.fieldLabel}>Nota</Text>
          <TextInput style={styles.input} value={score} onChangeText={setScore} keyboardType="numeric" placeholder="Ex: 78" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Nota Máxima</Text>
          <TextInput style={styles.input} value={maxScore} onChangeText={setMaxScore} keyboardType="numeric" placeholder="100" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Observações</Text>
          <TextInput style={[styles.input, { minHeight: 60 }]} value={notes} onChangeText={setNotes} multiline placeholderTextColor={Colors.textMuted} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Registrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function InglesScreen() {
  const insets = useSafeAreaInsets();
  const { englishSessions, addEnglishSession, deleteEnglishSession, simulations, addSimulation, deleteSimulation } = useApp();
  const [sessionModal, setSessionModal] = useState(false);
  const [simModal, setSimModal] = useState(false);

  const totalHours = useMemo(() => calcEnglishHours(englishSessions), [englishSessions]);
  const streak = useMemo(() => calcEnglishStreak(englishSessions), [englishSessions]);
  const progress = Math.min(100, Math.round((totalHours / TARGET_HOURS) * 100));

  const speakingHours = useMemo(() =>
    Math.round(englishSessions.filter((s) => s.type === 'speaking').reduce((a, s) => a + s.duration, 0) / 60),
    [englishSessions]
  );
  const vocabSessions = englishSessions.filter((s) => s.type === 'vocab').length;

  const engSimulations = simulations.filter((s) => s.type === 'ingles');
  const lastSim = engSimulations[0];
  const totalSims = engSimulations.length;
  const avgSim = engSimulations.length > 0
    ? Math.round(engSimulations.reduce((a, s) => a + (s.score / s.maxScore) * 100, 0) / engSimulations.length)
    : null;

  const currentLevel = useMemo(() => {
    return [...LEVELS].reverse().find(l => totalHours >= l.min) || LEVELS[0];
  }, [totalHours]);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}
      >
        <View style={styles.header}>
          <SidebarToggle color={Colors.green} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: Colors.green }]}>Inglês Fluente</Text>
            <Text style={styles.subtitle}>Nível Estimado: {currentLevel.label}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: Colors.greenDim, marginRight: 8 }]} 
            onPress={() => router.push('/ingles/flashcards')}
          >
            <Feather name="layers" size={18} color={Colors.green} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.greenDim }]} onPress={() => setSessionModal(true)}>
            <Feather name="plus" size={18} color={Colors.green} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <ScoreRing value={progress} size={100} color={Colors.green} label={`${totalHours}h`} />
          <View style={styles.statsRight}>
            <View style={styles.statBlock}>
              <Text style={[styles.statVal, { color: Colors.green }]}>{totalHours}h</Text>
              <Text style={styles.statLabel}>Total Prática</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={[styles.statVal, { color: Colors.cyan }]}>{speakingHours}h</Text>
              <Text style={styles.statLabel}>Speaking</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={[styles.statVal, { color: Colors.orange }]}>{streak}d</Text>
              <Text style={styles.statLabel}>Streak Atual</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={[styles.statVal, { color: Colors.purple }]}>{totalSims}</Text>
              <Text style={styles.statLabel}>Simulados</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progresso para {TARGET_HOURS}h</Text>
            <Text style={[styles.progressPct, { color: Colors.green }]}>{progress}%</Text>
          </View>
          <ProgressBar value={progress} color={Colors.green} height={10} />
          <Text style={styles.progressSub}>
            Faltam {Math.max(0, TARGET_HOURS - totalHours)}h para a meta
          </Text>
        </View>

        {lastSim && (
          <GlowCard color={Colors.green}>
            <Text style={styles.simTitle}>Último Simulado</Text>
            <Text style={[styles.simScore, { color: Colors.green }]}>
              {lastSim.score}/{lastSim.maxScore} — {Math.round((lastSim.score / lastSim.maxScore) * 100)}%
            </Text>
            {avgSim !== null && <Text style={styles.simAvg}>Média simulados: {avgSim}%</Text>}
          </GlowCard>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.green }]} onPress={() => setSessionModal(true)}>
            <Feather name="mic" size={16} color={Colors.white} />
            <Text style={styles.actionBtnText}>+ Sessão</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.greenDim, borderWidth: 1, borderColor: Colors.green }]} onPress={() => setSimModal(true)}>
            <Feather name="clipboard" size={16} color={Colors.green} />
            <Text style={[styles.actionBtnText, { color: Colors.green }]}>Registrar Simulado</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Últimas Sessões</Text>
        {englishSessions.length === 0 ? (
          <EmptyState icon="mic" title="Nenhuma sessão" description="Registre suas sessões de inglês." color={Colors.green} />
        ) : (
          englishSessions.slice(0, 8).map((s) => (
            <View key={s.id} style={styles.sessionRow}>
              <View style={[styles.sessionIcon, { backgroundColor: Colors.greenDim }]}>
                <Feather name={SESSION_TYPES.find((t) => t.key === s.type)?.icon as never ?? 'mic'} size={14} color={Colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionType}>
                  {SESSION_TYPES.find((t) => t.key === s.type)?.label ?? s.type}
                  {s.platform ? <Text style={styles.sessionPlatform}> · {s.platform}</Text> : ''}
                </Text>
                <Text style={styles.sessionMeta}>{s.duration}min{s.score !== undefined ? ` · ${s.score}/10` : ''}</Text>
              </View>
              <View style={styles.sessionRight}>
                <Text style={styles.sessionDate}>{s.date.slice(5, 10)}</Text>
                <TouchableOpacity onPress={() => deleteEnglishSession(s.id)}>
                  <Feather name="trash-2" size={13} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <AddSessionModal visible={sessionModal} onClose={() => setSessionModal(false)} onSave={(s) => addEnglishSession(s)} />
      <SimModal visible={simModal} onClose={() => setSimModal(false)} onSave={(s) => addSimulation(s)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  statsRight: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBlock: { width: '44%' },
  statVal: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  progressSection: { backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 14, gap: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text },
  progressPct: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  progressSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  simTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 4 },
  simScore: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  simAvg: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.white },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 10 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  sessionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sessionType: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  sessionPlatform: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  sessionMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  sessionRight: { alignItems: 'flex-end', gap: 4 },
  sessionDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  modal: { flex: 1, backgroundColor: Colors.bg },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text },
  modalContent: { padding: 20, gap: 12 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  platformChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  typeLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 15 },
  saveBtn: { backgroundColor: Colors.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
});
