// src/app/[locale]/contexts/QuestionnaireStateContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Save, X } from 'lucide-react';
import type { Dictionary } from '@/types/dictionary'; // ודא שהנתיב נכון

// הגדרת ה-Props עבור המודאל
interface UnsavedChangesModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void; // המשך ללא שמירה
  onSaveAndConfirm: () => Promise<void>; // שמור והמשך
  isSaving: boolean;
  dict: Dictionary['unsavedChangesModal'];
}

// רכיב המודאל עצמו
const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  onSaveAndConfirm,
  isSaving,
  dict,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3 text-amber-500" />
            {dict.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">{dict.description}</p>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              {dict.cancelButton}
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              <X className="w-4 h-4 mr-2" />
              {dict.continueWithoutSavingButton}
            </Button>
            <Button onClick={onSaveAndConfirm} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? dict.savingButton : dict.saveAndContinueButton}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// הגדרת הטיפוסים עבור ה-Context
interface QuestionnaireStateContextType {
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
  promptNavigation: (onConfirmCallback: () => void) => void;
  setSaveHandler: (handler: (() => Promise<void>) | null) => void;
}

const QuestionnaireStateContext = createContext<
  QuestionnaireStateContextType | undefined
>(undefined);

// ה-Provider שיעטוף את האפליקציה
export const QuestionnaireStateProvider = ({
  children,
  dict,
}: {
  children: React.ReactNode;
  dict: Dictionary;
}) => {
  const [isDirty, setIsDirty] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onConfirmCallbackRef = useRef<() => void>(() => {});
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);

  const promptNavigation = (onConfirm: () => void) => {
    onConfirmCallbackRef.current = onConfirm;
    setIsModalOpen(true);
  };

  const setSaveHandler = useCallback(
    (handler: (() => Promise<void>) | null) => {
      saveHandlerRef.current = handler;
    },
    []
  );

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleConfirm = () => {
    setIsDirty(false); // מאפסים את המצב כי המשתמש בחר להמשיך
    onConfirmCallbackRef.current();
    setIsModalOpen(false);
  };

  const handleSaveAndConfirm = async () => {
    if (saveHandlerRef.current) {
      setIsSaving(true);
      await saveHandlerRef.current();
      setIsSaving(false);
      setIsDirty(false);
      onConfirmCallbackRef.current();
      setIsModalOpen(false);
    }
  };

  const value = {
    isDirty,
    setIsDirty,
    promptNavigation,
    setSaveHandler,
  };

  return (
    <QuestionnaireStateContext.Provider value={value}>
      {children}
      <UnsavedChangesModal
        isOpen={isModalOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        onSaveAndConfirm={handleSaveAndConfirm}
        isSaving={isSaving}
        dict={dict.unsavedChangesModal}
      />
    </QuestionnaireStateContext.Provider>
  );
};

// Hook מותאם אישית לשימוש קל
export const useQuestionnaireState = () => {
  const context = useContext(QuestionnaireStateContext);
  if (context === undefined) {
    throw new Error(
      'useQuestionnaireState must be used within a QuestionnaireStateProvider'
    );
  }
  return context;
};
