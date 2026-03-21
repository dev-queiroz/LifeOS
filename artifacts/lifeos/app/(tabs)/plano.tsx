import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { GlowCard } from '@/components/ui/GlowCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

const PHASES = [
  {
    id: 1,
    title: 'Fase 1: Faculdade + Skills',
    period: '2024 — 2026',
    color: Colors.cyan,
    colorDim: Colors.cyanDim,
    icon: 'book' as const,
    milestones: [
      'Formar na faculdade',
      'Ingles B2+ (500h pratica)',
      'Portfolio de projetos solidos',
      'LeetCode 100+ problemas',
      'Primeira certificacao tech',
    ],
    progress: 40,
  },
  {
    id: 2,
    title: 'Fase 2: Shape',
    period: '2025 — 2026',
    color: Colors.orange,
    colorDim: Colors.orangeDim,
    icon: 'activity' as const,
    milestones: [
      'Rotina de treino 4x/semana',
      'Peso ideal + IMC saudavel',
      'Disciplina fisica consolidada',
    ],
    progress: 30,
  },
  {
    id: 3,
    title: 'Fase 3: Espanha + Trabalho Remoto',
    period: '2026 — 2028',
    color: Colors.green,
    colorDim: Colors.greenDim,
    icon: 'globe' as const,
    milestones: [
      'Conseguir emprego remoto internacional',
      'Mudar para Espanha',
      'Ingles C1+ fluente',
      'Salario em euros',
    ],
    progress: 5,
  },
  {
    id: 4,
    title: 'Fase 4: Cidadania',
    period: '2028 — 2030',
    color: Colors.purple,
    colorDim: Colors.purpleDim,
    icon: 'flag' as const,
    milestones: [
      'Cidadania espanhola',
      'Estabilidade financeira',
      'Rede de contatos europeia',
    ],
    progress: 0,
  },
  {
    id: 5,
    title: 'Fase 5: Alemanha + Esposa',
    period: '2030 — 2031',
    color: Colors.accent,
    colorDim: Colors.accentDim,
    icon: 'heart' as const,
    milestones: [
      'Mudar para Alemanha',
      'Construir vida com parceira',
      'LifeOS completo — Meta 2031',
    ],
    progress: 0,
  },
];

const CAREER_ITEMS = [
  { label: 'Ingles Fluente', key: 'ingles' },
  { label: 'Porfolio GitHub', key: 'github' },
  { label: 'Deploy em producao', key: 'deploy' },
  { label: 'Certificacao', key: 'cert' },
  { label: 'LeetCode 100+', key: 'leetcode' },
  { label: 'Experiencia remota', key: 'remote' },
];

