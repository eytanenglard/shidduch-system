// src/components/questionnaire/types/types.ts

// Basic type definitions
export type WorldId =
  | 'VALUES'
  | 'RELATIONSHIP'
  | 'PERSONALITY'
  | 'PARTNER'
  | 'RELIGION';

export type QuestionType =
  | 'singleChoice'
  | 'multiChoice'
  | 'multiSelect'
  | 'openText'
  | 'scale'
  | 'iconChoice'
  | 'budgetAllocation'
  | 'ranking'
  | 'scenario'
  | 'multiSelectWithOther';

export type QuestionDepth = 'BASIC' | 'ADVANCED' | 'EXPERT';

export type AnswerValue = string | number | string[] | number[] | Record<string, number> | { text: string; lang: string } | undefined;

export type AnswerStatus = 'COMPLETE' | 'PARTIAL' | 'SKIPPED';

// --- UPDATED INTERFACES ---

export interface Option {
  value: string; // This is the key for the dictionary
  icon?: React.ReactNode;
  text?: string; // Re-added as optional
  description?: string; // Re-added as optional
  allowFreeText?: boolean;
  placeholder?: string;
}

export interface BudgetCategory {
  value: string; // The key for the dictionary
  label?: string; // Re-added as optional
  icon?: React.ReactNode;
  description?: string; // Re-added as optional
  min?: number;
  max?: number;
}

export interface QuestionMetadata {
  estimatedTime?: number;
  tags?: string[];
  helpText?: string; // Re-added as optional
}

export interface ScaleLabels {
  min: string;
  max: string;
  middle?: string;
}

export interface ScaleDescriptions {
  min?: string;
  max?: string;
  middle?: string;
  [key: number]: string;
}

export interface Question {
  worldId: string;
  id: string;
  category: string;
  subcategory?: string;
  question?: string; // Re-added as optional
  type: QuestionType;
  depth: QuestionDepth;
  isRequired?: boolean;
  options?: Option[];
  placeholder?: string; // Re-added as optional
  description?: string; // Re-added as optional
  minLength?: number;
  maxLength?: number;
  minSelections?: number;
  maxSelections?: number;
  min?: number;
  max?: number;
  step?: number;
  labels?: ScaleLabels;
  scaleDescriptions?: ScaleDescriptions;
  categories?: BudgetCategory[];
  totalPoints?: number;
  metadata?: QuestionMetadata;
  items?: Option[];
  icon?: React.ReactNode;
}

// --- Answer-related interfaces ---

export interface QuestionnaireAnswer {
  questionId: string;
  worldId: WorldId;
  value: AnswerValue;
  answeredAt: string;
  isVisible?: boolean;
  language?: 'en' | 'he'; 
}

export interface Answer extends QuestionnaireAnswer {
  status?: AnswerStatus;
}

// --- Component Props interfaces ---

export interface WorldComponentProps {
  onAnswer: (questionId: string, value: AnswerValue) => void;
  onComplete: () => void;
  onBack: () => void;
  answers: QuestionnaireAnswer[];
  isCompleted?: boolean;
  language?: string;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
}

export interface AnswerInputProps {
  question: Question;
  value?: AnswerValue;
  onChange?: (value: AnswerValue) => void;
  onClear?: () => void;
  language?: string;
  showValidation?: boolean;
  className?: string;
  validationError?: string;
}

export interface QuestionnaireLayoutProps {
  children: React.ReactNode;
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange: (worldId: WorldId) => void;
  onExit?: () => void;
  language?: string;
  onSaveProgress?: () => Promise<void>;
  isLoggedIn?: boolean;
}

// --- Data storage interfaces ---

export interface QuestionnaireSubmission {
  userId: string;
  answers: QuestionnaireAnswer[];
  worldsCompleted: WorldId[];
  completed: boolean;
  startedAt: string;
  completedAt?: string;
}