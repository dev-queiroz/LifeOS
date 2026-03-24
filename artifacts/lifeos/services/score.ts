import type { EnglishSession, ProgSession, Session, WorkoutLog } from '@/constants/types';

export interface DayStatus {
  date: string;
  status: 'green' | 'yellow' | 'red';
  totalMinutes: number;
  avgQuality: number;
}

export interface CompositeScore {
  total: number;
  consistency: number;
  efficiency: number;
  focus: number;
  trend: 'up' | 'down' | 'stable';
  criticalMode: boolean;
  redStreak: number;
  dayValid: boolean;
  avg7: number;
  currentStreak: number;
}

export function calcCurrentStreak(sessions: Session[]): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime());
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const ds = calcDayStatus(sessions, key);
    
    if (ds.status === 'green') {
      streak++;
    } else if (i === 0) {
      // Hoje ainda não é verde, mas a sequência continua se ontem foi verde
      continue;
    } else {
      // Um dia anterior não foi verde, quebou a sequência
      break;
    }
  }
  return streak;
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function last7Keys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(dateKey(d));
  }
  return keys;
}

export function calcDayStatus(sessions: Session[], date: string): DayStatus {
  const daySessions = sessions.filter((s) => s.date.slice(0, 10) === date);
  if (daySessions.length === 0) return { date, status: 'red', totalMinutes: 0, avgQuality: 0 };
  const totalMinutes = daySessions.reduce((a, s) => a + s.duration, 0);
  const avgQuality = daySessions.reduce((a, s) => a + s.quality, 0) / daySessions.length;
  let status: 'green' | 'yellow' | 'red';
  if (totalMinutes >= 60 && avgQuality >= 7) status = 'green';
  else if (totalMinutes >= 30 && avgQuality >= 4) status = 'yellow';
  else status = 'red';
  return { date, status, totalMinutes, avgQuality };
}

export function calcConsistency(sessions: Session[]): number {
  const keys = last7Keys();
  const greenOrYellow = keys.filter((k) => {
    const ds = calcDayStatus(sessions, k);
    return ds.status !== 'red';
  });
  return Math.round((greenOrYellow.length / 7) * 100);
}

export function calcEfficiency(
  sessions: Session[],
  englishSessions: EnglishSession[],
  workoutLogs: WorkoutLog[]
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const recent = sessions.filter((s) => new Date(s.date) >= cutoff);
  const recentEng = englishSessions.filter((s) => new Date(s.date) >= cutoff);
  const recentWorkout = workoutLogs.filter((w) => new Date(w.date) >= cutoff);
  const allQualities = [
    ...recent.map((s) => s.quality),
    ...recentEng.map((s) => (s.score ?? 5)),
    ...recentWorkout.map(() => 7),
  ];
  if (allQualities.length === 0) return 0;
  const avg = allQualities.reduce((a, b) => a + b, 0) / allQualities.length;
  return Math.round((avg / 10) * 100);
}

export function calcFocus(sessions: Session[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const recent = sessions.filter((s) => new Date(s.date) >= cutoff);
  if (recent.length === 0) return 0;
  const avgDuration = recent.reduce((a, s) => a + s.duration, 0) / recent.length;
  return Math.round(Math.min(1, avgDuration / 60) * 100);
}

export function calcRedStreak(sessions: Session[]): number {
  const keys = last7Keys();
  let streak = 0;
  for (const k of keys) {
    const ds = calcDayStatus(sessions, k);
    if (ds.status === 'red') streak++;
    else break;
  }
  return streak;
}

export function calcGlobalScore(
  sessions: Session[],
  englishSessions: EnglishSession[],
  workoutLogs: WorkoutLog[]
): CompositeScore {
  const consistency = calcConsistency(sessions);
  const efficiency = calcEfficiency(sessions, englishSessions, workoutLogs);
  const focus = calcFocus(sessions);
  const total = Math.round(consistency * 0.4 + efficiency * 0.3 + focus * 0.3);

  const redStreak = calcRedStreak(sessions);
  const criticalMode = redStreak >= 3;

  const todayKey = dateKey(new Date());
  const todayStatus = calcDayStatus(sessions, todayKey);
  const dayValid = todayStatus.status !== 'red';

  const keys = last7Keys();
  const dailyTotals = keys.map((k) => calcDayStatus(sessions, k).totalMinutes);
  const avg7 = Math.round(dailyTotals.reduce((a, b) => a + b, 0) / 7);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = dateKey(yesterday);
  const yScore = calcDayStatus(sessions, yKey);
  const trend: 'up' | 'down' | 'stable' =
    todayStatus.totalMinutes > yScore.totalMinutes
      ? 'up'
      : todayStatus.totalMinutes < yScore.totalMinutes
      ? 'down'
      : 'stable';

  const currentStreak = calcCurrentStreak(sessions);

  return { total, consistency, efficiency, focus, trend, criticalMode, redStreak, dayValid, avg7, currentStreak };
}

export function calcEnglishHours(sessions: EnglishSession[]): number {
  return Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60);
}

