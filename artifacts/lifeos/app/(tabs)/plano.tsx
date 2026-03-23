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
import { GlowCard } from '@/components/ui/GlowCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Colors } from '@/constants/colors';
import type { PlanGoal } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';
import { forecast2031, planProgress } from '@/services/score';

const PHASES = [
  { id: 1 as const, title: 'Fase 1: Faculdade + Skills', period: '2024 – 2026', color: Colors.cyan, colorDim: Colors.cyanDim, icon: 'book' as const, desc: 'Formar, inglês B2+, programar' },
  { id: 2 as const, title: 'Fase 2: Shape + Estabilidade', period: '2026 – 2027', color: Colors.orange, colorDim: Colors.orangeDim, icon: 'activity' as const, desc: 'Saúde, freelas, reserva 6 meses' },
  { id: 3 as const, title: 'Fase 3: Carreira Internacional', period: '2027 – 2029', color: Colors.purple, colorDim: Colors.purpleDim, icon: 'briefcase' as const, desc: 'Emprego remoto EUR 3k+/mês' },
  { id: 4 as const, title: 'Fase 4: Relocation + Visto', period: '2029 – 2031', color: Colors.green, colorDim: Colors.greenDim, icon: 'map-pin' as const, desc: 'Processo Blue Card, mudança' },
  { id: 5 as const, title: 'Fase 5: Vida na Europa 2032', period: '2031 – 2032', color: Colors.accent, colorDim: Colors.accentDim, icon: 'star' as const, desc: 'Estabelecido (Espanha/Alemanha)' },
];

