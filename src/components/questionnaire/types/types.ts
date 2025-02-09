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
  | 'multiSelectWithOther'
  ;

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
  icon?: React.ReactNode;
  description?: string;
  allowFreeText?: boolean;
  placeholder?:string;
}

export interface BudgetCategory {
  label: string;
  min: number;
  max: number;
  icon?: React.ReactNode;
  description?: string;
}

export interface QuestionMetadata {
  helpText?: string;
  estimatedTime?: number;
  tags?: string[];
}

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
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  categories?: BudgetCategory[];
  totalPoints?: number;
  metadata?: QuestionMetadata;
  items?: Option[]; // for ranking questions
}

// Answer-related interfaces
export interface QuestionnaireAnswer {
  questionId: string;
  worldId: WorldId;
  value: AnswerValue;
  answeredAt: string;
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
}

export interface AnswerInputProps {
  question: Question;
  value?: AnswerValue;
  onChange?: (value: AnswerValue) => void;
  onClear?: () => void;  // Added this line
  language?: string;
  showValidation?: boolean;
  className?: string;
}

export interface QuestionnaireLayoutProps {
  children: React.ReactNode;
  currentWorld: WorldId;
  userTrack: UserTrack;  // הוספנו את זה
  completedWorlds: WorldId[];
  onWorldChange: (worldId: WorldId) => void;
  onExit?: () => void;
  language?: string;
  onSaveProgress?: () => Promise<void>;  // הוספת הפרופ החדש

}
export interface MatchmakingQuestionnaireProps {
  userId?: string;
  onComplete?: () => void;
  
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

export type UserTrack = 
  | 'SECULAR'     // חילוני
  | 'TRADITIONAL' // מסורתי
  | 'RELIGIOUS'   // דתי
  | 'ORTHODOX';   // חרדי