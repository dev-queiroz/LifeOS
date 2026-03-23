import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage';
import type {
  Certification,
  EnglishSession,
  FinanceEntry,
  FreelanceProject,
  GlobalScore,
  Note,
  PlanGoal,
  Project,
  ProgSession,
  Flashcard,
  Session,
  Settings,
  Simulation,
  Subject,
  WaterLog,
  WeightLog,
  WorkoutLog,
} from '@/constants/types';
import {
  calcGlobalScore,
  calcDayStatus,
} from '@/services/score';

interface AppContextValue {
  sessions: Session[];
  subjects: Subject[];
  weightLogs: WeightLog[];
  workoutLogs: WorkoutLog[];
  waterLogs: WaterLog[];
  englishSessions: EnglishSession[];
  progSessions: ProgSession[];
  projects: Project[];
  certifications: Certification[];
  notes: Note[];
  finances: FinanceEntry[];
  freelance: FreelanceProject[];
  simulations: Simulation[];
  planGoals: PlanGoal[];
  flashcards: Flashcard[];
  settings: Settings;
  globalScore: GlobalScore;
  loading: boolean;

  addSession: (s: Omit<Session, 'id' | 'createdAt'>) => Promise<{ error?: string }>;
  updateSession: (s: Session) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  addSubject: (s: Omit<Subject, 'id'>) => Promise<void>;
  updateSubject: (s: Subject) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  addAbsence: (subjectId: string, date: string) => Promise<void>;
  removeAbsence: (subjectId: string) => Promise<void>;

  addWeightLog: (w: Omit<WeightLog, 'id'>) => Promise<void>;
  deleteWeightLog: (id: string) => Promise<void>;

  addWorkoutLog: (w: Omit<WorkoutLog, 'id'>) => Promise<void>;
  deleteWorkoutLog: (id: string) => Promise<void>;

  addWaterLog: (ml: number) => Promise<void>;
  getTodayWater: () => number;

  addEnglishSession: (e: Omit<EnglishSession, 'id'>) => Promise<void>;
  deleteEnglishSession: (id: string) => Promise<void>;

  addProgSession: (p: Omit<ProgSession, 'id'>) => Promise<void>;
  deleteProgSession: (id: string) => Promise<void>;

