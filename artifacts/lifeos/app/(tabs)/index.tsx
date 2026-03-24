import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SidebarToggle } from '@/components/Sidebar';
import { QuickSessionModal } from '@/components/QuickSessionModal';
import { GlowCard } from '@/components/ui/GlowCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { calcDayStatus, calcEnglishStreak, calcWorkoutStreak } from '@/services/score';
import { calcWeeklyWaste, isSunday } from '@/services/antifraud';

const MOTIVATIONAL = [
  'Cada sessão te aproxima do seu objetivo.',
  'Consistência bate talento todos os dias.',
  'Quem controla o dia controla o futuro.',
  'O gap fechou um pouco mais hoje.',
  'Você está construindo a vida que deseja.',
  'Pequenos ganhos diários geram grandes resultados.',
  'Continue firme — o resultado virá.',
];

const AREA_ROUTES: Record<string, string> = {
  faculdade: '/(tabs)/faculdade',
  ingles: '/(tabs)/ingles',
  programacao: '/(tabs)/programacao',
  shape: '/(tabs)/shape',
};

const AREA_COLORS: Record<string, string> = {
  faculdade: Colors.cyan,
  ingles: Colors.green,
  programacao: Colors.purple,
  shape: Colors.orange,
};

const AREA_ICONS: Record<string, string> = {
  faculdade: 'book',
  ingles: 'mic',
  programacao: 'code',
  shape: 'activity',
};

