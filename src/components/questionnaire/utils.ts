import { 
    Question,
    QuestionType,
    Answer,
    SingleChoiceAnswer,
    MultiChoiceAnswer,
    ScaleAnswer,
    RankingAnswer,
    OpenTextAnswer,
    BudgetAllocationAnswer,
    IconChoiceAnswer,
    SliderAnswer,
    ScenarioAnswer,
    ComparisonAnswer,
    QuestionDepth,
    WorldId,
    QuestionnaireProgress,
    UserTrack,
    ProgressStatus
  } from './types';
  import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
  // Type guards

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  function isOpenTextAnswer(answer: Answer): answer is OpenTextAnswer {
    return answer.type === 'openText';
  }
  
  function isMultiChoiceAnswer(answer: Answer): answer is MultiChoiceAnswer {
    return answer.type === 'multiChoice';
  }
  
  function isBudgetAllocationAnswer(answer: Answer): answer is BudgetAllocationAnswer {
    return answer.type === 'budgetAllocation';
  }
  
  // Interfaces
  interface Contradiction {
    questionIds: [string, string];
    severity: 'low' | 'medium' | 'high';
    description: string;
  }
  
  // בדיקת תקינות תשובה
  export const validateAnswer = (question: Question, value: unknown): string | null => {
    if (question.isRequired && !value) {
      return 'שדה חובה';
    }
  
    switch (question.type) {
      case 'openText': {
        const textValue = value as string;
        if (typeof textValue === 'string') {
          if (question.minLength && textValue.length < question.minLength) {
            return `מינימום ${question.minLength} תווים נדרש`;
          }
          if (question.maxLength && textValue.length > question.maxLength) {
            return `מקסימום ${question.maxLength} תווים מותר`;
          }
        }
        break;
      }
  
      case 'multiChoice': {
        const selections = value as string[];
        if (Array.isArray(selections)) {
          if (question.minSelections && selections.length < question.minSelections) {
            return `יש לבחור לפחות ${question.minSelections} אפשרויות`;
          }
          if (question.maxSelections && selections.length > question.maxSelections) {
            return `ניתן לבחור עד ${question.maxSelections} אפשרויות`;
          }
        }
        break;
      }
  
      case 'budgetAllocation': {
        const allocations = value as Record<string, number>;
        if (typeof allocations === 'object' && allocations !== null) {
          const total = Object.values(allocations).reduce(
            (sum: number, val: number) => sum + val,
            0
          );
          if (total !== question.totalPoints) {
            return `סך כל הנקודות חייב להיות ${question.totalPoints}`;
          }
        }
        break;
      }
    }
  
    return null;
  };
  
  // חישוב התקדמות בשאלון
  export const calculateProgress = (
    answers: Record<string, Answer>, 
    questions: Question[]
  ): number => {
    const totalRequired = questions.filter(q => q.isRequired).length;
    const answeredRequired = questions
      .filter(q => q.isRequired)
      .filter(q => answers[q.id]?.status === 'COMPLETE')
      .length;
  
    return Math.round((answeredRequired / totalRequired) * 100);
  };
  
  // בדיקת זמינות עולם תוכן
  export const isWorldAvailable = (
    worldId: WorldId,
    progress: QuestionnaireProgress,
    userTrack: UserTrack
  ): boolean => {
    const world = progress.worldProgress[worldId];
    if (!world) return false;
  
    const requiredWorlds = progress.navigation.availableWorlds;
    const hasCompletedRequired = requiredWorlds.every(
      requiredId => progress.worldProgress[requiredId]?.status === 'COMPLETED'
    );
  
    return hasCompletedRequired;
  };
  
  // חישוב זמן משוער לסיום
  export const estimateTimeRemaining = (
    progress: QuestionnaireProgress,
    averageTimePerQuestion: number
  ): number => {
    const totalQuestions = Object.values(progress.worldProgress).reduce(
      (sum: number, world) => sum + world.completion.basic.totalQuestions,
      0
    );
    
    const answeredQuestions = Object.values(progress.worldProgress).reduce(
      (sum: number, world) => sum + world.completion.basic.completedQuestions,
      0
    );
  
    return (totalQuestions - answeredQuestions) * averageTimePerQuestion;
  };
  
  // סינון שאלות לפי מסלול המשתמש
  export const filterQuestionsByTrack = (
    questions: Question[],
    userTrack: UserTrack
  ): Question[] => {
    return questions.filter(question => 
      !question.relevantTracks || question.relevantTracks.includes(userTrack)
    );
  };
  
  // בדיקת סתירות בתשובות
  export const checkAnswerConsistency = (
    answers: Record<string, Answer>
  ): Contradiction[] => {
    const contradictions: Contradiction[] = [];
    // הלוגיקה לזיהוי סתירות תתווסף כאן
    return contradictions;
  };
  
  // ניהול שמירה אוטומטית
  export const autoSaveInterval = 120000; // 2 דקות
  
  export const shouldTriggerAutoSave = (
    lastSaveTime: Date,
    currentTime: Date = new Date()
  ): boolean => {
    return currentTime.getTime() - lastSaveTime.getTime() >= autoSaveInterval;
  };
  
  interface AnalysisResult {
    completeness: number;
    thoughtfulness: number;
    consistency: number;
  }
  
  // עיבוד וניתוח תשובות
  export const analyzeAnswers = (
    answers: Record<string, Answer>
  ): AnalysisResult => {
    const totalAnswers = Object.keys(answers).length;
    const completeAnswers = Object.values(answers).filter(
      a => a.status === 'COMPLETE'
    ).length;
  
    const completeness = (completeAnswers / totalAnswers) * 100;
  
    const thoughtfulness = Object.values(answers).reduce((sum: number, answer) => {
      if (isOpenTextAnswer(answer) && typeof answer.value === 'string') {
        return sum + Math.min(answer.value.length / 100, 1);
      }
      return sum + 0.5;
    }, 0) / totalAnswers * 100;
  
    const contradictions = checkAnswerConsistency(answers);
    const consistency = Math.max(0, 100 - contradictions.length * 10);
  
    return {
      completeness,
      thoughtfulness,
      consistency
    };
  };
  
  // פונקציות עזר לניהול UI
  export const getDepthColor = (depth: QuestionDepth): string => {
    switch (depth) {
      case 'BASIC':
        return 'text-blue-500';
      case 'ADVANCED':
        return 'text-purple-500';
      case 'EXPERT':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };
  
  export const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} שניות`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} דקות`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} שעות ו-${remainingMinutes} דקות`;
  };
  
  // ניהול התקדמות והמלצות
  export const getNextRecommendedQuestion = (
    currentQuestionId: string,
    answers: Record<string, Answer>,
    questions: Question[]
  ): string | null => {
    const currentIndex = questions.findIndex(q => q.id === currentQuestionId);
    if (currentIndex === -1) return null;
  
    for (let i = currentIndex + 1; i < questions.length; i++) {
      const question = questions[i];
      if (!question.dependsOn || 
          question.dependsOn.every(dependencyId => answers[dependencyId]?.status === 'COMPLETE')) {
        return question.id;
      }
    }
  
    return null;
  };
  
  // פונקציות עזר לפענוח והצגת נתונים
  export const getAnswerDisplayValue = (answer: Answer): string => {
    const value = answer.value;
    if (value === null || value === undefined) return '';
  
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'כן' : 'לא';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
  
    return '';
  };
  
  export const getQuestionSummary = (question: Question, answer: Answer): string => {
    const value = getAnswerDisplayValue(answer);
    return `${question.question}: ${value}`;
  };
  
  // ניהול שגיאות
  export const handleQuestionnaireError = (error: Error): string => {
    console.error('Questionnaire error:', error);
    
    if (error.message.includes('validation')) {
      return 'נמצאה שגיאה באחת התשובות. אנא בדוק/י את הנתונים שהוזנו.';
    }
    
    if (error.message.includes('network')) {
      return 'אירעה שגיאת תקשורת. אנא בדוק/י את החיבור לאינטרנט ונסה/י שוב.';
    }
    
    return 'אירעה שגיאה. אנא נסה/י שוב מאוחר יותר.';
  };