export default function PlanoScreen() {
  const insets = useSafeAreaInsets();
  const { englishSessions, progSessions, projects, certifications, workoutLogs } = useApp();
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);

  const totalEngHours = Math.round(englishSessions.reduce((acc, s) => acc + s.duration, 0) / 60);
  const leetcodeCount = progSessions.filter((s) => s.type === 'leetcode').length;
  const deployedCount = projects.filter((p) => p.status === 'deployed').length;
  const certsCount = certifications.filter((c) => c.status === 'completed').length;

  const careerReadiness = (
    (totalEngHours >= 500 ? 1 : 0) +
    (projects.length >= 3 ? 1 : 0) +
    (deployedCount >= 1 ? 1 : 0) +
    (certsCount >= 1 ? 1 : 0) +
    (leetcodeCount >= 100 ? 1 : 0)
  );

  const readinessPct = Math.round((careerReadiness / 5) * 100);
  const readinessLabel = readinessPct >= 80 ? 'PRONTO' : readinessPct >= 50 ? 'QUASE' : 'EM PROGRESSO';
  const readinessColor = readinessPct >= 80 ? Colors.green : readinessPct >= 50 ? Colors.orange : Colors.accent;

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        <Text style={styles.screenTitle}>Plano 2031</Text>
        <Text style={styles.screenSubtitle}>Do zero para Alemanha + vida dos sonhos</Text>

        {/* Carreira Internacional */}
        <SectionHeader title="Carreira Internacional" subtitle="Nivel atual de preparo" />
        <GlowCard color={readinessColor}>
          <View style={styles.readinessRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.readinessLabel}>Preparo Geral</Text>
              <ProgressBar value={readinessPct} max={100} color={readinessColor} height={8} />
              <Text style={[styles.readinessPct, { color: readinessColor }]}>{readinessPct}%</Text>
            </View>
            <Badge label={readinessLabel} color={readinessColor} bg={readinessColor + '20'} size="md" />
          </View>

          {CAREER_ITEMS.map((item) => {
            const current =
              item.key === 'ingles' ? totalEngHours >= 500
                : item.key === 'leetcode' ? leetcodeCount >= 100
                : item.key === 'deploy' ? deployedCount >= 1
                : item.key === 'cert' ? certsCount >= 1
                : item.key === 'github' ? projects.length >= 3
                : false;
            return (
              <View key={item.key} style={styles.careerItem}>
                <Feather
                  name={current ? 'check-circle' : 'circle'}
                  size={16}
                  color={current ? Colors.green : Colors.textMuted}
                />
                <Text style={[styles.careerLabel, current && { color: Colors.green }]}>{item.label}</Text>
              </View>
            );
          })}
        </GlowCard>

        {/* Fases */}
        <SectionHeader title="As 5 Fases" subtitle="Visao completa do plano" />
        {PHASES.map((phase) => (
          <GlowCard key={phase.id} color={phase.color} padding={0}>
            <Pressable
              onPress={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              style={styles.phaseHeader}
            >
              <View style={[styles.phaseIcon, { backgroundColor: phase.colorDim }]}>
                <Feather name={phase.icon} size={18} color={phase.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.phaseTitle}>{phase.title}</Text>
                <Text style={styles.phasePeriod}>{phase.period}</Text>
              </View>
              <View style={styles.phaseRight}>
                <Text style={[styles.phaseProgress, { color: phase.color }]}>{phase.progress}%</Text>
                <Feather
                  name={expandedPhase === phase.id ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textMuted}
                />
              </View>
            </Pressable>

            {expandedPhase === phase.id && (
              <View style={styles.phaseBody}>
                <ProgressBar value={phase.progress} max={100} color={phase.color} height={6} />
                <View style={{ height: 12 }} />
                {phase.milestones.map((m, i) => (
                  <View key={i} style={styles.milestone}>
                    <View style={[styles.milestoneDot, { backgroundColor: phase.color + '60' }]} />
                    <Text style={styles.milestoneText}>{m}</Text>
                  </View>
                ))}
              </View>
            )}
          </GlowCard>
        ))}

        {/* Previsao */}
        <SectionHeader title="Previsao Detalhada" subtitle="3 cenarios de chegada" />
        <GlowCard color={Colors.accent}>
          {[
            { label: 'Otimista', year: '2027', desc: 'Score 80+, consistencia maxima', color: Colors.green },
            { label: 'Base', year: '2028', desc: 'Score 60-80, progresso constante', color: Colors.accent },
            { label: 'Pessimista', year: '2029', desc: 'Score <60, pausas e desvios', color: Colors.orange },
          ].map((scenario) => (
            <View key={scenario.label} style={styles.scenarioRow}>
              <View style={[styles.scenarioDot, { backgroundColor: scenario.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.scenarioLabel}>{scenario.label}</Text>
                <Text style={styles.scenarioDesc}>{scenario.desc}</Text>
              </View>
              <Text style={[styles.scenarioYear, { color: scenario.color }]}>{scenario.year}</Text>
            </View>
          ))}
        </GlowCard>

        {/* Meta final */}
        <GlowCard color={Colors.accentGlow} style={styles.finalGoal}>
          <View style={styles.finalRow}>
            <Feather name="flag" size={24} color={Colors.accentGlow} />
            <View style={{ flex: 1 }}>
              <Text style={styles.finalTitle}>Meta Final: 2031</Text>
              <Text style={styles.finalDesc}>Vivendo na Alemanha, trabalho remoto excelente, com a mulher ideal, saudavel e financeiramente livre.</Text>
            </View>
          </View>
        </GlowCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 4 },
  screenSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 24 },
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  readinessLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginBottom: 6 },
  readinessPct: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  careerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  careerLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  phaseIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  phaseTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  phasePeriod: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  phaseRight: { alignItems: 'center', gap: 4 },
  phaseProgress: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  phaseBody: { paddingHorizontal: 16, paddingBottom: 16 },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  milestoneDot: { width: 6, height: 6, borderRadius: 3 },
  milestoneText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  scenarioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  scenarioDot: { width: 10, height: 10, borderRadius: 5 },
  scenarioLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  scenarioDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  scenarioYear: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  finalGoal: { marginTop: 4 },
  finalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  finalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 6 },
  finalDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 20 },
});
