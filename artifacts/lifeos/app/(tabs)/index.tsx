import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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

import { QuickSessionModal } from '@/components/QuickSessionModal';
import { AreaCard } from '@/components/ui/AreaCard';
import { GlowCard } from '@/components/ui/GlowCard';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

const MOTIVATIONAL = [
  'Cada sessao te aproxima da Alemanha.',
  'Consistencia bate talento todos os dias.',
  'Quem controla o dia controla o futuro.',
  'O gap fechou um pouco mais hoje.',
  'Voce esta construindo a vida dos seus sonhos.',
];

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { globalScore, sessions, englishSessions, workoutLogs, settings } = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  const quote = MOTIVATIONAL[new Date().getDay() % MOTIVATIONAL.length];

  const todaySessions = sessions.filter(
    (s) => s.date === new Date().toISOString().split('T')[0]
  );

  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);

  const engStreak = (() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (englishSessions.some((s) => s.date === ds)) streak++;
      else break;
    }
    return streak;
  })();

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

  const scoreColor =
    globalScore.total >= 75
      ? Colors.green
      : globalScore.total >= 50
      ? Colors.accent
      : globalScore.total >= 25
      ? Colors.orange
      : Colors.red;

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>LifeOS</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/modal/add-note')}
            style={styles.headerBtn}
          >
            <Feather name="bell" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Modo Critico Banner */}
        {globalScore.criticalMode && (
          <View style={styles.criticalBanner}>
            <Feather name="alert-triangle" size={16} color={Colors.red} />
            <Text style={styles.criticalText}>Modo Critico — Score abaixo de 40. Foca agora!</Text>
          </View>
        )}

        {/* Quote */}
        <GlowCard color={Colors.accent} style={styles.quoteCard}>
          <Feather name="zap" size={14} color={Colors.accentGlow} />
          <Text style={styles.quoteText}>{quote}</Text>
        </GlowCard>

        {/* Score Global */}
        <View style={styles.scoreSection}>
          <ScoreRing
            value={globalScore.total}
            size={150}
            strokeWidth={10}
            color={scoreColor}
            label="Score Global"
            sublabel={`${globalScore.trend === 'up' ? '↑' : '↓'} Tendencia`}
          />
          <View style={styles.scoreStats}>
            {[
              { label: 'Hoje', value: `${todayMinutes}min`, color: Colors.accent },
              { label: 'Sessoes', value: `${todaySessions.length}`, color: Colors.cyan },
              { label: 'Streak EN', value: `${engStreak}d`, color: Colors.green },
              { label: 'Streak Gym', value: `${workoutStreak}d`, color: Colors.orange },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick + Session Button */}
        <Pressable
          onPress={() => {
            if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModalVisible(true);
          }}
          style={styles.quickBtn}
        >
          <Feather name="plus" size={20} color={Colors.white} />
          <Text style={styles.quickBtnText}>+ Sessao Rapida</Text>
        </Pressable>

        {/* Area Scores */}
        <SectionHeader title="Areas" subtitle="Score dos ultimos 7 dias" />
        <View style={styles.areasWrap}>
          <AreaCard
            label="Faculdade"
            value={globalScore.faculdade.value}
            color={Colors.cyan}
            colorDim={Colors.cyanDim}
            icon={<Feather name="book" size={18} color={Colors.cyan} />}
            subtitle="Materias, atividades, provas"
            onPress={() => router.push('/(tabs)/faculdade')}
          />
          <AreaCard
            label="Ingles Fluente"
            value={globalScore.ingles.value}
            color={Colors.green}
            colorDim={Colors.greenDim}
            icon={<Feather name="globe" size={18} color={Colors.green} />}
            subtitle={`${engStreak} dias de streak`}
            onPress={() => router.push('/(tabs)/skills')}
          />
          <AreaCard
            label="Programacao"
            value={globalScore.programacao.value}
            color={Colors.purple}
            colorDim={Colors.purpleDim}
            icon={<Feather name="code" size={18} color={Colors.purple} />}
            subtitle="Projetos, LeetCode, certs"
            onPress={() => router.push('/(tabs)/skills')}
          />
          <AreaCard
            label="Shape & Saude"
            value={globalScore.shape.value}
            color={Colors.orange}
            colorDim={Colors.orangeDim}
            icon={<Feather name="activity" size={18} color={Colors.orange} />}
            subtitle={`${workoutStreak} dias de treino`}
            onPress={() => router.push('/(tabs)/shape')}
          />
        </View>

        {/* Recent Sessions */}
        <SectionHeader
          title="Sessoes Recentes"
          actionLabel="Ver tudo"
          onAction={() => {}}
        />
        {todaySessions.length === 0 ? (
          <GlowCard color={Colors.border}>
            <Text style={styles.emptyText}>Nenhuma sessao hoje ainda. Comeca agora!</Text>
          </GlowCard>
        ) : (
          todaySessions.slice(0, 5).map((s) => (
            <GlowCard key={s.id} color={Colors.border} padding={12}>
              <View style={styles.sessionRow}>
                <View style={[styles.sessionDot, { backgroundColor: typeColor(s.type) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionType}>{typeLabel(s.type)}</Text>
                  <Text style={styles.sessionOutput} numberOfLines={1}>{s.output || 'Sem output'}</Text>
                </View>
                <View style={styles.sessionRight}>
                  <Text style={styles.sessionDuration}>{s.duration}min</Text>
                  <Text style={styles.sessionQuality}>Q{s.quality}</Text>
                </View>
              </View>
            </GlowCard>
          ))
        )}

        {/* Gap Indicator */}
        <SectionHeader title="Gap para Espanha" subtitle="Previsao baseada no progresso atual" />
        <GlowCard color={Colors.accent}>
          <View style={styles.gapRow}>
            <View style={styles.gapItem}>
              <Text style={styles.gapLabel}>Cenario Otimista</Text>
              <Text style={[styles.gapValue, { color: Colors.green }]}>2027</Text>
            </View>
            <View style={styles.gapDivider} />
            <View style={styles.gapItem}>
              <Text style={styles.gapLabel}>Cenario Base</Text>
              <Text style={[styles.gapValue, { color: Colors.accent }]}>2028</Text>
            </View>
            <View style={styles.gapDivider} />
            <View style={styles.gapItem}>
              <Text style={styles.gapLabel}>Cenario Pessimista</Text>
              <Text style={[styles.gapValue, { color: Colors.orange }]}>2029</Text>
            </View>
          </View>
        </GlowCard>
      </ScrollView>

      <QuickSessionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    faculdade: Colors.cyan,
    ingles: Colors.green,
    programacao: Colors.purple,
    shape: Colors.orange,
    geral: Colors.accent,
  };
  return map[type] || Colors.accent;
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    faculdade: 'Faculdade',
    ingles: 'Ingles',
    programacao: 'Programacao',
    shape: 'Shape',
    geral: 'Geral',
  };
  return map[type] || type;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  criticalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.redDim,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.red + '40',
  },
  criticalText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.red,
    flex: 1,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  quoteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
  },
  scoreStats: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    width: '45%',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 24,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  quickBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
  },
  areasWrap: {
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionType: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  sessionOutput: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sessionRight: {
    alignItems: 'flex-end',
  },
  sessionDuration: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  sessionQuality: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  gapRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gapItem: {
    alignItems: 'center',
    flex: 1,
  },
  gapLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  gapValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  gapDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
});
