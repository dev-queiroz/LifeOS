import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
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
import { calcDayStatus, calcEnglishStreak, calcWorkoutStreak, forecast2031 } from '@/services/score';
import { calcWeeklyWaste, isSunday } from '@/services/antifraud';

const MOTIVATIONAL = [
  'Cada sessão te aproxima da Alemanha em 2031.',
  'Consistência bate talento todos os dias.',
  'Quem controla o dia controla o futuro.',
  'O gap fechou um pouco mais hoje.',
  'Você está construindo a vida dos seus sonhos.',
  'Berlim te espera — continue.',
  'Pequenos ganhos diários = grande salto em 2031.',
];

const AREA_ROUTES: Record<string, string> = {
  faculdade: '/(tabs)/faculdade',
  ingles: '/(tabs)/ingles',
  programacao: '/(tabs)/programacao',
  shape: '/(tabs)/shape',
  plano2031: '/(tabs)/plano',
};

const AREA_COLORS: Record<string, string> = {
  faculdade: Colors.cyan,
  ingles: Colors.green,
  programacao: Colors.purple,
  shape: Colors.orange,
  plano2031: Colors.accent,
};

const AREA_ICONS: Record<string, string> = {
  faculdade: 'book',
  ingles: 'mic',
  programacao: 'code',
  shape: 'activity',
  plano2031: 'star',
};

const AREA_LABELS: Record<string, string> = {
  faculdade: 'Faculdade',
  ingles: 'Inglês',
  programacao: 'Programação',
  shape: 'Shape',
  plano2031: 'Plano 2031',
};

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { globalScore, sessions, englishSessions, workoutLogs, progSessions } = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const quote = MOTIVATIONAL[today.getDay() % MOTIVATIONAL.length];

  const todayStatus = useMemo(() => calcDayStatus(sessions, todayKey), [sessions, todayKey]);
  const engStreak = useMemo(() => calcEnglishStreak(englishSessions), [englishSessions]);
  const workoutStreak = useMemo(() => calcWorkoutStreak(workoutLogs), [workoutLogs]);
  const weeklyWaste = useMemo(() => calcWeeklyWaste(sessions), [sessions]);
  const forecast = useMemo(
    () => forecast2031(sessions, englishSessions, progSessions),
    [sessions, englishSessions, progSessions]
  );

  const weekSunday = isSunday();

  const scoreColor = globalScore.criticalMode
    ? Colors.red
    : globalScore.total >= 70
    ? Colors.green
    : globalScore.total >= 40
    ? Colors.orange
    : Colors.red;

  const dayStatusColor =
    todayStatus.status === 'green'
      ? Colors.green
      : todayStatus.status === 'yellow'
      ? Colors.orange
      : Colors.red;

  const dayLabel =
    todayStatus.status === 'green'
      ? 'Dia Válido ✓'
      : todayStatus.status === 'yellow'
      ? 'Dia Regular'
      : 'Sem Sessão';

  const ptDate = today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  const areas = ['faculdade', 'ingles', 'programacao', 'shape', 'plano2031'];
  const areaValues: Record<string, number> = {
    faculdade: globalScore.faculdade.value,
    ingles: globalScore.ingles.value,
    programacao: globalScore.programacao.value,
    shape: globalScore.shape.value,
    plano2031: Math.round((globalScore.faculdade.value + globalScore.ingles.value + globalScore.programacao.value) / 3),
  };

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
            <Text style={styles.greeting}>Olá 👋</Text>
            <Text style={styles.date}>{ptDate}</Text>
          </View>
          <View style={[styles.dayDot, { backgroundColor: dayStatusColor + '30', borderColor: dayStatusColor }]}>
            <Text style={[styles.dayDotText, { color: dayStatusColor }]}>
              {todayStatus.status === 'green' ? '●' : todayStatus.status === 'yellow' ? '◑' : '○'}
            </Text>
          </View>
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

        <View style={styles.scoreBreakdown}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Consist.</Text>
            <Text style={[styles.scoreItemVal, { color: globalScore.consistency >= 60 ? Colors.green : Colors.orange }]}>
              {globalScore.consistency}
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Eficiên.</Text>
            <Text style={[styles.scoreItemVal, { color: globalScore.efficiency >= 60 ? Colors.green : Colors.orange }]}>
              {globalScore.efficiency}
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Foco</Text>
            <Text style={[styles.scoreItemVal, { color: globalScore.focus >= 60 ? Colors.green : Colors.orange }]}>
              {globalScore.focus}
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Streak</Text>
            <Text style={[styles.scoreItemVal, { color: Colors.accent }]}>{engStreak}d</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color={Colors.white} />
          <Text style={styles.quickBtnText}>+ Sessão Rápida</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Áreas</Text>
        <View style={styles.areasGrid}>
          {areas.map((area) => (
            <TouchableOpacity
              key={area}
              style={[styles.areaCard, { backgroundColor: cardBg, borderColor: AREA_COLORS[area] + '40' }]}
              onPress={() => router.push(AREA_ROUTES[area] as never)}
              activeOpacity={0.75}
            >
              <View style={[styles.areaIcon, { backgroundColor: AREA_COLORS[area] + '20' }]}>
                <Feather name={AREA_ICONS[area] as never} size={18} color={AREA_COLORS[area]} />
              </View>
              <Text style={styles.areaLabel}>{AREA_LABELS[area]}</Text>
              <Text style={[styles.areaValue, { color: AREA_COLORS[area] }]}>{areaValues[area]}</Text>
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

        <View style={[styles.forecastCard, { backgroundColor: cardBg }]}>
          <Text style={styles.sectionTitle}>Previsão 2031</Text>
          <View style={styles.forecastRow}>
            <View style={[styles.forecastItem, { borderColor: Colors.green + '40' }]}>
              <Text style={[styles.forecastPct, { color: Colors.green }]}>{forecast.otimista}%</Text>
              <Text style={styles.forecastLabel}>Otimista</Text>
            </View>
            <View style={[styles.forecastItem, { borderColor: Colors.accent + '40' }]}>
              <Text style={[styles.forecastPct, { color: Colors.accent }]}>{forecast.realista}%</Text>
              <Text style={styles.forecastLabel}>Realista</Text>
            </View>
            <View style={[styles.forecastItem, { borderColor: Colors.orange + '40' }]}>
              <Text style={[styles.forecastPct, { color: Colors.orange }]}>{forecast.pessimista}%</Text>
              <Text style={styles.forecastLabel}>Pessimista</Text>
            </View>
          </View>
        </View>

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
  dayDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dayDotText: { fontSize: 16 },
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
  quickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14, marginBottom: 20 },
  quickBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 10, marginTop: 4 },
  areasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  areaCard: { width: '47%', borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  areaIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  areaLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  areaValue: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  weeklyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  weeklyTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text },
  weeklyStat: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 6 },
  weeklyAction: { fontSize: 13, color: Colors.purple, fontFamily: 'Inter_600SemiBold' },
  forecastCard: { borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  forecastRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  forecastItem: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12, alignItems: 'center' },
  forecastPct: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  forecastLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  quoteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.accentDim },
  quoteText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, fontStyle: 'italic' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  sessionDot: { width: 10, height: 10, borderRadius: 5 },
  sessionType: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  sessionMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  sessionDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  emptyText: { fontSize: 13, color: Colors.textMuted, fontFamily: 'Inter_400Regular', textAlign: 'center', marginVertical: 16 },
});
