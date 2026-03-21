import type { Session } from '@/constants/types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSession(
  session: Omit<Session, 'id' | 'createdAt'>,
  existing: Session[]
): ValidationResult {
  if (session.duration < 5) {
    return { valid: false, error: 'Duração mínima é 5 minutos.' };
  }
  if (session.duration > 240) {
    return { valid: false, error: 'Duração máxima é 4 horas (240 min).' };
  }
  if (session.quality < 1 || session.quality > 10) {
    return { valid: false, error: 'Qualidade deve ser entre 1 e 10.' };
  }

  const todayKey = session.date.slice(0, 10);
  const todaySameType = existing.filter(
    (s) => s.date.slice(0, 10) === todayKey && s.type === session.type
  );
  if (todaySameType.length >= 5) {
    return { valid: false, error: 'Máximo de 5 sessões do mesmo tipo por dia.' };
  }

  const totalTodayMinutes = todaySameType.reduce((a, s) => a + s.duration, 0) + session.duration;
  if (totalTodayMinutes > 480) {
    return { valid: false, error: 'Total de horas do dia excede 8h nessa categoria.' };
  }

  return { valid: true };
}

export function isDayValid(sessions: Session[], dateKey?: string): boolean {
  const key = dateKey ?? new Date().toISOString().slice(0, 10);
  const daySessions = sessions.filter((s) => s.date.slice(0, 10) === key);
  if (daySessions.length === 0) return false;
  const totalMinutes = daySessions.reduce((a, s) => a + s.duration, 0);
  return totalMinutes >= 30;
}

export function isSunday(): boolean {
  return new Date().getDay() === 0;
}

export function calcWeeklyWaste(sessions: Session[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const recent = sessions.filter((s) => new Date(s.date) >= cutoff);
  const lowQuality = recent.filter((s) => s.quality < 5);
  return lowQuality.reduce((a, s) => a + s.duration, 0);
}
