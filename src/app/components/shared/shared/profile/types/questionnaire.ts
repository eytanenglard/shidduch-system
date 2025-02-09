// src/components/shared/profile/types/questionnaire.ts
export interface FormattedAnswer {
  questionId: string;
  question: string;
  value: any;
  displayText: string;
  answeredAt: string;
  category?: string;
  isVisible: boolean;
}

export interface QuestionnaireResponse {
  id: string;
  userId: string;
  formattedAnswers: {
    values: FormattedAnswer[];
    personality: FormattedAnswer[];
    relationship: FormattedAnswer[];
    partner: FormattedAnswer[];
    religion: FormattedAnswer[];
  };
  valuesCompleted: boolean;
  personalityCompleted: boolean;
  relationshipCompleted: boolean;
  partnerCompleted: boolean;
  religionCompleted: boolean;
  worldsCompleted: string[];
  completed: boolean;
  startedAt: string | Date;
  completedAt?: string | Date;
  lastSaved: string | Date;
}

export interface QuestionnaireWorld {
    key: string;
    title: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
  }
  
  export interface QuestionCardProps {
    question: string;
    answer: FormattedAnswer;
    isEditing: boolean;
    onEdit: (value: string) => void;
    onVisibilityChange: (isVisible: boolean) => void;
  }
  
  export interface WorldSectionProps {
    title: string;
    icon: React.ElementType;
    answers: FormattedAnswer[];
    isEditing: boolean;
    onEdit: (questionId: string, value: string) => void;
    onVisibilityChange: (questionId: string, isVisible: boolean) => void;
    isCompleted: boolean;
    className?: string;
  }