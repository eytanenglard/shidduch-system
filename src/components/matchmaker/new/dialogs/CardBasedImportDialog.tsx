// =============================================================================
// File: src/components/matchmaker/new/dialogs/CardBasedImportDialog.tsx
// Description: Unified card-based candidate import with source selection,
//   AI analysis, and batch save. Orchestrator component that imports
//   sub-components from ./card-import/
// =============================================================================

'use client';

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  X,
  SaveAll,
  Hash,
  Brain,
} from 'lucide-react';

// Split sub-components
import type {
  CardData,
  ExtractedFields,
  SourceOption,
  CardBasedImportDialogProps,
  CandidateImage,
} from './card-import/types';
import {
  CARD_COUNT_OPTIONS,
  MAX_IMAGES_PER_CARD,
  MAX_IMAGE_SIZE_MB,
  normalizeMaritalStatus,
  createEmptyCard,
  useIsMobile,
  runWithConcurrency,
} from './card-import/utils';
import { ProgressBar } from './card-import/ProgressBar';
import { SourceSelectionScreen } from './card-import/SourceSelectionScreen';
import { CandidateCard } from './card-import/CandidateCard';

// ---------------------------------------------------------------------------
// Validation Preview — shown before batch save
// ---------------------------------------------------------------------------
const ValidationPreview: React.FC<{
  cards: CardData[];
  duplicateMap: Map<string, { id: string; firstName: string; lastName: string; phone?: string | null; matchType: string }[]>;
  onSaveValid: (validCardIds: string[]) => void;
  onCancel: () => void;
}> = ({ cards, duplicateMap, onSaveValid, onCancel }) => {
  const analyzedCards = cards.filter((c) => c.status === 'analyzed');

  const results = analyzedCards.map((card) => {
    const fields = card.extracted;
    const missing: string[] = [];
    if (!fields?.firstName) missing.push('שם פרטי');
    if (!fields?.gender) missing.push('מגדר');

    return {
      cardId: card.id,
      name: `${fields?.firstName || '?'} ${fields?.lastName || '?'}`,
      isValid: !!fields?.firstName && !!fields?.gender,
      missingFields: missing,
      hasDuplicate: (duplicateMap.get(card.id)?.length ?? 0) > 0,
    };
  });

  const validCount = results.filter((r) => r.isValid).length;
  const invalidCount = results.filter((r) => !r.isValid).length;
  const duplicateCount = results.filter((r) => r.hasDuplicate).length;

  return (
    <div className="px-3 sm:px-5 py-3 border-t bg-white border-b">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-800">סיכום לפני שמירה</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 text-xs mb-3">
        <span className="text-emerald-600 font-medium">{validCount} תקינים</span>
        {invalidCount > 0 && (
          <span className="text-red-600 font-medium">{invalidCount} חסרים שדות</span>
        )}
        {duplicateCount > 0 && (
          <span className="text-amber-600 font-medium">{duplicateCount} כפילויות</span>
        )}
      </div>

      <div className="max-h-32 overflow-y-auto space-y-1 mb-3">
        {results.map((r) => (
          <div
            key={r.cardId}
            className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
              !r.isValid
                ? 'bg-red-50 text-red-700'
                : r.hasDuplicate
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {r.isValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <span className="font-medium truncate">{r.name}</span>
            {r.missingFields.length > 0 && (
              <span className="text-[10px] opacity-70">— חסר: {r.missingFields.join(', ')}</span>
            )}
            {r.hasDuplicate && <span className="text-[10px] opacity-70">— כפילות</span>}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() =>
            onSaveValid(results.filter((r) => r.isValid).map((r) => r.cardId))
          }
          disabled={validCount === 0}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs"
        >
          <SaveAll className="w-3.5 h-3.5 ml-1" />
          שמור {validCount} תקינים
        </Button>
        <Button variant="outline" size="sm" className="h-9 text-xs" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const CardBasedImportDialog: React.FC<CardBasedImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  // Source selection state
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [referredByGlobal, setReferredByGlobal] = useState('');

  // Cards state
  const [cardCount, setCardCount] = useState(10);
  const [cards, setCards] = useState<CardData[]>(() =>
    Array.from({ length: 10 }, createEmptyCard)
  );
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [autoAiPrep, setAutoAiPrep] = useState(true);
  const [duplicateMap, setDuplicateMap] = useState<
    Map<string, { id: string; firstName: string; lastName: string; phone?: string | null; matchType: string }[]>
  >(new Map());
  const [showValidationPreview, setShowValidationPreview] = useState(false);
  const isMobile = useIsMobile();

  // Auto-scroll ref for next card after save
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleSourceSelect = (source: SourceOption, customValue?: string) => {
    const value = customValue || source.referredByValue;
    setSelectedSource(source.id);
    setReferredByGlobal(value);
  };

  const handleCardCountChange = (count: number) => {
    setCardCount(count);
    setCards((prev) => {
      if (count > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: count - prev.length }, createEmptyCard),
        ];
      }
      return prev.slice(0, count);
    });
  };

  const addMoreCards = (count: number) => {
    const newCards = Array.from({ length: count }, createEmptyCard);
    setCards((prev) => [...prev, ...newCards]);
    setCardCount((prev) => prev + count);
  };

  const updateCard = useCallback(
    (cardId: string, updates: Partial<CardData>) => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) return card;
          const updated = { ...card, ...updates };
          if (!updates.status) {
            if (
              updated.images.length > 0 ||
              updated.rawText.trim().length > 0
            ) {
              if (updated.status === 'empty') updated.status = 'has-input';
            }
          }
          return updated;
        })
      );
    },
    []
  );

  const updateExtractedField = useCallback(
    (cardId: string, field: keyof ExtractedFields, value: string) => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId || !card.extracted) return card;
          return { ...card, extracted: { ...card.extracted, [field]: value } };
        })
      );
    },
    []
  );

  // =========================================================================
  // Image handling
  // =========================================================================
  const addImagesToCard = useCallback((cardId: string, files: File[]) => {
    setCards((prev) => {
      const card = prev.find((c) => c.id === cardId);
      if (!card) return prev;

      const newImages: CandidateImage[] = [];
      for (const file of files) {
        if (card.images.length + newImages.length >= MAX_IMAGES_PER_CARD) {
          toast.warning(`מקסימום ${MAX_IMAGES_PER_CARD} תמונות לכרטיס`);
          break;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name} גדול מדי (מקס ${MAX_IMAGE_SIZE_MB}MB)`);
          continue;
        }
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} אינו קובץ תמונה`);
          continue;
        }
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          isFormImage: false,
        });
      }

      if (newImages.length === 0) return prev;

      return prev.map((c) => {
        if (c.id !== cardId) return c;
        return {
          ...c,
          images: [...c.images, ...newImages],
          status: c.status === 'empty' ? 'has-input' : c.status,
        };
      });
    });
  }, []);

  const handleImageUpload = useCallback(
    (cardId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      addImagesToCard(cardId, Array.from(e.target.files));
      if (e.target) e.target.value = '';
    },
    [addImagesToCard]
  );

  const removeImage = useCallback((cardId: string, imageIndex: number) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card;
        const newImages = card.images.filter((_, i) => i !== imageIndex);
        return {
          ...card,
          images: newImages,
          status:
            newImages.length === 0 &&
            !card.rawText.trim() &&
            card.status === 'has-input'
              ? 'empty'
              : card.status,
        };
      })
    );
  }, []);

  const handlePaste = useCallback(
    (cardId: string, e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        addImagesToCard(cardId, imageFiles);
      }
    },
    [addImagesToCard]
  );

  const handleDrop = useCallback(
    (cardId: string, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) addImagesToCard(cardId, files);
    },
    [addImagesToCard]
  );

  // =========================================================================
  // AI Analysis — Single Card (with retry)
  // =========================================================================
  const analyzeCard = useCallback(
    async (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;
      if (card.images.length === 0 && !card.rawText.trim()) {
        toast.error('הוסף תמונה או טקסט לפני ניתוח');
        return;
      }

      updateCard(cardId, { status: 'analyzing', error: null });

      const maxRetries = 2;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            toast.info(`ניסיון ${attempt + 1}...`);
            await new Promise((r) => setTimeout(r, 1000));
          }

          const formData = new FormData();
          formData.append('mode', 'single-card');
          formData.append('rawText', card.rawText);
          formData.append('source', referredByGlobal);

          for (const img of card.images) {
            formData.append('images', img.file);
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 55000);

          const res = await fetch('/api/matchmaker/candidates/card-import', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const result = await res.json();
          if (!res.ok || !result.success) {
            throw new Error(result.error || 'Analysis failed');
          }

          const fields = result.data.fields;

          if (fields.maritalStatus) {
            fields.maritalStatus = normalizeMaritalStatus(fields.maritalStatus);
          } else {
            fields.maritalStatus = 'SINGLE';
          }

          if (!fields.lastName || fields.lastName.trim() === '') {
            fields.lastName = 'לא ידוע';
          }

          fields.referredBy =
            referredByGlobal || fields.referredBy || 'קבוצת שידוכים שוובל';

          if (!fields.about && card.rawText.trim()) {
            fields.about = card.rawText;
          }

          updateCard(cardId, {
            extracted: fields,
            status: 'analyzed',
            aiConfidence: result.data.confidence,
            aiNotes: result.data.notes,
          });

          toast.success(`ניתוח הושלם: ${fields.firstName} ${fields.lastName}`);
          return;
        } catch (err) {
          lastError = err as Error;
          if ((err as Error).name === 'AbortError') {
            lastError = new Error('הניתוח ארך יותר מדי זמן. נסה שוב.');
          }
          if (
            (err as Error).message?.includes('Unauthorized') ||
            (err as Error).message?.includes('not configured')
          ) {
            break;
          }
          if (attempt === maxRetries) break;
        }
      }

      updateCard(cardId, {
        status: 'error',
        error: lastError?.message || 'שגיאה לא ידועה',
      });
      toast.error(`שגיאה בניתוח: ${lastError?.message || 'נסה שוב'}`);
    },
    [cards, referredByGlobal, updateCard]
  );

  // =========================================================================
  // AI Analysis — All Cards (parallel, 3 at a time)
  // =========================================================================
  const analyzeAllCards = async () => {
    const cardsToAnalyze = cards.filter(
      (c) =>
        c.status === 'has-input' && (c.images.length > 0 || c.rawText.trim())
    );
    if (cardsToAnalyze.length === 0) {
      toast.error('אין כרטיסים עם תוכן לניתוח');
      return;
    }

    setIsAnalyzingAll(true);
    let successCount = 0;
    let failCount = 0;

    await runWithConcurrency(
      cardsToAnalyze,
      async (card) => {
        try {
          await analyzeCard(card.id);
          successCount++;
        } catch {
          failCount++;
        }
      },
      3
    );

    setIsAnalyzingAll(false);
    toast.success(`ניתוח הושלם: ${successCount} הצליחו, ${failCount} נכשלו`);

    checkDuplicates();
  };

  // =========================================================================
  // Duplicate Detection
  // =========================================================================
  const checkDuplicates = useCallback(async () => {
    const analyzedCards = cards.filter(
      (c) => c.status === 'analyzed' && c.extracted
    );
    if (analyzedCards.length === 0) return;

    try {
      const candidates = analyzedCards.map((c) => ({
        firstName: c.extracted?.firstName || '',
        lastName: c.extracted?.lastName || '',
        phone: c.extracted?.phone || '',
      }));

      const res = await fetch('/api/matchmaker/candidates/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates }),
      });

      if (!res.ok) return;
      const data = await res.json();

      const newMap = new Map<string, { id: string; firstName: string; lastName: string; phone?: string | null; matchType: string }[]>();
      data.results?.forEach((result: { index: number; duplicates: { id: string; firstName: string; lastName: string; phone?: string | null; matchType: string }[] }) => {
        if (result.duplicates.length > 0) {
          newMap.set(analyzedCards[result.index].id, result.duplicates);
        }
      });
      setDuplicateMap(newMap);
    } catch {
      // Non-critical
    }
  }, [cards]);

  // =========================================================================
  // AI Preparation — runs after save
  // =========================================================================
  const prepareCardAi = useCallback(
    async (cardId: string, candidateId: string) => {
      try {
        updateCard(cardId, { aiPrepStatus: 'preparing', aiPrepError: null });
        toast.info('מכין פרופיל AI מלא...', { duration: 3000 });

        const res = await fetch(
          `/api/matchmaker/candidates/${candidateId}/prepare-ai`,
          { method: 'POST' }
        );

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'AI preparation failed');
        }

        updateCard(cardId, {
          aiPrepStatus: 'ready',
          aiPrepResult: result.data,
        });
        toast.success('פרופיל AI מוכן!');
      } catch (err) {
        console.error('[PrepareAI] Failed:', err);
        updateCard(cardId, {
          aiPrepStatus: 'error',
          aiPrepError: (err as Error).message,
        });
      }
    },
    [updateCard]
  );

  // =========================================================================
  // Save single card
  // =========================================================================
  const saveCard = useCallback(
    async (cardId: string): Promise<boolean> => {
      const card = cards.find((c) => c.id === cardId);
      if (!card?.extracted) {
        toast.error('נא לנתח את הכרטיס לפני שמירה');
        return false;
      }

      const fields = card.extracted;
      if (!fields.firstName || !fields.gender) {
        toast.error('חסרים שדות חובה: שם פרטי, מגדר');
        return false;
      }

      if (!fields.lastName || fields.lastName.trim() === '') {
        fields.lastName = 'לא ידוע';
      }

      updateCard(cardId, { status: 'saving' });

      try {
        const formData = new FormData();
        formData.append('firstName', fields.firstName);
        formData.append('lastName', fields.lastName);
        formData.append('gender', fields.gender);
        if (fields.phone) formData.append('phone', fields.phone);

        if (fields.maritalStatus) {
          formData.append('maritalStatus', fields.maritalStatus.toLowerCase());
        }
        if (fields.religiousLevel)
          formData.append('religiousLevel', fields.religiousLevel);
        if (fields.origin) formData.append('origin', fields.origin);
        if (fields.height) formData.append('height', fields.height);

        formData.append(
          'referredBy',
          fields.referredBy || referredByGlobal || 'קבוצת שידוכים שוובל'
        );

        if (fields.city) formData.append('city', fields.city);
        if (fields.occupation) formData.append('occupation', fields.occupation);
        if (fields.education) formData.append('education', fields.education);
        if (fields.educationLevel)
          formData.append('educationLevel', fields.educationLevel);
        if (fields.hasChildrenFromPrevious)
          formData.append(
            'hasChildrenFromPrevious',
            fields.hasChildrenFromPrevious
          );
        if (fields.nativeLanguage)
          formData.append('nativeLanguage', fields.nativeLanguage);
        if (fields.additionalLanguages)
          formData.append('additionalLanguages', fields.additionalLanguages);
        if (fields.militaryService)
          formData.append('serviceDetails', fields.militaryService);

        if (fields.age) {
          const ageNum = parseInt(fields.age, 10);
          if (!isNaN(ageNum) && ageNum > 0) {
            const birthYear = new Date().getFullYear() - ageNum;
            const birthDate = new Date(birthYear, 0, 1);
            formData.append('birthDate', birthDate.toISOString());
            formData.append('birthDateIsApproximate', 'true');
          }
        }

        if (fields.about?.trim()) formData.append('about', fields.about.trim());

        const manualLines: string[] = [];
        if (fields.manualEntryText) manualLines.push(fields.manualEntryText);
        else if (fields.about) manualLines.push(fields.about);
        else if (card.rawText) manualLines.push(card.rawText);

        if (manualLines.length === 0) {
          if (fields.personality)
            manualLines.push(`אופי: ${fields.personality}`);
          if (fields.lookingFor)
            manualLines.push(`מחפש/ת: ${fields.lookingFor}`);
          if (fields.occupation)
            manualLines.push(`עיסוק: ${fields.occupation}`);
          if (fields.city) manualLines.push(`עיר: ${fields.city}`);
        }

        formData.append(
          'manualEntryText',
          manualLines.join('\n') || 'imported via card import'
        );

        const photoImages = card.images.filter((img) => !img.isFormImage);
        for (const img of photoImages.length > 0 ? photoImages : card.images) {
          formData.append('images', img.file);
        }

        const res = await fetch('/api/matchmaker/candidates/manual', {
          method: 'POST',
          body: formData,
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Save failed');
        }

        const candidateId = result.candidate?.id;
        updateCard(cardId, {
          status: 'saved',
          savedCandidateId: candidateId || null,
          aiPrepStatus: candidateId && autoAiPrep ? 'preparing' : 'idle',
        });
        setSavedCount((prev) => prev + 1);
        toast.success(`${fields.firstName} ${fields.lastName} נשמר/ה!`, {
          duration: 15000,
          action: candidateId
            ? {
                label: 'ביטול',
                onClick: async () => {
                  try {
                    const undoRes = await fetch(
                      `/api/matchmaker/candidates/${candidateId}`,
                      { method: 'DELETE' }
                    );
                    if (!undoRes.ok) throw new Error('Undo failed');
                    updateCard(cardId, {
                      status: 'analyzed',
                      savedCandidateId: null,
                      aiPrepStatus: 'idle',
                      aiPrepResult: null,
                      aiPrepError: null,
                    });
                    setSavedCount((prev) => Math.max(0, prev - 1));
                    toast.success('הפעולה בוטלה');
                  } catch {
                    toast.error('שגיאה בביטול השמירה');
                  }
                },
              }
            : undefined,
        });

        // Trigger full AI preparation in background (if enabled)
        if (candidateId && autoAiPrep) {
          prepareCardAi(cardId, candidateId);
        }

        return true;
      } catch (err) {
        updateCard(cardId, { status: 'error', error: (err as Error).message });
        toast.error(`שגיאה: ${(err as Error).message}`);
        return false;
      }
    },
    [cards, referredByGlobal, updateCard, prepareCardAi, autoAiPrep]
  );

  // =========================================================================
  // Save ALL analyzed cards (parallel, 3 at a time)
  // =========================================================================
  const saveAllAnalyzed = async () => {
    const cardsToSave = cards.filter((c) => c.status === 'analyzed');
    if (cardsToSave.length === 0) {
      toast.error('אין כרטיסים מנותחים לשמירה');
      return;
    }

    setIsSavingAll(true);
    let successCount = 0;
    let failCount = 0;

    await runWithConcurrency(
      cardsToSave,
      async (card) => {
        const success = await saveCard(card.id);
        if (success) successCount++;
        else failCount++;
      },
      3
    );

    setIsSavingAll(false);
    toast.success(`שמירה הושלמה: ${successCount} הצליחו, ${failCount} נכשלו`);
  };

  const resetCard = (cardId: string) => {
    const newCard = createEmptyCard();
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...newCard, id: cardId } : card
      )
    );
  };

  const handleClose = () => {
    cards.forEach((card) => {
      card.images.forEach((img) => URL.revokeObjectURL(img.preview));
    });
    setCards(Array.from({ length: 10 }, createEmptyCard));
    setCardCount(10);
    setSavedCount(0);
    setIsAnalyzingAll(false);
    setIsSavingAll(false);
    setSelectedSource(null);
    setReferredByGlobal('');
    setDuplicateMap(new Map());
    setShowValidationPreview(false);
    setAutoAiPrep(true);
    if (savedCount > 0) onImportComplete();
    onClose();
  };

  // Computed counts
  const filledCards = cards.filter((c) => c.status !== 'empty').length;
  const analyzedCards = cards.filter(
    (c) => c.status === 'analyzed' || c.status === 'saved'
  ).length;
  const savedCards = cards.filter((c) => c.status === 'saved').length;
  const errorCards = cards.filter((c) => c.status === 'error').length;
  const readyToSaveCount = cards.filter((c) => c.status === 'analyzed').length;

  // Keyboard shortcut: Ctrl+Enter for analyze all
  useEffect(() => {
    if (!isOpen || !selectedSource) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (filledCards > 0 && !isAnalyzingAll) analyzeAllCards();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, selectedSource, filledCards, isAnalyzingAll]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="w-full sm:w-[95vw] sm:max-w-[1400px] h-[100dvh] sm:h-auto sm:max-h-[93vh] overflow-hidden flex flex-col p-0 gap-0 rounded-none sm:rounded-xl max-w-full"
        dir="rtl"
      >
        {/* ============================================================== */}
        {/* STEP 1: Source Selection                                        */}
        {/* ============================================================== */}
        {!selectedSource && (
          <>
            <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
              <DialogTitle className="text-lg font-bold">
                ייבוא מועמדים
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                בחר מקור הפניה וייבא מועמדים עם סריקת AI
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <SourceSelectionScreen onSelectSource={handleSourceSelect} />
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* STEP 2: Card Import                                            */}
        {/* ============================================================== */}
        {selectedSource && (
          <>
            {/* Header */}
            <DialogHeader className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b bg-gradient-to-l from-teal-50/80 to-transparent flex-shrink-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
                    <span className="truncate">ייבוא מועמדים</span>
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] sm:text-xs px-1.5 py-0 font-medium"
                    >
                      {referredByGlobal}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => setSelectedSource(null)}
                      className="text-[10px] sm:text-xs text-gray-400 hover:text-teal-600 underline underline-offset-2"
                    >
                      שנה מקור
                    </button>
                  </DialogDescription>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <div className="flex gap-1">
                      {CARD_COUNT_OPTIONS.map((count) => (
                        <Button
                          key={count}
                          variant={cardCount === count ? 'default' : 'outline'}
                          size="sm"
                          className={`h-7 px-2.5 text-xs min-w-[32px] ${
                            cardCount === count
                              ? 'bg-teal-600 hover:bg-teal-700'
                              : ''
                          }`}
                          onClick={() => handleCardCountChange(count)}
                        >
                          {count}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs flex-shrink-0 text-gray-500"
                      onClick={() => addMoreCards(5)}
                    >
                      <Plus className="w-3 h-3 ml-0.5" />
                      +5
                    </Button>
                  </div>

                  <Button
                    onClick={analyzeAllCards}
                    disabled={isAnalyzingAll || filledCards === 0}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white h-9 text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
                    size="sm"
                  >
                    {isAnalyzingAll ? (
                      <Loader2 className="w-4 h-4 ml-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 ml-1.5" />
                    )}
                    {isAnalyzingAll ? 'מנתח...' : `נתח הכל (${filledCards})`}
                  </Button>
                </div>

                {/* Progress Bar */}
                <ProgressBar
                  filled={filledCards}
                  analyzed={analyzedCards}
                  saved={savedCards}
                  total={cards.length}
                  errors={errorCards}
                />
              </div>
            </DialogHeader>

            {/* Cards Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {cards.map((card, index) => (
                  <CandidateCard
                    key={card.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(card.id, el);
                      else cardRefs.current.delete(card.id);
                    }}
                    card={card}
                    index={index}
                    isMobile={isMobile}
                    onUpdateCard={updateCard}
                    onUpdateField={updateExtractedField}
                    onImageUpload={handleImageUpload}
                    onRemoveImage={removeImage}
                    onPaste={handlePaste}
                    onDrop={handleDrop}
                    onAnalyze={analyzeCard}
                    onSave={saveCard}
                    onReset={resetCard}
                    onPrepareAi={prepareCardAi}
                    duplicates={duplicateMap.get(card.id)}
                  />
                ))}
              </div>
            </div>

            {/* Validation Preview Panel */}
            {showValidationPreview && (
              <ValidationPreview
                cards={cards}
                duplicateMap={duplicateMap}
                onSaveValid={async (validCardIds) => {
                  setShowValidationPreview(false);
                  const cardsToSave = cards.filter(
                    (c) => validCardIds.includes(c.id) && c.status === 'analyzed'
                  );
                  if (cardsToSave.length === 0) return;
                  setIsSavingAll(true);
                  let successCount = 0;
                  let failCount = 0;
                  await runWithConcurrency(
                    cardsToSave,
                    async (card) => {
                      const success = await saveCard(card.id);
                      if (success) successCount++;
                      else failCount++;
                    },
                    3
                  );
                  setIsSavingAll(false);
                  toast.success(`שמירה הושלמה: ${successCount} הצליחו, ${failCount} נכשלו`);
                }}
                onCancel={() => setShowValidationPreview(false)}
              />
            )}

            {/* Footer */}
            <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t bg-gray-50/80 flex items-center justify-between flex-shrink-0 safe-area-bottom gap-2">
              <div className="flex items-center gap-2">
                {readyToSaveCount > 0 && (
                  <Button
                    onClick={() => setShowValidationPreview(true)}
                    disabled={isSavingAll}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 sm:h-8 text-xs sm:text-sm"
                  >
                    {isSavingAll ? (
                      <Loader2 className="w-4 h-4 ml-1.5 animate-spin" />
                    ) : (
                      <SaveAll className="w-4 h-4 ml-1.5" />
                    )}
                    {isSavingAll ? 'שומר...' : `שמור הכל (${readyToSaveCount})`}
                  </Button>
                )}
                <label className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={autoAiPrep}
                    onChange={(e) => setAutoAiPrep(e.target.checked)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <Brain className="w-3 h-3" />
                  <span className="hidden sm:inline">הכן AI אוטומטית</span>
                  <span className="sm:hidden">AI</span>
                </label>
                {savedCards > 0 && (
                  <span className="text-xs text-emerald-600 font-medium">
                    ✓ {savedCards} נשמרו
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 text-xs sm:text-sm"
                onClick={handleClose}
              >
                {savedCards > 0 ? 'סגור ורענן' : 'ביטול'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
