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
  Project,
  ProgSession,
  Session,
  Settings,
  Simulation,
  Subject,
  WeightLog,
  WorkoutLog,
} from '@/constants/types';

interface AppContextValue {
  sessions: Session[];
  subjects: Subject[];
  weightLogs: WeightLog[];
  workoutLogs: WorkoutLog[];
  englishSessions: EnglishSession[];
  progSessions: ProgSession[];
  projects: Project[];
  certifications: Certification[];
  notes: Note[];
  finances: FinanceEntry[];
  freelance: FreelanceProject[];
  simulations: Simulation[];
  settings: Settings;
  globalScore: GlobalScore;
  loading: boolean;

  addSession: (s: Session) => Promise<void>;
  updateSession: (s: Session) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  addSubject: (s: Subject) => Promise<void>;
  updateSubject: (s: Subject) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  addWeightLog: (w: WeightLog) => Promise<void>;
  deleteWeightLog: (id: string) => Promise<void>;

  addWorkoutLog: (w: WorkoutLog) => Promise<void>;
  deleteWorkoutLog: (id: string) => Promise<void>;

  addEnglishSession: (e: EnglishSession) => Promise<void>;
  deleteEnglishSession: (id: string) => Promise<void>;

  addProgSession: (p: ProgSession) => Promise<void>;
  deleteProgSession: (id: string) => Promise<void>;

  addProject: (p: Project) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addCertification: (c: Certification) => Promise<void>;
  updateCertification: (c: Certification) => Promise<void>;
  deleteCertification: (id: string) => Promise<void>;

  addNote: (n: Note) => Promise<void>;
  updateNote: (n: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  addFinance: (f: FinanceEntry) => Promise<void>;
  deleteFinance: (id: string) => Promise<void>;

  addFreelance: (f: FreelanceProject) => Promise<void>;
  updateFreelance: (f: FreelanceProject) => Promise<void>;
  deleteFreelance: (id: string) => Promise<void>;

  addSimulation: (s: Simulation) => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;

  updateSettings: (s: Partial<Settings>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function calcScore(sessions: Session[], type: string, days = 7): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const relevant = sessions.filter(
    (s) => s.type === type && new Date(s.date) >= cutoff
  );
  if (relevant.length === 0) return 0;
  const totalMinutes = relevant.reduce((acc, s) => acc + s.duration, 0);
  const avgQuality = relevant.reduce((acc, s) => acc + s.quality, 0) / relevant.length;
  const score = Math.min(100, (totalMinutes / 300) * 60 + avgQuality * 8);
  return Math.round(score);
}

function calcEngScore(englishSessions: EnglishSession[], days = 7): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const relevant = englishSessions.filter((s) => new Date(s.date) >= cutoff);
  if (relevant.length === 0) return 0;
  const totalMinutes = relevant.reduce((acc, s) => acc + s.duration, 0);
  const score = Math.min(100, (totalMinutes / 420) * 100);
  return Math.round(score);
}

function calcShapeScore(weightLogs: WeightLog[], workoutLogs: WorkoutLog[], days = 7): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const workouts = workoutLogs.filter((w) => new Date(w.date) >= cutoff);
  const score = Math.min(100, (workouts.length / 4) * 100);
  return Math.round(score);
}

