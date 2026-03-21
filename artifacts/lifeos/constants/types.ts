export type SessionType = 'faculdade' | 'ingles' | 'programacao' | 'shape' | 'geral';

export type QualityLevel = 1 | 2 | 3 | 4 | 5;

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

export interface Subject {
  id: string;
  name: string;
  credits: number;
  grades: number[];
  absences: number;
  maxAbsences: number;
  activities: Activity[];
}

export interface Activity {
  id: string;
  name: string;
  dueDate: string;
  status: 'pending' | 'done' | 'late';
  grade?: number;
  weight: number;
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
  type: 'leetcode' | 'project' | 'study' | 'bug' | 'feature' | 'cert';
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
  faculdade: AreaScore;
  ingles: AreaScore;
  programacao: AreaScore;
  shape: AreaScore;
  trend: 'up' | 'down' | 'stable';
  criticalMode: boolean;
  dayValid: boolean;
}

export interface Settings {
  quickMode: boolean;
  pin?: string;
  haptics: boolean;
}

export interface Simulation {
  id: string;
  type: 'ingles' | 'programacao';
  score: number;
  maxScore: number;
  notes: string;
  date: string;
}
