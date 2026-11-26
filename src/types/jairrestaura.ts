export type AccompanimentStyle =
  | 'auto'
  | 'empatico_contenedor'
  | 'reflexivo'
  | 'confrontativo_compasivo'
  | 'practico'
  | 'exploratorio'
  | 'fortalecedor';

export type LanguageDepth = 'auto' | 'claro' | 'profundo' | 'breve';

export interface AccompanimentSettings {
  preferredStyle: AccompanimentStyle;
  languageDepth: LanguageDepth;
  pastoralIntegration: boolean;
}

export interface ProtectiveMechanism {
  id: string;
  behavior: string;
  possibleFunction: string;
  presentCost: string;
}

export interface PsychologicalProfile {
  affirmedFacts: string[];
  observedPatterns: string[];
  explorableHypotheses: string[];
  unknownAreas: string[];
  protectiveMechanisms: ProtectiveMechanism[];
  strengthsAndValues: string[];
  personalGoals: string[];
  communicationPreferences: string[];
  lastUpdatedAt: string | null;
}

export interface SafetyFlag {
  level: 'none' | 'elevated' | 'urgent';
  guidance: string;
}

export interface MicroInterventionSuggestion {
  id: string;
  title: string;
  category: string;
  prompt: string;
  steps: string[];
  durationLabel: string;
}

export interface AccompanimentAnalysis {
  detectedEmotion: string;
  underlyingNeed: string;
  selectedStyle: string;
  protectiveFunctionInsight?: string;
  safetyFlag: SafetyFlag;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: 'gemini' | 'local_offline';
  createdOffline?: boolean;
  analysis?: AccompanimentAnalysis;
  suggestedMicroIntervention?: MicroInterventionSuggestion;
}

export interface SessionRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface MicroInterventionTemplate {
  id: string;
  title: string;
  category: string;
  durationLabel: string;
  description: string;
  steps: string[];
  reflectionPrompts: string[];
  isBreathingExercise?: boolean;
}

export interface ExerciseProgressEntry {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  category: string;
  completedAt: string;
  answers: { prompt: string; answer: string }[];
  reflection?: string;
  mode: 'online' | 'offline';
}

export type LibraryCategory =
  | 'microintervenciones'
  | 'regulacion'
  | 'autenticidad'
  | 'autoestima'
  | 'ansiedad'
  | 'relaciones'
  | 'pastoral';

export interface LocalLibraryResource {
  id: string;
  category: LibraryCategory;
  categoryLabel: string;
  title: string;
  summary: string;
  practice: string;
  reflectionQuestion: string;
  durationLabel: string;
}

export type AppView = 'conversation' | 'profile' | 'exercises' | 'library' | 'privacy';