  addProject: (p: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addCertification: (c: Omit<Certification, 'id'>) => Promise<void>;
  updateCertification: (c: Certification) => Promise<void>;
  deleteCertification: (id: string) => Promise<void>;

  addNote: (n: Omit<Note, 'id'>) => Promise<void>;
  updateNote: (n: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  addFinance: (f: Omit<FinanceEntry, 'id'>) => Promise<void>;
  deleteFinance: (id: string) => Promise<void>;

  addFreelance: (f: Omit<FreelanceProject, 'id'>) => Promise<void>;
  updateFreelance: (f: FreelanceProject) => Promise<void>;
  deleteFreelance: (id: string) => Promise<void>;

  addSimulation: (s: Omit<Simulation, 'id'>) => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;

  addPlanGoal: (g: Omit<PlanGoal, 'id'>) => Promise<void>;
  updatePlanGoal: (g: PlanGoal) => Promise<void>;
  deletePlanGoal: (id: string) => Promise<void>;

  addFlashcard: (f: Omit<Flashcard, 'id' | 'createdAt'>) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;

  updateSettings: (s: Partial<Settings>) => Promise<void>;

  getDayStatus: (date: string) => { status: 'green' | 'yellow' | 'red'; totalMinutes: number };
}

const AppContext = createContext<AppContextValue | null>(null);

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function save<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function computeAreaScore(sessions: Session[], type: string): import('@/constants/types').AreaScore {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const recent = sessions.filter((s) => s.type === type && new Date(s.date) >= cutoff);
  if (recent.length === 0) return { value: 0, trend: 'stable', label: type };
  const totalMin = recent.reduce((a, s) => a + s.duration, 0);
  const avgQ = recent.reduce((a, s) => a + s.quality, 0) / recent.length;
  const value = Math.min(100, Math.round((totalMin / 300) * 60 + avgQ * 4));
  return { value, trend: 'stable', label: type };
}

function computeGlobal(
  sessions: Session[],
  englishSessions: EnglishSession[],
  weightLogs: WeightLog[],
  workoutLogs: WorkoutLog[]
): GlobalScore {
  const cs = calcGlobalScore(sessions, englishSessions, workoutLogs);

  const engCutoff = new Date();
  engCutoff.setDate(engCutoff.getDate() - 7);
  const recentEng = englishSessions.filter((s) => new Date(s.date) >= engCutoff);
  const engMin = recentEng.reduce((a, s) => a + s.duration, 0);
  const engValue = Math.min(100, Math.round((engMin / 420) * 100));

  const workoutCutoff = new Date();
  workoutCutoff.setDate(workoutCutoff.getDate() - 7);
  const recentWork = workoutLogs.filter((w) => new Date(w.date) >= workoutCutoff);
  const shapeValue = Math.min(100, Math.round((recentWork.length / 4) * 100));

  return {
    total: cs.total,
    consistency: cs.consistency,
    efficiency: cs.efficiency,
    focus: cs.focus,
    faculdade: computeAreaScore(sessions, 'faculdade'),
    ingles: { value: engValue, trend: 'stable', label: 'Inglês' },
    programacao: computeAreaScore(sessions, 'programacao'),
    shape: { value: shapeValue, trend: 'stable', label: 'Shape' },
    trend: cs.trend,
    criticalMode: cs.criticalMode,
    redStreak: cs.redStreak,
    dayValid: cs.dayValid,
    avg7: cs.avg7,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [englishSessions, setEnglishSessions] = useState<EnglishSession[]>([]);
  const [progSessions, setProgSessions] = useState<ProgSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [finances, setFinances] = useState<FinanceEntry[]>([]);
  const [freelance, setFreelance] = useState<FreelanceProject[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [planGoals, setPlanGoals] = useState<PlanGoal[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [settings, setSettings] = useState<Settings>({ quickMode: true, haptics: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [s, sub, w, wo, wl, es, ps, proj, certs, n, fin, free, sims, goals, flash, set] =
        await Promise.all([
          load<Session[]>(STORAGE_KEYS.SESSIONS, []),
          load<Subject[]>(STORAGE_KEYS.SUBJECTS, []),
          load<WeightLog[]>(STORAGE_KEYS.WEIGHT_LOGS, []),
          load<WorkoutLog[]>(STORAGE_KEYS.WORKOUT_LOGS, []),
          load<WaterLog[]>('water_logs', []),
          load<EnglishSession[]>(STORAGE_KEYS.ENGLISH_SESSIONS, []),
          load<ProgSession[]>(STORAGE_KEYS.PROG_SESSIONS, []),
          load<Project[]>(STORAGE_KEYS.PROJECTS, []),
          load<Certification[]>(STORAGE_KEYS.CERTIFICATIONS, []),
          load<Note[]>(STORAGE_KEYS.NOTES, []),
          load<FinanceEntry[]>(STORAGE_KEYS.FINANCES, []),
          load<FreelanceProject[]>(STORAGE_KEYS.FREELANCE, []),
          load<Simulation[]>(STORAGE_KEYS.SIMULATIONS, []),
          load<PlanGoal[]>('plan_goals', []),
          load<Flashcard[]>(STORAGE_KEYS.FLASHCARDS, []),
          load<Settings>(STORAGE_KEYS.SETTINGS, { quickMode: true, haptics: true }),
        ]);
      setSessions(s);
      setSubjects(sub);
      setWeightLogs(w);
      setWorkoutLogs(wo);
      setWaterLogs(wl);
      setEnglishSessions(es);
      setProgSessions(ps);
      setProjects(proj);
      setCertifications(certs);
      setNotes(n);
      setFinances(fin);
      setFreelance(free);
      setSimulations(sims);
      setPlanGoals(goals);
      setFlashcards(flash);
      setSettings(set);
      setLoading(false);
    };
    init();
  }, []);

  const globalScore = useMemo(
    () => computeGlobal(sessions, englishSessions, weightLogs, workoutLogs),
    [sessions, englishSessions, weightLogs, workoutLogs]
  );

  const addSession = useCallback(
    async (s: Omit<Session, 'id' | 'createdAt'>): Promise<{ error?: string }> => {
      const { validateSession } = await import('@/services/antifraud');
      const result = validateSession(s as Session, sessions);
      if (!result.valid) return { error: result.error };
      setSessions((prev) => {
        const next = [{ ...s, id: genId(), createdAt: new Date().toISOString() } as Session, ...prev];
        save(STORAGE_KEYS.SESSIONS, next);
        return next;
      });
      return {};
    },
    [sessions]
  );

  const updateSession = useCallback(async (s: Session) => {
    setSessions((prev) => {
      const next = prev.map((x) => (x.id === s.id ? s : x));
      save(STORAGE_KEYS.SESSIONS, next);
      return next;
    });
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.SESSIONS, next);
      return next;
    });
  }, []);

  const addSubject = useCallback(async (s: Omit<Subject, 'id'>) => {
    setSubjects((prev) => {
      const next = [{ ...s, id: genId() }, ...prev];
      save(STORAGE_KEYS.SUBJECTS, next);
      return next;
    });
  }, []);

  const updateSubject = useCallback(async (s: Subject) => {
    setSubjects((prev) => {
      const next = prev.map((x) => (x.id === s.id ? s : x));
      save(STORAGE_KEYS.SUBJECTS, next);
      return next;
    });
  }, []);

  const deleteSubject = useCallback(async (id: string) => {
    setSubjects((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.SUBJECTS, next);
      return next;
    });
  }, []);

