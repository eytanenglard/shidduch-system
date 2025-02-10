///hooks/useQuestionnaireSave.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { questionnaireService } from '@/lib/services/questionnaireService';
import type { 
  QuestionnaireResponse,
  TempQuestionnaireSession,
  QuestionnaireUpdatePayload,
  QuestionnaireSessionState
} from '@/components/questionnaire/types/responses';

interface UseQuestionnaireSaveProps {
  initialData?: QuestionnaireResponse | TempQuestionnaireSession;
  autoSaveInterval?: number; // בשניות
  onSaveError?: (error: Error) => void;
}

export function useQuestionnaireSave({
  initialData,
  autoSaveInterval = 120, // ברירת מחדל - 2 דקות
  onSaveError
}: UseQuestionnaireSaveProps) {
  const { data: session } = useSession();
  const [sessionState, setSessionState] = useState<QuestionnaireSessionState>({
    isTemporary: !session,
    currentResponse: initialData,
    lastSaved: new Date(),
    hasUnsavedChanges: false,
    autoSaveInterval,
    version: 0
  });

  const pendingChanges = useRef<QuestionnaireUpdatePayload | null>(null);
  const autoSaveTimeout = useRef<NodeJS.Timeout>();

  // פונקציית השמירה העיקרית
  const saveChanges = useCallback(async (changes: QuestionnaireUpdatePayload, createVersion = false) => {
    try {
      let response;

      if (session?.user) {
        // משתמש מחובר - שמירה קבועה
        if (sessionState.currentResponse?.id) {
          if (createVersion) {
            response = await questionnaireService.createVersion(
              sessionState.currentResponse.id,
              changes,
              'Manual save'
            );
          } else {
            response = await questionnaireService.saveResponse(session.user.id, changes);
          }
        }
      } else {
        // משתמש לא מחובר - שמירה זמנית
        const sessionToken = (sessionState.currentResponse as TempQuestionnaireSession)?.sessionToken 
          || crypto.randomUUID();
        response = await questionnaireService.saveTempSession(sessionToken, changes);
      }

      setSessionState(prev => ({
        ...prev,
        currentResponse: response,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        version: createVersion ? prev.version + 1 : prev.version
      }));

      pendingChanges.current = null;
      return response;
    } catch (error) {
      onSaveError?.(error as Error);
      throw error;
    }
  }, [session, sessionState.currentResponse, onSaveError]);

  // שמירה אוטומטית
  const autoSave = useCallback(async () => {
    if (pendingChanges.current && sessionState.hasUnsavedChanges) {
      try {
        if (session?.user && sessionState.currentResponse?.id) {
          await questionnaireService.autoSave(
            sessionState.currentResponse.id,
            pendingChanges.current
          );
        }
        setSessionState(prev => ({
          ...prev,
          lastSaved: new Date(),
          hasUnsavedChanges: false
        }));
        pendingChanges.current = null;
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [session, sessionState.currentResponse, sessionState.hasUnsavedChanges]);

  // הגדרת טיימר לשמירה אוטומטית
  useEffect(() => {
    if (autoSaveInterval > 0) {
      autoSaveTimeout.current = setInterval(autoSave, autoSaveInterval * 1000);
      return () => {
        if (autoSaveTimeout.current) {
          clearInterval(autoSaveTimeout.current);
        }
      };
    }
  }, [autoSave, autoSaveInterval]);

  // עדכון שינויים
  const updateChanges = useCallback((changes: QuestionnaireUpdatePayload) => {
    pendingChanges.current = {
      ...(pendingChanges.current || {}),
      ...changes
    };
    setSessionState(prev => ({
      ...prev,
      hasUnsavedChanges: true
    }));
  }, []);

  // המרת סשן זמני לקבוע
  const convertToPermament = useCallback(async () => {
    if (!session?.user || !sessionState.isTemporary) return;

    try {
      const sessionToken = (sessionState.currentResponse as TempQuestionnaireSession).sessionToken;
      const response = await questionnaireService.convertTempToResponse(
        sessionToken,
        session.user.id
      );

      setSessionState(prev => ({
        ...prev,
        isTemporary: false,
        currentResponse: response,
        version: 0
      }));

      return response;
    } catch (error) {
      onSaveError?.(error as Error);
      throw error;
    }
  }, [session, sessionState.isTemporary, sessionState.currentResponse, onSaveError]);

  return {
    sessionState,
    saveChanges,
    updateChanges,
    convertToPermament,
    pendingChanges: !!pendingChanges.current
  };
}