const AREA_LABELS: Record<string, string> = {
  faculdade: 'Faculdade',
  ingles: 'Inglês',
  programacao: 'Programação',
  shape: 'Shape & Saúde',
};

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const {
    globalScore,
    sessions,
    englishSessions,
    workoutLogs,
    progSessions,
    subjects,
    projects,
    weightLogs,
    loading,
    getDayStatus
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const quote = MOTIVATIONAL[today.getDay() % MOTIVATIONAL.length];

  const todayStatus = useMemo(() => calcDayStatus(sessions, todayKey), [sessions, todayKey]);
  const engStreak = useMemo(() => calcEnglishStreak(englishSessions), [englishSessions]);
  const workoutStreak = useMemo(() => calcWorkoutStreak(workoutLogs), [workoutLogs]);
  const weeklyWaste = useMemo(() => calcWeeklyWaste(sessions), [sessions]);

  const weekSunday = isSunday();

  // ==================== STREAK DO DUOLINGO ====================
  const currentStreak = useMemo(() => {
    let streak = 0;
    let checkDate = new Date();

    while (true) {
      const dateKey = checkDate.toISOString().slice(0, 10);
      const dayStatus = getDayStatus(dateKey);

      if (dayStatus.status === 'green') {
        streak++;
      } else {
        break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
      if (streak > 365) break;
    }

    return streak;
  }, [getDayStatus]);

  const streakColor = currentStreak >= 7 ? Colors.green :
    currentStreak >= 3 ? Colors.orange :
      currentStreak > 0 ? Colors.yellow : Colors.textMuted;

  React.useEffect(() => {
    if (loading) return;
    const checkAlerts = () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().slice(0, 10);
      const yStatus = getDayStatus(yKey);
      const tKey = new Date().toISOString().slice(0, 10);
      const tStatus = getDayStatus(tKey);

      if (yStatus.status === 'green' && tStatus.status !== 'green') {
        Alert.alert('🔥 Mantenha a chama!', 'Você ainda não validou hoje. Não quebre seu streak!');
      }
      if (weekSunday) {
        Alert.alert('📊 Revisão Semanal', 'Hoje é domingo! Revise seu progresso e planeje a próxima semana.');
      }
    };
    const timer = setTimeout(checkAlerts, 1000);
    return () => clearTimeout(timer);
  }, [loading, weekSunday, getDayStatus]);

  const scoreColor = globalScore.criticalMode
    ? Colors.red
    : globalScore.total >= 70
      ? Colors.green
      : globalScore.total >= 40
        ? Colors.orange
        : Colors.red;

  const dayStatusColor =
    todayStatus.status === 'green' ? Colors.green :
      todayStatus.status === 'yellow' ? Colors.orange : Colors.red;

  const dayLabel =
    todayStatus.status === 'green' ? 'Dia Válido ✓' :
      todayStatus.status === 'yellow' ? 'Dia Regular' : 'Sem Sessão';

  const ptDate = today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  const areaValues: Record<string, number> = {
    faculdade: globalScore.faculdade.value,
    ingles: globalScore.ingles.value,
    programacao: globalScore.programacao.value,
    shape: globalScore.shape.value,
  };

  const areaMetrics = useMemo(() => {
    const facDept = subjects.reduce((a, s) => a + s.absences, 0);
    const facPending = subjects.reduce((a, s) => a + s.activities.filter(ac => ac.status === 'pending').length, 0);
    const engHoursCount = Math.round(englishSessions.reduce((a, s) => a + s.duration, 0) / 60);
    const engLevel = engHoursCount > 200 ? 'B2' : engHoursCount > 100 ? 'B1' : 'A2';
    const activeProjs = projects.filter(p => p.status === 'building').length;
    const totalLeetcode = progSessions.filter(s => s.type === 'leetcode').length;
    const codedToday = progSessions.some(s => s.date === todayKey);
    const lastWeight = weightLogs[0]?.weight ?? 0;
    const startWeight = weightLogs[weightLogs.length - 1]?.weight ?? lastWeight;
    const weightVar = (lastWeight - startWeight).toFixed(1);
    const trainedToday = workoutLogs.some(w => w.date === todayKey);

    return {
      faculdade: `${facPending} pendentes · ${facDept} faltas`,
      ingles: `${engLevel} · ${engStreak}d · ${engHoursCount}h`,
      programacao: `${activeProjs} ativos · ${totalLeetcode} leetcode · ${codedToday ? '✓' : '✗'}`,
      shape: `${lastWeight}kg (${Number(weightVar) > 0 ? '+' : ''}${weightVar}) · ${workoutStreak}d · ${trainedToday ? '✓' : '✗'}`,
    };
  }, [subjects, englishSessions, engStreak, projects, progSessions, todayKey, weightLogs, workoutLogs, workoutStreak]);

  const areas = ['faculdade', 'ingles', 'programacao', 'shape'];

  const bgColor = globalScore.criticalMode ? '#0E0A0A' : Colors.bg;
  const cardBg = globalScore.criticalMode ? '#1A0A0A' : Colors.bgCard;

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) },
        ]}
      >
        <View style={styles.header}>
          <SidebarToggle />
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>Olá, Douglas! 👋</Text>
            <Text style={styles.date}>{ptDate}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/modal/configuracoes')} style={styles.headerIconBtn}>
            <Feather name="settings" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {globalScore.criticalMode && (
          <View style={styles.criticalBanner}>
            <Feather name="alert-triangle" size={16} color={Colors.red} />
            <Text style={styles.criticalText}>
              MODO CRÍTICO — {globalScore.redStreak} dias sem sessão válida
            </Text>
          </View>
        )}

        <View style={styles.scoreSection}>
          <ScoreRing value={globalScore.total} size={120} color={scoreColor} />
          <View style={styles.scoreInfo}>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreBig, { color: scoreColor }]}>{globalScore.total}</Text>
              <Feather
                name={globalScore.trend === 'up' ? 'trending-up' : globalScore.trend === 'down' ? 'trending-down' : 'minus'}
                size={22}
                color={globalScore.trend === 'up' ? Colors.green : globalScore.trend === 'down' ? Colors.red : Colors.textMuted}
              />
            </View>
            <Text style={styles.scoreLabel}>Score Global</Text>
            <Text style={[styles.dayStatus, { color: dayStatusColor }]}>{dayLabel}</Text>
            <Text style={styles.avg7}>Média 7d: {globalScore.avg7}min/dia</Text>
          </View>
        </View>

        {/* FOGO DO DUOLINGO */}
        <GlowCard color={streakColor} style={{ marginTop: 12, marginBottom: 16 }}>
          <View style={styles.streakContainer}>
            <View style={styles.streakFire}>
              <Feather name="zap" size={32} color={streakColor} />
              <Text style={[styles.streakNumber, { color: streakColor }]}>{currentStreak}</Text>
            </View>
            <View>
              <Text style={styles.streakTitle}>Streak</Text>
              <Text style={styles.streakSubtitle}>
                {currentStreak === 0
                  ? 'Faça uma sessão hoje para acender o fogo!'
                  : currentStreak === 1
                    ? '1 dia de consistência!'
                    : `${currentStreak} dias seguidos!`}
              </Text>
            </View>
          </View>
        </GlowCard>

        <View style={styles.scoreBreakdown}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Eficiência</Text>
            <Text style={[styles.scoreItemVal, { color: globalScore.efficiency >= 60 ? Colors.green : Colors.orange }]}>
              {globalScore.efficiency}%
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Foco</Text>
            <Text style={[styles.scoreItemVal, { color: globalScore.focus >= 60 ? Colors.green : Colors.orange }]}>
              {globalScore.focus}%
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Áreas</Text>
        <View style={styles.areasGrid}>
          {areas.map((area) => (
            <TouchableOpacity
              key={area}
              style={[styles.areaCard, { backgroundColor: cardBg, borderColor: AREA_COLORS[area] + '40' }]}
              onPress={() => router.push(AREA_ROUTES[area] as never)}
              activeOpacity={0.75}
            >
              <View style={styles.areaHeader}>
                <View style={[styles.areaIcon, { backgroundColor: AREA_COLORS[area] + '20' }]}>
                  <Feather name={AREA_ICONS[area] as never} size={18} color={AREA_COLORS[area]} />
                </View>
                <Text style={[styles.areaValue, { color: AREA_COLORS[area] }]}>{areaValues[area]}</Text>
              </View>
              <Text style={styles.areaLabel}>{AREA_LABELS[area]}</Text>
              <Text style={styles.areaMetric} numberOfLines={1}>{areaMetrics[area as keyof typeof areaMetrics]}</Text>
              <ProgressBar value={areaValues[area]} color={AREA_COLORS[area]} height={4} />
            </TouchableOpacity>
          ))}
        </View>

        {weekSunday && (
          <GlowCard color={Colors.purple}>
            <View style={styles.weeklyRow}>
              <Feather name="calendar" size={18} color={Colors.purple} />
              <Text style={styles.weeklyTitle}>Revisão Semanal — Domingo</Text>
            </View>
            <Text style={styles.weeklyStat}>
              ⚠️ Desperdício essa semana: {weeklyWaste}min em sessões de baixa qualidade
            </Text>
            <Text style={styles.weeklyAction}>
              💡 Ação: Identifique e elimine sua maior distração hoje.
            </Text>
          </GlowCard>
        )}

        <View style={[styles.quoteCard, { backgroundColor: cardBg }]}>
          <Feather name="zap" size={14} color={Colors.accent} />
          <Text style={styles.quoteText}>{quote}</Text>
        </View>

        <Text style={styles.sectionTitle}>Últimas Sessões</Text>
        {sessions.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma sessão ainda. Comece agora!</Text>
        ) : (
          sessions.slice(0, 5).map((s) => (
            <View key={s.id} style={[styles.sessionRow, { backgroundColor: cardBg }]}>
              <View style={[styles.sessionDot, { backgroundColor: AREA_COLORS[s.type] ?? Colors.accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionType}>{AREA_LABELS[s.type] ?? s.type}</Text>
                <Text style={styles.sessionMeta}>{s.duration}min · Q{s.quality}/10{s.output ? ` · ${s.output.slice(0, 40)}` : ''}</Text>
              </View>
              <Text style={styles.sessionDate}>{s.date.slice(5, 10)}</Text>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingSessaoBtn}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
      >
        <Feather name="plus" size={30} color={Colors.white} />
      </TouchableOpacity>

      <QuickSessionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headerCenter: { flex: 1 },
  greeting: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textTransform: 'capitalize' },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  criticalBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.redDim, borderRadius: 12, padding: 12, marginBottom: 12 },
  criticalText: { color: Colors.red, fontSize: 13, fontFamily: 'Inter_700Bold', flex: 1 },
  scoreSection: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 12 },
  scoreInfo: { flex: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreBig: { fontSize: 52, fontFamily: 'Inter_700Bold', lineHeight: 58 },
  scoreLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  dayStatus: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  avg7: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  scoreBreakdown: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  scoreItem: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  scoreItemLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 4 },
  scoreItemVal: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  streakContainer: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  streakFire: { alignItems: 'center' },
  streakNumber: { fontSize: 28, fontFamily: 'Inter_700Bold', marginTop: 4 },
  streakTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  streakSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 10, marginTop: 4 },
  areasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  areaCard: { width: '48%', borderRadius: 14, padding: 14, borderWidth: 1, gap: 5 },
  areaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  areaIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  areaLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.text },
  areaMetric: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 4 },
  areaValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  weeklyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  weeklyTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text },
  weeklyStat: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 6 },
  weeklyAction: { fontSize: 13, color: Colors.purple, fontFamily: 'Inter_600SemiBold' },
  quoteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.accentDim },
  quoteText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, fontStyle: 'italic' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  sessionDot: { width: 10, height: 10, borderRadius: 5 },
  sessionType: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  sessionMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  sessionDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  emptyText: { fontSize: 13, color: Colors.textMuted, fontFamily: 'Inter_400Regular', textAlign: 'center', marginVertical: 16 },
  floatingSessaoBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10
  },
});
