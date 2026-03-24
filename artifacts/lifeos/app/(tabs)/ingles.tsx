import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
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

const TARGET_HOURS = 500;

const SESSION_TYPES = [
  { key: 'speaking' as const, label: 'Speaking', icon: 'mic' },
  { key: 'listening' as const, label: 'Listening', icon: 'headphones' },
  { key: 'reading' as const, label: 'Reading', icon: 'book-open' },
  { key: 'writing' as const, label: 'Writing', icon: 'edit-3' },
  { key: 'vocab' as const, label: 'Vocabulário', icon: 'type' },
  { key: 'class' as const, label: 'Aula', icon: 'user' },
];

const PLATFORMS = ['Busuu', 'Duolingo', 'Italki', 'YouTube', 'Livros', 'Outros'];

export default function InglesScreen() {
  const insets = useSafeAreaInsets();
  const { englishSessions, addEnglishSession, deleteEnglishSession, simulations, addSimulation } = useApp();

  const [sessionModal, setSessionModal] = useState(false);
  const [simModal, setSimModal] = useState(false);

  // Cálculos principais
  const totalHours = useMemo(() => calcEnglishHours(englishSessions), [englishSessions]);
  const streak = useMemo(() => calcEnglishStreak(englishSessions), [englishSessions]);
  const progress = Math.min(100, Math.round((totalHours / TARGET_HOURS) * 100));

  const speakingHours = useMemo(() =>
    Math.round(englishSessions.filter(s => s.type === 'speaking').reduce((a, s) => a + s.duration, 0) / 60),
    [englishSessions]
  );

  const vocabSessions = englishSessions.filter(s => s.type === 'vocab').length;

  // Simulados
  const engSimulations = simulations.filter(s => s.type === 'ingles');
  const lastSim = engSimulations[0];
  const avgSim = engSimulations.length > 0
    ? Math.round(engSimulations.reduce((a, s) => a + (s.score / s.maxScore) * 100, 0) / engSimulations.length)
    : 0;

  // Nível atual
  const currentLevel = useMemo(() => {
    if (totalHours >= 500) return 'C1 - Fluente';
    if (totalHours >= 250) return 'B2 - Avançado';
    if (totalHours >= 120) return 'B1 - Intermediário';
    if (totalHours >= 40) return 'A2 - Básico';
    return 'A1 - Iniciante';
  }, [totalHours]);

  // Cor do streak (fogo)
  const streakColor = streak >= 7 ? Colors.green : streak >= 3 ? Colors.orange : streak > 0 ? Colors.yellow : Colors.textMuted;

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
            <Text style={styles.subtitle}>{currentLevel}</Text>
          </View>

          {/* Flashcards */}
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: Colors.greenDim, marginRight: 8 }]}
            onPress={() => router.push('/(tabs)/ingles/flashcards')}
          >
            <Feather name="layers" size={18} color={Colors.green} />
          </TouchableOpacity>

          {/* Nova Sessão */}
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: Colors.greenDim }]}
            onPress={() => setSessionModal(true)}
          >
            <Feather name="plus" size={18} color={Colors.green} />
          </TouchableOpacity>
        </View>

        {/* Streak + Progresso Principal */}
        <GlowCard color={streakColor} style={{ marginTop: 12 }}>
          <View style={styles.streakContainer}>
            <View style={styles.fireContainer}>
              <Feather name="zap" size={38} color={streakColor} />
              <Text style={[styles.streakNumber, { color: streakColor }]}>
                {streak}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>Streak Atual</Text>
              <Text style={styles.streakSubtitle}>
                {streak === 0
                  ? 'Faça uma sessão hoje para acender o fogo!'
                  : streak === 1
                    ? '1 dia de consistência!'
                    : `${streak} dias seguidos!`}
              </Text>
            </View>
          </View>

          {/* Progresso para 500h */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progresso para fluência (500h)</Text>
              <Text style={[styles.progressPct, { color: Colors.green }]}>{progress}%</Text>
            </View>
            <ProgressBar value={progress} color={Colors.green} height={10} />
            <Text style={styles.progressRemaining}>
              Faltam {Math.max(0, TARGET_HOURS - totalHours)} horas
            </Text>
          </View>
        </GlowCard>

        {/* Estatísticas rápidas */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalHours}h</Text>
            <Text style={styles.statLabel}>Prática Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{speakingHours}h</Text>
            <Text style={styles.statLabel}>Speaking</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{vocabSessions}</Text>
            <Text style={styles.statLabel}>Vocab</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: lastSim ? Colors.green : Colors.textMuted }]}>
              {lastSim ? `${lastSim.score}/${lastSim.maxScore}` : '—'}
            </Text>
            <Text style={styles.statLabel}>Último Simulado</Text>
          </View>
        </View>

        {/* Ações rápidas */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setSessionModal(true)}>
            <Feather name="mic" size={20} color={Colors.white} />
            <Text style={styles.actionText}>Nova Sessão</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => setSimModal(true)}>
            <Feather name="clipboard" size={20} color={Colors.green} />
            <Text style={[styles.actionText, { color: Colors.green }]}>Simulado</Text>
          </TouchableOpacity>
        </View>

        {/* Últimas Sessões */}
        <Text style={styles.sectionTitle}>Últimas Sessões</Text>
        {englishSessions.length === 0 ? (
          <EmptyState
            icon="mic"
            title="Nenhuma sessão ainda"
            description="Registre suas práticas de inglês para começar a rastrear o progresso."
            color={Colors.green}
          />
        ) : (
          englishSessions.slice(0, 8).map((s) => (
            <View key={s.id} style={styles.sessionRow}>
              <View style={[styles.sessionIcon, { backgroundColor: Colors.greenDim }]}>
                <Feather
                  name={SESSION_TYPES.find(t => t.key === s.type)?.icon as never ?? 'mic'}
                  size={18}
                  color={Colors.green}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionType}>
                  {SESSION_TYPES.find(t => t.key === s.type)?.label ?? s.type}
                  {s.platform && <Text style={styles.sessionPlatform}> · {s.platform}</Text>}
                </Text>
                <Text style={styles.sessionMeta}>
                  {s.duration}min {s.score !== undefined && `· ${s.score}/10`}
                </Text>
              </View>
              <View style={styles.sessionRight}>
                <Text style={styles.sessionDate}>{s.date.slice(5, 10)}</Text>
                <TouchableOpacity onPress={() => deleteEnglishSession(s.id)}>
                  <Feather name="trash-2" size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Modais */}
      <AddSessionModal visible={sessionModal} onClose={() => setSessionModal(false)} onSave={addEnglishSession} />
      <SimModal visible={simModal} onClose={() => setSimModal(false)} onSave={addSimulation} />
    </View>
  );
}

