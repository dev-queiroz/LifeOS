export type SessionType = 'faculdade' | 'ingles' | 'programacao' | 'shape' | 'geral';

export type QualityLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Session {
  id: string;
  type: SessionType;
  subtype?: string;
  duration: number;
  quality: QualityLevel;
  output: string;
  notes: string;
  date: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  name: string;
  dueDate: string;
  status: 'pending' | 'done' | 'late';
  grade?: number;
  weight: number;
  type: 'prova' | 'trabalho' | 'lista' | 'seminario' | 'outro';
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  professor?: string;
  room?: string;
  schedule?: string;
  credits: number;
  grades: number[];
  absences: number;
  maxAbsences: number;
  activities: Activity[];
  notes?: string;
  color?: string;
  semester?: string;
}

export interface WeightLog {
  id: string;
  weight: number;
  date: string;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  type: string;
  duration: number;
  date: string;
  notes?: string;
  waterMl?: number;
}

export interface EnglishSession {
  id: string;
  type: 'speaking' | 'listening' | 'reading' | 'writing' | 'vocab' | 'class';
  duration: number;
  score?: number;
  notes: string;
  date: string;
}

export interface ProgSession {
  id: string;
  type: 'leetcode' | 'project' | 'study' | 'bug' | 'feature' | 'cert' | 'deploy';
  duration: number;
  output: string;
  date: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'building' | 'deployed' | 'paused';
  tech: string[];
  url?: string;
  features: number;
  bugsFixed: number;
  createdAt: string;
}

export interface Certification {
  id: string;
  name: string;
  provider: string;
  status: 'studying' | 'completed' | 'planned';
  completedAt?: string;
  url?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FinanceEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface FreelanceProject {
  id: string;
  client: string;
  title: string;
  status: 'lead' | 'proposal' | 'active' | 'completed' | 'lost';
  value: number;
  currency: string;
  notes: string;
  createdAt: string;
}

export interface AreaScore {
  value: number;
  trend: 'up' | 'down' | 'stable';
  label: string;
}

export interface GlobalScore {
  total: number;
  consistency: number;
  efficiency: number;
  focus: number;
  faculdade: AreaScore;
  ingles: AreaScore;
  programacao: AreaScore;
  shape: AreaScore;
  trend: 'up' | 'down' | 'stable';
  criticalMode: boolean;
  redStreak: number;
  dayValid: boolean;
  avg7: number;
}

export interface Settings {
  quickMode: boolean;
  pin?: string;
  haptics: boolean;
  groqKey?: string;
  theme?: 'dark';
}

export interface Simulation {
  id: string;
  type: 'ingles' | 'programacao';
  score: number;
  maxScore: number;
  notes: string;
  date: string;
}

export interface WaterLog {
  id: string;
  ml: number;
  date: string;
}

export interface PlanGoal {
  id: string;
  phase: 1 | 2 | 3 | 4 | 5;
  title: string;
  done: boolean;
  dueDate?: string;
}