  const addAbsence = useCallback(async (subjectId: string, _date: string) => {
    setSubjects((prev) => {
      const next = prev.map((s) =>
        s.id === subjectId ? { ...s, absences: s.absences + 1 } : s
      );
      save(STORAGE_KEYS.SUBJECTS, next);
      return next;
    });
  }, []);

  const removeAbsence = useCallback(async (subjectId: string) => {
    setSubjects((prev) => {
      const next = prev.map((s) =>
        s.id === subjectId ? { ...s, absences: Math.max(0, s.absences - 1) } : s
      );
      save(STORAGE_KEYS.SUBJECTS, next);
      return next;
    });
  }, []);

  const addWeightLog = useCallback(async (w: Omit<WeightLog, 'id'>) => {
    setWeightLogs((prev) => {
      const next = [{ ...w, id: genId() }, ...prev];
      save(STORAGE_KEYS.WEIGHT_LOGS, next);
      return next;
    });
  }, []);

  const deleteWeightLog = useCallback(async (id: string) => {
    setWeightLogs((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.WEIGHT_LOGS, next);
      return next;
    });
  }, []);

  const addWorkoutLog = useCallback(async (w: Omit<WorkoutLog, 'id'>) => {
    setWorkoutLogs((prev) => {
      const next = [{ ...w, id: genId() }, ...prev];
      save(STORAGE_KEYS.WORKOUT_LOGS, next);
      return next;
    });
  }, []);

  const deleteWorkoutLog = useCallback(async (id: string) => {
    setWorkoutLogs((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.WORKOUT_LOGS, next);
      return next;
    });
  }, []);

  const addWaterLog = useCallback(async (ml: number) => {
    const todayKey = new Date().toISOString().slice(0, 10);
    setWaterLogs((prev) => {
      const next = [{ id: genId(), ml, date: todayKey }, ...prev];
      save('water_logs', next);
      return next;
    });
  }, []);

  const getTodayWater = useCallback((): number => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return waterLogs
      .filter((w) => w.date === todayKey)
      .reduce((a, w) => a + w.ml, 0);
  }, [waterLogs]);

  const addEnglishSession = useCallback(async (e: Omit<EnglishSession, 'id'>) => {
    setEnglishSessions((prev) => {
      const next = [{ ...e, id: genId() }, ...prev];
      save(STORAGE_KEYS.ENGLISH_SESSIONS, next);
      return next;
    });
  }, []);

  const deleteEnglishSession = useCallback(async (id: string) => {
    setEnglishSessions((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.ENGLISH_SESSIONS, next);
      return next;
    });
  }, []);

  const addProgSession = useCallback(async (p: Omit<ProgSession, 'id'>) => {
    setProgSessions((prev) => {
      const next = [{ ...p, id: genId() }, ...prev];
      save(STORAGE_KEYS.PROG_SESSIONS, next);
      return next;
    });
  }, []);

  const deleteProgSession = useCallback(async (id: string) => {
    setProgSessions((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.PROG_SESSIONS, next);
      return next;
    });
  }, []);

  const addProject = useCallback(async (p: Omit<Project, 'id'>) => {
    setProjects((prev) => {
      const next = [{ ...p, id: genId() }, ...prev];
      save(STORAGE_KEYS.PROJECTS, next);
      return next;
    });
  }, []);

  const updateProject = useCallback(async (p: Project) => {
    setProjects((prev) => {
      const next = prev.map((x) => (x.id === p.id ? p : x));
      save(STORAGE_KEYS.PROJECTS, next);
      return next;
    });
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setProjects((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.PROJECTS, next);
      return next;
    });
  }, []);

  const addCertification = useCallback(async (c: Omit<Certification, 'id'>) => {
    setCertifications((prev) => {
      const next = [{ ...c, id: genId() }, ...prev];
      save(STORAGE_KEYS.CERTIFICATIONS, next);
      return next;
    });
  }, []);

  const updateCertification = useCallback(async (c: Certification) => {
    setCertifications((prev) => {
      const next = prev.map((x) => (x.id === c.id ? c : x));
      save(STORAGE_KEYS.CERTIFICATIONS, next);
      return next;
    });
  }, []);

  const deleteCertification = useCallback(async (id: string) => {
    setCertifications((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.CERTIFICATIONS, next);
      return next;
    });
  }, []);

  const addNote = useCallback(async (n: Omit<Note, 'id'>) => {
    setNotes((prev) => {
      const next = [{ ...n, id: genId() }, ...prev];
      save(STORAGE_KEYS.NOTES, next);
      return next;
    });
  }, []);

  const updateNote = useCallback(async (n: Note) => {
    setNotes((prev) => {
      const next = prev.map((x) => (x.id === n.id ? n : x));
      save(STORAGE_KEYS.NOTES, next);
      return next;
    });
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    setNotes((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.NOTES, next);
      return next;
    });
  }, []);

  const addFinance = useCallback(async (f: Omit<FinanceEntry, 'id'>) => {
    setFinances((prev) => {
      const next = [{ ...f, id: genId() }, ...prev];
      save(STORAGE_KEYS.FINANCES, next);
      return next;
    });
  }, []);

  const deleteFinance = useCallback(async (id: string) => {
    setFinances((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.FINANCES, next);
      return next;
    });
  }, []);

  const addFreelance = useCallback(async (f: Omit<FreelanceProject, 'id'>) => {
    setFreelance((prev) => {
      const next = [{ ...f, id: genId() }, ...prev];
      save(STORAGE_KEYS.FREELANCE, next);
      return next;
    });
  }, []);

  const updateFreelance = useCallback(async (f: FreelanceProject) => {
    setFreelance((prev) => {
      const next = prev.map((x) => (x.id === f.id ? f : x));
      save(STORAGE_KEYS.FREELANCE, next);
      return next;
    });
  }, []);

  const deleteFreelance = useCallback(async (id: string) => {
    setFreelance((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.FREELANCE, next);
      return next;
    });
  }, []);

  const addSimulation = useCallback(async (s: Omit<Simulation, 'id'>) => {
    setSimulations((prev) => {
      const next = [{ ...s, id: genId() }, ...prev];
      save(STORAGE_KEYS.SIMULATIONS, next);
      return next;
    });
  }, []);

  const deleteSimulation = useCallback(async (id: string) => {
    setSimulations((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.SIMULATIONS, next);
      return next;
    });
  }, []);

  const addPlanGoal = useCallback(async (g: Omit<PlanGoal, 'id'>) => {
    setPlanGoals((prev) => {
      const next = [{ ...g, id: genId() }, ...prev];
      save('plan_goals', next);
      return next;
    });
  }, []);

  const updatePlanGoal = useCallback(async (g: PlanGoal) => {
    setPlanGoals((prev) => {
      const next = prev.map((x) => (x.id === g.id ? g : x));
      save('plan_goals', next);
      return next;
    });
  }, []);

  const deletePlanGoal = useCallback(async (id: string) => {
    setPlanGoals((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save('plan_goals', next);
      return next;
    });
  }, []);

  const addFlashcard = useCallback(async (f: Omit<Flashcard, 'id' | 'createdAt'>) => {
    setFlashcards((prev) => {
      const next = [{ ...f, id: genId(), createdAt: new Date().toISOString() }, ...prev];
      save(STORAGE_KEYS.FLASHCARDS, next);
      return next;
    });
  }, []);

  const deleteFlashcard = useCallback(async (id: string) => {
    setFlashcards((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(STORAGE_KEYS.FLASHCARDS, next);
      return next;
    });
  }, []);

  const updateSettings = useCallback(async (s: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...s };
      save(STORAGE_KEYS.SETTINGS, next);
      return next;
    });
  }, []);

  const getDayStatus = useCallback(
    (date: string) => {
      const ds = calcDayStatus(sessions, date);
      return { status: ds.status, totalMinutes: ds.totalMinutes };
    },
    [sessions]
  );

  const value: AppContextValue = useMemo(
    () => ({
      sessions, subjects, weightLogs, workoutLogs, waterLogs, englishSessions,
      progSessions, projects, certifications, notes, finances, freelance,
      simulations, planGoals, flashcards, settings, globalScore, loading,
      addSession, updateSession, deleteSession,
      addSubject, updateSubject, deleteSubject,
      addAbsence, removeAbsence,
      addWeightLog, deleteWeightLog,
      addWorkoutLog, deleteWorkoutLog,
      addWaterLog, getTodayWater,
      addEnglishSession, deleteEnglishSession,
      addProgSession, deleteProgSession,
      addProject, updateProject, deleteProject,
      addCertification, updateCertification, deleteCertification,
      addNote, updateNote, deleteNote,
      addFinance, deleteFinance,
      addFreelance, updateFreelance, deleteFreelance,
      addSimulation, deleteSimulation,
      addPlanGoal, updatePlanGoal, deletePlanGoal,
      addFlashcard, deleteFlashcard,
      updateSettings, getDayStatus,
    }),
    [
      sessions, subjects, weightLogs, workoutLogs, waterLogs, englishSessions,
      progSessions, projects, certifications, notes, finances, freelance,
      simulations, planGoals, flashcards, settings, globalScore, loading,
      addSession, updateSession, deleteSession,
      addSubject, updateSubject, deleteSubject,
      addAbsence, removeAbsence,
      addWeightLog, deleteWeightLog,
      addWorkoutLog, deleteWorkoutLog,
      addWaterLog, getTodayWater,
      addEnglishSession, deleteEnglishSession,
      addProgSession, deleteProgSession,
      addProject, updateProject, deleteProject,
      addCertification, updateCertification, deleteCertification,
      addNote, updateNote, deleteNote,
      addFinance, deleteFinance,
      addFreelance, updateFreelance, deleteFreelance,
      addSimulation, deleteSimulation,
      addPlanGoal, updatePlanGoal, deletePlanGoal,
      addFlashcard, deleteFlashcard,
      updateSettings, getDayStatus,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