function AddGoalModal({ visible, phase, onClose, onSave }: {
  visible: boolean;
  phase: 1 | 2 | 3 | 4 | 5;
  onClose: () => void;
  onSave: (g: Omit<PlanGoal, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Título obrigatório'); return; }
    onSave({ phase, title: title.trim(), done: false });
    setTitle('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nova Meta — Fase {phase}</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          <Text style={styles.fieldLabel}>Título</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Atingir IELTS 7.0"
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Adicionar Meta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function PlanoScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, englishSessions, progSessions, planGoals, addPlanGoal, updatePlanGoal, deletePlanGoal } = useApp();
  const [selectedPhase, setSelectedPhase] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [goalModal, setGoalModal] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

  const phaseProgress = useMemo(
    () => planProgress(sessions, englishSessions, progSessions),
    [sessions, englishSessions, progSessions]
  );

  const forecast = useMemo(
    () => forecast2031(sessions, englishSessions, progSessions),
    [sessions, englishSessions, progSessions]
  );

  const overallProgress = Math.round(phaseProgress.reduce((a, b) => a + b, 0) / 5);
  const yearsLeft = 2032 - new Date().getFullYear();

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}
      >
        <View style={styles.header}>
          <SidebarToggle color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: Colors.accent }]}>Plano 2032</Text>
            <Text style={styles.subtitle}>{yearsLeft} anos para Europa • {overallProgress}% geral</Text>
          </View>
          <TouchableOpacity 
            style={[styles.headerIconBtn, { backgroundColor: Colors.accentDim, borderColor: Colors.accent }]} 
            onPress={() => setGoalModal(1)}
          >
            <Feather name="plus" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        <GlowCard color={Colors.accent}>
          <View style={styles.countdownRow}>
             <View style={styles.countdownItem}>
                <Text style={styles.countdownVal}>{yearsLeft}</Text>
                <Text style={styles.countdownLabel}>Anos</Text>
             </View>
             <View style={styles.countdownDivider} />
             <View style={styles.countdownItem}>
                <Text style={styles.countdownVal}>{Math.floor(yearsLeft * 365)}</Text>
                <Text style={styles.countdownLabel}>Dias</Text>
             </View>
             <View style={styles.countdownDivider} />
             <View style={styles.countdownItem}>
                <Text style={styles.countdownVal}>{overallProgress}%</Text>
                <Text style={styles.countdownLabel}>Concluído</Text>
             </View>
          </View>
          
          <View style={styles.forecastRow}>
            <View style={[styles.forecastItem, { borderColor: Colors.green + '50' }]}>
              <Text style={[styles.forecastPct, { color: Colors.green }]}>{forecast.otimista}%</Text>
              <Text style={styles.forecastLabel}>Otimista</Text>
            </View>
            <View style={[styles.forecastItem, { borderColor: Colors.accent + '50', backgroundColor: Colors.accentDim + '40' }]}>
              <Text style={[styles.forecastPct, { color: Colors.accent }]}>{forecast.realista}%</Text>
              <Text style={styles.forecastLabel}>Realista</Text>
            </View>
            <View style={[styles.forecastItem, { borderColor: Colors.orange + '50' }]}>
              <Text style={[styles.forecastPct, { color: Colors.orange }]}>{forecast.pessimista}%</Text>
              <Text style={styles.forecastLabel}>Pessimista</Text>
            </View>
          </View>
        </GlowCard>

        <Text style={styles.sectionTitle}>Fases</Text>
        {PHASES.map((phase, i) => {
          const pct = phaseProgress[i] ?? 0;
          const goals = planGoals.filter((g) => g.phase === phase.id);
          const doneGoals = goals.filter((g) => g.done).length;
          const isExpanded = selectedPhase === phase.id;

          return (
            <View key={phase.id} style={styles.phaseWrapper}>
              <TouchableOpacity
                style={[styles.phaseCard, { borderColor: phase.color + '40', borderLeftColor: phase.color, borderLeftWidth: 3 }]}
                onPress={() => setSelectedPhase(isExpanded ? null : phase.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.phaseIcon, { backgroundColor: phase.colorDim }]}>
                  <Feather name={phase.icon} size={18} color={phase.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.phaseTitle, { color: phase.color }]}>{phase.title}</Text>
                  <Text style={styles.phasePeriod}>{phase.period} · {phase.desc}</Text>
                  <View style={styles.phaseProgressRow}>
                    <ProgressBar value={pct} color={phase.color} height={6} />
                    <Text style={[styles.phasePct, { color: phase.color }]}>{pct}%</Text>
                  </View>
                  {goals.length > 0 && (
                    <Text style={styles.phaseGoalCount}>{doneGoals}/{goals.length} metas</Text>
                  )}
                </View>
                <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.phaseDetail, { backgroundColor: phase.colorDim + '30', borderColor: phase.color + '30' }]}>
                  {goals.map((g) => (
                    <View key={g.id} style={styles.goalRow}>
                      <TouchableOpacity onPress={() => updatePlanGoal({ ...g, done: !g.done })}>
                        <Feather name={g.done ? 'check-square' : 'square'} size={18} color={g.done ? phase.color : Colors.textMuted} />
                      </TouchableOpacity>
                      <Text style={[styles.goalTitle, g.done && styles.goalDone]}>{g.title}</Text>
                      <TouchableOpacity onPress={() => deletePlanGoal(g.id)}>
                        <Feather name="trash-2" size={13} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[styles.addGoalBtn, { borderColor: phase.color + '60' }]}
                    onPress={() => setGoalModal(phase.id)}
                  >
                    <Feather name="plus" size={14} color={phase.color} />
                    <Text style={[styles.addGoalText, { color: phase.color }]}>Adicionar meta</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>Próximos Passos</Text>
        <GlowCard color={Colors.bgMuted}>
          <View style={{ gap: 12 }}>
            {[
              { area: 'Faculdade', step: 'Concluir disciplinas do semestre atual.', icon: 'book', color: Colors.cyan },
              { area: 'Carreira', step: 'Completar 3 projetos reais no portfolio.', icon: 'briefcase', color: Colors.purple },
              { area: 'Saúde', step: 'Manter streak de 4 treinos/semana.', icon: 'activity', color: Colors.orange },
              { area: 'Finanças', step: 'Atingir primeira meta da reserva.', icon: 'dollar-sign', color: Colors.green },
            ].map(p => (
              <View key={p.area} style={styles.nextStepRow}>
                <View style={[styles.nextStepIcon, { backgroundColor: p.color + '25' }]}>
                  <Feather name={p.icon as any} size={14} color={p.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextStepArea}>{p.area}</Text>
                  <Text style={styles.nextStepText}>{p.step}</Text>
                </View>
              </View>
            ))}
          </View>
        </GlowCard>

        <View style={{ height: 40 }} />
      </ScrollView>

      {goalModal && (
        <AddGoalModal
          visible={true}
          phase={goalModal}
          onClose={() => setGoalModal(null)}
          onSave={(g) => addPlanGoal(g)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  headerIconBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  countdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20, marginTop: 10 },
  countdownItem: { alignItems: 'center' },
  countdownVal: { fontSize: 24, fontFamily: 'Inter_800ExtraBold', color: Colors.text },
  countdownLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.textMuted, textTransform: 'uppercase' },
  countdownDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  forecastRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  forecastItem: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12, alignItems: 'center' },
  forecastPct: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  forecastLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 12, marginTop: 8 },
  phaseWrapper: { marginBottom: 8 },
  phaseCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1 },
  phaseIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  phaseTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  phasePeriod: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 6 },
  phaseProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phasePct: { fontSize: 12, fontFamily: 'Inter_700Bold', width: 36 },
  phaseGoalCount: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 4 },
  phaseDetail: { borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 2, gap: 8 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text },
  goalDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  addGoalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, marginTop: 4 },
  addGoalText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  nextStepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextStepIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  nextStepArea: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textMuted, textTransform: 'uppercase' },
  nextStepText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text },
  modal: { flex: 1, backgroundColor: Colors.bg },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text },
  modalContent: { padding: 20, gap: 12 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 15 },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
});
