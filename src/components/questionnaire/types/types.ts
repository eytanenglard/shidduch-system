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

export type AnswerValue =
  | string
  | number
  | string[]
  | number[]
  | Record<string, number>
  | undefined;

export type AnswerStatus = 'COMPLETE' | 'PARTIAL' | 'SKIPPED';

// Interface definitions
export interface Option {
  value: string;
  text: string;
  icon?: React.ReactNode; // Icon associated with a specific choice/option
  description?: string;
  allowFreeText?: boolean;
  placeholder?:string;
}

export interface BudgetCategory {
  label: string;
  icon?: React.ReactNode; // Icon associated with a specific budget category
  description?: string;
  min?: number;
  max?: number;
}

export interface QuestionMetadata {
  helpText?: string;
  estimatedTime?: number; // בדקות
  tags?: string[];
  // Icon is NOT part of metadata
}

// --- הוספנו כאן הגדרות לתוויות ותיאורים של סולם ---
export interface ScaleLabels {
  min: string;
  max: string;
  middle?: string;
}

export interface ScaleDescriptions { // זה מתאים ל-descriptions ב-InteractiveScale
  min?: string;
  max?: string;
  middle?: string;
  [key: number]: string; // אפשרות לתיאורים לערכים ספציפיים
}
// --- סוף ההוספה ---


export interface Question {
  worldId: string;
  id: string;
  category: string;
  subcategory?: string;
  question: string;
  type: QuestionType;
  depth: QuestionDepth;
  isRequired?: boolean;
  options?: Option[];
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  minSelections?: number;
  maxSelections?: number;
  description?: string; // תיאור כללי לשאלה
  min?: number; // for scale
  max?: number; // for scale
  step?: number; // for scale
  // --- הוספנו כאן את המאפיינים החדשים לשאלות סולם ---
  labels?: ScaleLabels; // תוויות קצה (ומידל) לשאלות סולם
  scaleDescriptions?: ScaleDescriptions; // תיאורים ספציפיים לערכים בסולם (אם InteractiveScale תומך בזה בצורה זו)
  // --- סוף ההוספה ---
  categories?: BudgetCategory[]; // for budgetAllocation
  totalPoints?: number; // for budgetAllocation
  metadata?: QuestionMetadata;
  items?: Option[]; // for ranking questions
  icon?: React.ReactNode; // <<< --- הוספנו כאן: אייקון אופציונלי לשאלה עצמה
}

// Answer-related interfaces
export interface QuestionnaireAnswer {
  questionId: string;
  worldId: WorldId;
  value: AnswerValue;
  answeredAt: string;
   isVisible?: boolean;
}

export interface Answer extends QuestionnaireAnswer {
  status?: AnswerStatus;
}

// Component Props interfaces
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

// Data storage interfaces
export interface QuestionnaireSubmission {
  userId: string;
  answers: QuestionnaireAnswer[];
  worldsCompleted: WorldId[];
  completed: boolean;
  startedAt: string;
  completedAt?: string;
}