export function calcEnglishStreak(sessions: EnglishSession[]): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime());
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const found = sessions.some((s) => s.date.slice(0, 10) === key);
    if (found) streak++;
    else break;
  }
  return streak;
}

export function calcWorkoutStreak(workoutLogs: WorkoutLog[]): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime());
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const found = workoutLogs.some((w) => w.date.slice(0, 10) === key);
    if (found) streak++;
    else break;
  }
  return streak;
}

export function calcProgStats(sessions: ProgSession[], projects: import('@/constants/types').Project[]) {
  const leetcode = sessions.filter((s) => s.type === 'leetcode').length;
  const features = projects.reduce((a, p) => a + (p.featuresList?.length || 0), 0);
  const bugs = projects.reduce((a, p) => a + (p.bugsList?.length || 0), 0);
  const deploys = projects.reduce((a, p) => a + (p.deploysList?.length || 0), 0);
  const totalHours = Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60);

  // Top Language
  const techCounts: Record<string, number> = {};
  projects.forEach(p => p.tech.forEach(t => {
    techCounts[t] = (techCounts[t] || 0) + 1;
  }));
  const topLanguage = Object.keys(techCounts).sort((a, b) => techCounts[b] - techCounts[a])[0] || 'N/A';

  // Streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime());
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const found = sessions.some((s) => s.date.slice(0, 10) === key);
    if (found) streak++;
    else if (i > 0) break; // Allow skip today if not yet logged, but if i=0 and not found, continue to check yesterday? 
    // Actually, traditionally streak is broken if yesterday is missing.
    if (i > 0 && !found) break;
  }

  return { leetcode, features, bugs, deploys, totalHours, topLanguage, streak };
}

export function planProgress(sessions: Session[], englishSessions: EnglishSession[], progSessions: ProgSession[]): number[] {
  const engHours = calcEnglishHours(englishSessions);
  const progHours = Math.round(progSessions.reduce((a, s) => a + s.duration, 0) / 60);
  const studyHours = Math.round(sessions.filter((s) => s.type === 'faculdade').reduce((a, s) => a + s.duration, 0) / 60);

  const f1 = Math.min(100, Math.round((engHours / 500) * 100));
  const f2 = Math.min(100, Math.round((progHours / 1000) * 100));
  const f3 = Math.min(100, Math.round((studyHours / 2000) * 100));
  const f4 = Math.min(100, Math.round(((engHours + progHours) / 1500) * 50));
  const f5 = Math.min(100, Math.round(((engHours + progHours + studyHours) / 3500) * 100));

  return [f1, f2, f3, f4, f5];
}

export function forecast2031(
  sessions: Session[],
  englishSessions: EnglishSession[],
  progSessions: ProgSession[]
): { otimista: number; realista: number; pessimista: number } {
  const totalHours =
    Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60) +
    Math.round(englishSessions.reduce((a, s) => a + s.duration, 0) / 60) +
    Math.round(progSessions.reduce((a, s) => a + s.duration, 0) / 60);
  const weeksActive = Math.max(1, sessions.length / 5);
  const hPerWeek = totalHours / weeksActive;
  const yearsLeft = 2031 - new Date().getFullYear();
  const weeksLeft = yearsLeft * 52;
  const projected = totalHours + hPerWeek * weeksLeft;
  const target = 5000;
  const pct = Math.min(100, Math.round((projected / target) * 100));
  return {
    otimista: Math.min(100, pct + 15),
    realista: pct,
    pessimista: Math.max(0, pct - 20),
  };
}