/* ====================== MODAIS ====================== */
// (Mantive seus modais originais, apenas ajustei pequenos detalhes de estilo)
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
          <Text style={styles.modalTitle}>Nova Sessão de Inglês</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.fieldLabel}>Tipo de Prática</Text>
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

          <Text style={styles.fieldLabel}>Duração (minutos)</Text>
          <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.fieldLabel}>Plataforma / Método</Text>
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

          <Text style={styles.fieldLabel}>Nota do exercício (opcional)</Text>
          <TextInput style={styles.input} value={score} onChangeText={setScore} keyboardType="numeric" placeholder="0-10" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.fieldLabel}>Observações</Text>
          <TextInput style={[styles.input, { minHeight: 70 }]} value={notes} onChangeText={setNotes} multiline placeholder="O que você aprendeu hoje?" placeholderTextColor={Colors.textMuted} />

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
          <Text style={styles.fieldLabel}>Sua Nota</Text>
          <TextInput style={styles.input} value={score} onChangeText={setScore} keyboardType="numeric" placeholder="Ex: 78" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Nota Máxima</Text>
          <TextInput style={styles.input} value={maxScore} onChangeText={setMaxScore} keyboardType="numeric" placeholder="100" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Observações (opcional)</Text>
          <TextInput style={[styles.input, { minHeight: 60 }]} value={notes} onChangeText={setNotes} multiline placeholderTextColor={Colors.textMuted} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Registrar Simulado</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 80 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  smallBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  streakContainer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  fireContainer: { alignItems: 'center' },
  streakNumber: { fontSize: 32, fontFamily: 'Inter_700Bold', marginTop: 4 },
  streakTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text },
  streakSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '48%', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 4 },

  progressSection: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text },
  progressPct: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.green },
  progressRemaining: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center', marginTop: 6 },

  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.green },
  actionBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.greenDim, borderWidth: 1, borderColor: Colors.green },
  actionText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.white },

  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 10, marginTop: 8 },

  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  sessionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sessionType: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  sessionPlatform: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  sessionMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
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