function computeGlobal(
  sessions: Session[],
  englishSessions: EnglishSession[],
  weightLogs: WeightLog[],
  workoutLogs: WorkoutLog[]
): GlobalScore {
  const facScore = calcScore(sessions, 'faculdade');
  const progScore = calcScore(sessions, 'programacao');
  const engScore = calcEngScore(englishSessions);
  const shapeScore = calcShapeScore(weightLogs, workoutLogs);

  const total = Math.round((facScore + engScore + progScore + shapeScore) / 4);

  return {
    total,
    faculdade: { value: facScore, trend: 'stable', label: 'Faculdade' },
    ingles: { value: engScore, trend: 'stable', label: 'Inglês' },
    programacao: { value: progScore, trend: 'stable', label: 'Programação' },
    shape: { value: shapeScore, trend: 'stable', label: 'Shape' },
    trend: total >= 60 ? 'up' : 'down',
    criticalMode: total < 40,
    dayValid: total > 0,
  };
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [englishSessions, setEnglishSessions] = useState<EnglishSession[]>([]);
  const [progSessions, setProgSessions] = useState<ProgSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [finances, setFinances] = useState<FinanceEntry[]>([]);
  const [freelance, setFreelance] = useState<FreelanceProject[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [settings, setSettings] = useState<Settings>({ quickMode: true, haptics: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [s, sub, w, wo, es, ps, proj, certs, n, fin, free, sims, set] = await Promise.all([
        load<Session[]>(STORAGE_KEYS.SESSIONS, []),
        load<Subject[]>(STORAGE_KEYS.SUBJECTS, []),
        load<WeightLog[]>(STORAGE_KEYS.WEIGHT_LOGS, []),
        load<WorkoutLog[]>(STORAGE_KEYS.WORKOUT_LOGS, []),
        load<EnglishSession[]>(STORAGE_KEYS.ENGLISH_SESSIONS, []),
        load<ProgSession[]>(STORAGE_KEYS.PROG_SESSIONS, []),
        load<Project[]>(STORAGE_KEYS.PROJECTS, []),
        load<Certification[]>(STORAGE_KEYS.CERTIFICATIONS, []),
        load<Note[]>(STORAGE_KEYS.NOTES, []),
        load<FinanceEntry[]>(STORAGE_KEYS.FINANCES, []),
        load<FreelanceProject[]>(STORAGE_KEYS.FREELANCE, []),
        load<Simulation[]>(STORAGE_KEYS.SIMULATIONS, []),
        load<Settings>(STORAGE_KEYS.SETTINGS, { quickMode: true, haptics: true }),
      ]);
      setSessions(s);
      setSubjects(sub);
      setWeightLogs(w);
      setWorkoutLogs(wo);
      setEnglishSessions(es);
      setProgSessions(ps);
      setProjects(proj);
      setCertifications(certs);
      setNotes(n);
      setFinances(fin);
      setFreelance(free);
      setSimulations(sims);
      setSettings(set);
      setLoading(false);
    };
    init();
  }, []);

  const globalScore = useMemo(
    () => computeGlobal(sessions, englishSessions, weightLogs, workoutLogs),
    [sessions, englishSessions, weightLogs, workoutLogs]
  );

  const addSession = useCallback(async (s: Session) => {
    setSessions((prev) => {
      const next = [{ ...s, id: genId() }, ...prev];
      save(STORAGE_KEYS.SESSIONS, next);
      return next;
    });
  }, []);

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

  const addSubject = useCallback(async (s: Subject) => {
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

  const addWeightLog = useCallback(async (w: WeightLog) => {
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

  const addWorkoutLog = useCallback(async (w: WorkoutLog) => {
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

  const addEnglishSession = useCallback(async (e: EnglishSession) => {
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

  const addProgSession = useCallback(async (p: ProgSession) => {
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

  const addProject = useCallback(async (p: Project) => {
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

  const addCertification = useCallback(async (c: Certification) => {
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

  const addNote = useCallback(async (n: Note) => {
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

  const addFinance = useCallback(async (f: FinanceEntry) => {
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

  const addFreelance = useCallback(async (f: FreelanceProject) => {
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

  const addSimulation = useCallback(async (s: Simulation) => {
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

  const updateSettings = useCallback(async (s: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...s };
      save(STORAGE_KEYS.SETTINGS, next);
      return next;
    });
  }, []);

  const value: AppContextValue = useMemo(
    () => ({
      sessions,
      subjects,
      weightLogs,
      workoutLogs,
      englishSessions,
      progSessions,
      projects,
      certifications,
      notes,
      finances,
      freelance,
      simulations,
      settings,
      globalScore,
      loading,
      addSession,
      updateSession,
      deleteSession,
      addSubject,
      updateSubject,
      deleteSubject,
      addWeightLog,
      deleteWeightLog,
      addWorkoutLog,
      deleteWorkoutLog,
      addEnglishSession,
      deleteEnglishSession,
      addProgSession,
      deleteProgSession,
      addProject,
      updateProject,
      deleteProject,
      addCertification,
      updateCertification,
      deleteCertification,
      addNote,
      updateNote,
      deleteNote,
      addFinance,
      deleteFinance,
      addFreelance,
      updateFreelance,
      deleteFreelance,
      addSimulation,
      deleteSimulation,
      updateSettings,
    }),
    [
      sessions, subjects, weightLogs, workoutLogs, englishSessions, progSessions,
      projects, certifications, notes, finances, freelance, simulations, settings,
      globalScore, loading,
      addSession, updateSession, deleteSession,
      addSubject, updateSubject, deleteSubject,
      addWeightLog, deleteWeightLog,
      addWorkoutLog, deleteWorkoutLog,
      addEnglishSession, deleteEnglishSession,
      addProgSession, deleteProgSession,
      addProject, updateProject, deleteProject,
      addCertification, updateCertification, deleteCertification,
      addNote, updateNote, deleteNote,
      addFinance, deleteFinance,
      addFreelance, updateFreelance, deleteFreelance,
      addSimulation, deleteSimulation,
      updateSettings,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
