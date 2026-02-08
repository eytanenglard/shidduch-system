// =============================================================================
// File: src/components/matchmaker/new/dialogs/CardBasedImportDialog.tsx
// =============================================================================

'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ImageIcon,
  Plus,
  Save,
  X,
  RotateCcw,
  Zap,
  Grid3X3,
  Check,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CandidateImage {
  file: File;
  preview: string;
  isFormImage: boolean; // whether AI detected text/form in this image
}

interface CardData {
  id: string;
  // Raw input
  images: CandidateImage[];
  rawText: string;
  // AI-extracted fields
  extracted: ExtractedFields | null;
  // Status
  status:
    | 'empty'
    | 'has-input'
    | 'analyzing'
    | 'analyzed'
    | 'saving'
    | 'saved'
    | 'error';
  error: string | null;
  aiConfidence: 'high' | 'medium' | 'low' | null;
  aiNotes: string | null;
}

interface ExtractedFields {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | '';
  age: string;
  height: string;
  maritalStatus: string;
  religiousLevel: string;
  origin: string;
  city: string;
  occupation: string;
  education: string;
  educationLevel: string;
  phone: string;
  referredBy: string;
  personality: string;
  lookingFor: string;
  hobbies: string;
  familyDescription: string;
  militaryService: string;
  languages: string;
  manualEntryText: string;
}

interface CardBasedImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  locale: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARD_COUNT_OPTIONS = [5, 10, 20, 50];
const MAX_IMAGES_PER_CARD = 5;
const MAX_IMAGE_SIZE_MB = 10;

const EMPTY_FIELDS: ExtractedFields = {
  firstName: '',
  lastName: '',
  gender: '',
  age: '',
  height: '',
  maritalStatus: '',
  religiousLevel: '',
  origin: '',
  city: '',
  occupation: '',
  education: '',
  educationLevel: '',
  phone: '',
  referredBy: '',
  personality: '',
  lookingFor: '',
  hobbies: '',
  familyDescription: '',
  militaryService: '',
  languages: '',
  manualEntryText: '',
};

function createEmptyCard(): CardData {
  return {
    id: crypto.randomUUID(),
    images: [],
    rawText: '',
    extracted: null,
    status: 'empty',
    error: null,
    aiConfidence: null,
    aiNotes: null,
  };
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const CardBasedImportDialog: React.FC<CardBasedImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [cardCount, setCardCount] = useState(10);
  const [cards, setCards] = useState<CardData[]>(() =>
    Array.from({ length: 10 }, createEmptyCard)
  );
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // =========================================================================
  // Card count management
  // =========================================================================
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

  // =========================================================================
  // Card update helpers
  // =========================================================================
  const updateCard = useCallback(
    (cardId: string, updates: Partial<CardData>) => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) return card;
          const updated = { ...card, ...updates };
          // Auto-update status
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
          return {
            ...card,
            extracted: { ...card.extracted, [field]: value },
          };
        })
      );
    },
    []
  );

  // =========================================================================
  // Image handling
  // =========================================================================
  const handleImageUpload = (
    cardId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const newFiles = Array.from(e.target.files);
    const newImages: CandidateImage[] = [];

    for (const file of newFiles) {
      if (card.images.length + newImages.length >= MAX_IMAGES_PER_CARD) {
        toast.warning(`מקסימום ${MAX_IMAGES_PER_CARD} תמונות לכרטיס`);
        break;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} גדול מדי (מקס ${MAX_IMAGE_SIZE_MB}MB)`);
        continue;
      }
      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        isFormImage: false,
      });
    }

    if (newImages.length > 0) {
      updateCard(cardId, {
        images: [...card.images, ...newImages],
        status: 'has-input',
      });
    }

    // Reset file input
    if (e.target) e.target.value = '';
  };

  const removeImage = (cardId: string, imageIndex: number) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card;
        const newImages = card.images.filter((_, i) => i !== imageIndex);
        return {
          ...card,
          images: newImages,
          status:
            newImages.length === 0 && !card.rawText.trim()
              ? 'empty'
              : card.status,
        };
      })
    );
  };

  // =========================================================================
  // Handle paste (images from clipboard)
  // =========================================================================
  const handlePaste = useCallback(
    (cardId: string, e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      const newImages: CandidateImage[] = [];

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          if (card.images.length + newImages.length >= MAX_IMAGES_PER_CARD)
            break;

          newImages.push({
            file,
            preview: URL.createObjectURL(file),
            isFormImage: false,
          });
        }
      }

      if (newImages.length > 0) {
        updateCard(cardId, {
          images: [...card.images, ...newImages],
          status: 'has-input',
        });
      }
    },
    [cards, updateCard]
  );

  // =========================================================================
  // AI Analysis - Single Card
  // =========================================================================
  const analyzeCard = async (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    if (card.images.length === 0 && !card.rawText.trim()) {
      toast.error('הוסף תמונה או טקסט לפני ניתוח');
      return;
    }

    updateCard(cardId, { status: 'analyzing', error: null });

    try {
      const formData = new FormData();
      formData.append('mode', 'single-card');
      formData.append('rawText', card.rawText);

      for (const img of card.images) {
        formData.append('images', img.file);
      }

      const res = await fetch('/api/matchmaker/candidates/card-import', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      updateCard(cardId, {
        extracted: result.data.fields,
        status: 'analyzed',
        aiConfidence: result.data.confidence,
        aiNotes: result.data.notes,
      });

      toast.success(
        `ניתוח הושלם: ${result.data.fields.firstName} ${result.data.fields.lastName}`
      );
    } catch (err) {
      updateCard(cardId, {
        status: 'error',
        error: (err as Error).message,
      });
      toast.error(`שגיאה בניתוח: ${(err as Error).message}`);
    }
  };

  // =========================================================================
  // AI Analysis - All Cards
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

    for (const card of cardsToAnalyze) {
      try {
        await analyzeCard(card.id);
        successCount++;
      } catch {
        failCount++;
      }
      // Small delay between requests
      await new Promise((r) => setTimeout(r, 500));
    }

    setIsAnalyzingAll(false);
    toast.success(`ניתוח הושלם: ${successCount} הצליחו, ${failCount} נכשלו`);
  };

  // =========================================================================
  // Save single card to DB
  // =========================================================================
  const saveCard = async (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card?.extracted) {
      toast.error('נא לנתח את הכרטיס לפני שמירה');
      return;
    }

    const fields = card.extracted;
    if (!fields.firstName || !fields.lastName || !fields.gender) {
      toast.error('חסרים שדות חובה: שם פרטי, שם משפחה, מגדר');
      return;
    }

    updateCard(cardId, { status: 'saving' });

    try {
      const formData = new FormData();
      formData.append('firstName', fields.firstName);
      formData.append('lastName', fields.lastName);
      formData.append('gender', fields.gender);

      if (fields.phone) formData.append('phone', fields.phone);
      if (fields.maritalStatus)
        formData.append('maritalStatus', fields.maritalStatus);
      if (fields.religiousLevel)
        formData.append('religiousLevel', fields.religiousLevel);
      if (fields.origin) formData.append('origin', fields.origin);
      if (fields.height) formData.append('height', fields.height);
      if (fields.referredBy) formData.append('referredBy', fields.referredBy);

      // Birth date from age
      if (fields.age) {
        const ageNum = parseInt(fields.age, 10);
        if (!isNaN(ageNum) && ageNum > 0) {
          const birthYear = new Date().getFullYear() - ageNum;
          const birthDate = new Date(birthYear, 0, 1);
          formData.append('birthDate', birthDate.toISOString());
          formData.append('birthDateIsApproximate', 'true');
        }
      }

      // Build manual entry text
      const manualLines: string[] = [];
      if (fields.personality) manualLines.push(`אופי: ${fields.personality}`);
      if (fields.lookingFor) manualLines.push(`מחפש/ת: ${fields.lookingFor}`);
      if (fields.hobbies) manualLines.push(`תחביבים: ${fields.hobbies}`);
      if (fields.familyDescription)
        manualLines.push(`משפחה: ${fields.familyDescription}`);
      if (fields.militaryService)
        manualLines.push(`שירות: ${fields.militaryService}`);
      if (fields.education) manualLines.push(`לימודים: ${fields.education}`);
      if (fields.occupation) manualLines.push(`עיסוק: ${fields.occupation}`);
      if (fields.city) manualLines.push(`עיר: ${fields.city}`);
      if (fields.languages) manualLines.push(`שפות: ${fields.languages}`);
      if (fields.manualEntryText)
        manualLines.push(`\n--- טקסט מקורי ---\n${fields.manualEntryText}`);
      else if (card.rawText)
        manualLines.push(`\n--- טקסט מקורי ---\n${card.rawText}`);

      formData.append(
        'manualEntryText',
        manualLines.join('\n') || 'imported via card import'
      );

      // Add profile photos (not form images)
      const photoImages = card.images.filter((img) => !img.isFormImage);
      for (const img of photoImages) {
        formData.append('images', img.file);
      }
      // If no non-form images, add all images
      if (photoImages.length === 0) {
        for (const img of card.images) {
          formData.append('images', img.file);
        }
      }

      const res = await fetch('/api/matchmaker/candidates/manual', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Save failed');
      }

      updateCard(cardId, { status: 'saved' });
      setSavedCount((prev) => prev + 1);
      toast.success(`${fields.firstName} ${fields.lastName} נשמר/ה בהצלחה!`);
    } catch (err) {
      updateCard(cardId, {
        status: 'error',
        error: (err as Error).message,
      });
      toast.error(`שגיאה בשמירה: ${(err as Error).message}`);
    }
  };

  // =========================================================================
  // Reset card
  // =========================================================================
  const resetCard = (cardId: string) => {
    const newCard = createEmptyCard();
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...newCard, id: cardId } : card
      )
    );
  };

  // =========================================================================
  // Close & Cleanup
  // =========================================================================
  const handleClose = () => {
    // Clean up object URLs
    cards.forEach((card) => {
      card.images.forEach((img) => URL.revokeObjectURL(img.preview));
    });
    setCards(Array.from({ length: 10 }, createEmptyCard));
    setCardCount(10);
    setSavedCount(0);
    setIsAnalyzingAll(false);
    if (savedCount > 0) onImportComplete();
    onClose();
  };

  // =========================================================================
  // Stats
  // =========================================================================
  const filledCards = cards.filter((c) => c.status !== 'empty').length;
  const analyzedCards = cards.filter(
    (c) => c.status === 'analyzed' || c.status === 'saved'
  ).length;
  const savedCards = cards.filter((c) => c.status === 'saved').length;
  const errorCards = cards.filter((c) => c.status === 'error').length;

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-[95vw] w-[1400px] max-h-[93vh] overflow-hidden flex flex-col p-0"
        dir="rtl"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-l from-indigo-50 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Grid3X3 className="w-5 h-5 text-indigo-600" />
                ייבוא מועמדים בכרטיסים
              </DialogTitle>
              <DialogDescription className="mt-1">
                הדבק תמונות וטקסט לכל כרטיס, נתח עם AI, ואשר לשמירה
              </DialogDescription>
            </div>

            {/* Stats badges */}
            <div className="flex items-center gap-2">
              {filledCards > 0 && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {filledCards} עם תוכן
                </Badge>
              )}
              {analyzedCards > 0 && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  {analyzedCards} נותחו
                </Badge>
              )}
              {savedCards > 0 && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  {savedCards} נשמרו ✓
                </Badge>
              )}
              {errorCards > 0 && (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  {errorCards} שגיאות
                </Badge>
              )}
            </div>
          </div>

          {/* Controls bar */}
          <div className="flex items-center gap-3 mt-3">
            {/* Card count selector */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600">מספר כרטיסים:</Label>
              <div className="flex gap-1">
                {CARD_COUNT_OPTIONS.map((count) => (
                  <Button
                    key={count}
                    variant={cardCount === count ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => handleCardCountChange(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => addMoreCards(5)}
              >
                <Plus className="w-3 h-3 ml-1" />
                עוד 5
              </Button>
            </div>

            <div className="flex-1" />

            {/* Analyze all button */}
            <Button
              onClick={analyzeAllCards}
              disabled={isAnalyzingAll || filledCards === 0}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              size="sm"
            >
              {isAnalyzingAll ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 ml-2" />
              )}
              {isAnalyzingAll ? 'מנתח...' : `נתח הכל (${filledCards})`}
            </Button>
          </div>
        </DialogHeader>

        {/* Cards Grid */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cards.map((card, index) => (
              <CandidateCard
                key={card.id}
                card={card}
                index={index}
                onUpdateCard={updateCard}
                onUpdateField={updateExtractedField}
                onImageUpload={handleImageUpload}
                onRemoveImage={removeImage}
                onPaste={handlePaste}
                onAnalyze={analyzeCard}
                onSave={saveCard}
                onReset={resetCard}
                fileInputRef={(el) => {
                  fileInputRefs.current[card.id] = el;
                }}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {savedCards > 0 && `${savedCards} מועמדים נשמרו בהצלחה`}
          </div>
          <Button variant="outline" onClick={handleClose}>
            {savedCards > 0 ? 'סגור ורענן' : 'ביטול'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ===========================================================================
// CandidateCard Component
// ===========================================================================

interface CandidateCardProps {
  card: CardData;
  index: number;
  onUpdateCard: (id: string, updates: Partial<CardData>) => void;
  onUpdateField: (
    id: string,
    field: keyof ExtractedFields,
    value: string
  ) => void;
  onImageUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string, index: number) => void;
  onPaste: (id: string, e: React.ClipboardEvent) => void;
  onAnalyze: (id: string) => void;
  onSave: (id: string) => void;
  onReset: (id: string) => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = React.memo(
  ({
    card,
    index,
    onUpdateCard,
    onUpdateField,
    onImageUpload,
    onRemoveImage,
    onPaste,
    onAnalyze,
    onSave,
    onReset,
    fileInputRef,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const statusConfig: Record<
      CardData['status'],
      {
        color: string;
        bg: string;
        border: string;
        label: string;
        icon: React.ReactNode;
      }
    > = {
      empty: {
        color: 'text-gray-400',
        bg: 'bg-white',
        border: 'border-gray-200 border-dashed',
        label: 'ריק',
        icon: null,
      },
      'has-input': {
        color: 'text-blue-600',
        bg: 'bg-blue-50/30',
        border: 'border-blue-200',
        label: 'ממתין לניתוח',
        icon: <Zap className="w-3 h-3" />,
      },
      analyzing: {
        color: 'text-purple-600',
        bg: 'bg-purple-50/30',
        border: 'border-purple-300',
        label: 'מנתח...',
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
      },
      analyzed: {
        color: 'text-indigo-600',
        bg: 'bg-indigo-50/30',
        border: 'border-indigo-300',
        label: 'נותח - ממתין לאישור',
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      saving: {
        color: 'text-amber-600',
        bg: 'bg-amber-50/30',
        border: 'border-amber-300',
        label: 'שומר...',
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
      },
      saved: {
        color: 'text-green-600',
        bg: 'bg-green-50/30',
        border: 'border-green-300',
        label: 'נשמר ✓',
        icon: <Check className="w-3 h-3" />,
      },
      error: {
        color: 'text-red-600',
        bg: 'bg-red-50/30',
        border: 'border-red-300',
        label: 'שגיאה',
        icon: <AlertCircle className="w-3 h-3" />,
      },
    };

    const config = statusConfig[card.status];
    const isSaved = card.status === 'saved';
    const isAnalyzing = card.status === 'analyzing';
    const isSaving = card.status === 'saving';
    const isDisabled = isSaved || isAnalyzing || isSaving;

    return (
      <div
        className={`rounded-xl border-2 ${config.border} ${config.bg} transition-all duration-200 overflow-hidden ${isSaved ? 'opacity-60' : ''}`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
              {index + 1}
            </span>
            <div
              className={`flex items-center gap-1 text-xs font-medium ${config.color}`}
            >
              {config.icon}
              {config.label}
            </div>
            {card.aiConfidence && <ConfidenceBadge level={card.aiConfidence} />}
          </div>
          <div className="flex items-center gap-1">
            {!isSaved && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                onClick={() => onReset(card.id)}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
            {card.extracted && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Input Area (shown when not yet analyzed or when expanded) */}
        {(card.status === 'empty' ||
          card.status === 'has-input' ||
          card.status === 'error') && (
          <div className="p-3 space-y-2">
            {/* Image upload zone */}
            <div onPaste={(e) => onPaste(card.id, e)} className="relative">
              {card.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {card.images.map((img, imgIdx) => (
                    <div key={imgIdx} className="relative group aspect-square">
                      <img
                        src={img.preview}
                        className="rounded-lg object-cover w-full h-full border border-gray-200"
                        alt=""
                      />
                      {!isDisabled && (
                        <button
                          type="button"
                          onClick={() => onRemoveImage(card.id, imgIdx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {card.images.length < MAX_IMAGES_PER_CARD && !isDisabled && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                      <Plus className="w-5 h-5 text-gray-400" />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onImageUpload(card.id, e)}
                        ref={fileInputRef}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">
                    העלה או הדבק תמונות
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Ctrl+V להדבקה
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onImageUpload(card.id, e)}
                    ref={fileInputRef}
                  />
                </label>
              )}
            </div>

            {/* Text input */}
            <Textarea
              value={card.rawText}
              onChange={(e) =>
                onUpdateCard(card.id, {
                  rawText: e.target.value,
                  status: 'has-input',
                })
              }
              onPaste={(e) => onPaste(card.id, e)}
              placeholder="הדבק כאן טקסט מהוואטסאפ..."
              rows={3}
              dir="rtl"
              disabled={isDisabled}
              className="text-sm resize-none"
            />

            {/* Error message */}
            {card.error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {card.error}
              </p>
            )}

            {/* Analyze button */}
            <Button
              onClick={() => onAnalyze(card.id)}
              disabled={
                isDisabled || (card.images.length === 0 && !card.rawText.trim())
              }
              size="sm"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
            >
              {isAnalyzing ? (
                <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 ml-1.5" />
              )}
              {isAnalyzing ? 'מנתח...' : 'נתח עם AI'}
            </Button>
          </div>
        )}

        {/* Analyzed Fields Display */}
        {card.extracted &&
          card.status !== 'empty' &&
          card.status !== 'has-input' && (
            <div className="p-3 space-y-2">
              {/* Quick summary */}
              {!isExpanded && (
                <div className="space-y-2">
                  {/* Name + basic info */}
                  <div className="flex items-center gap-2">
                    {card.images.length > 0 && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={card.images[0].preview}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 truncate">
                        {card.extracted.firstName} {card.extracted.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[
                          card.extracted.age && `גיל ${card.extracted.age}`,
                          card.extracted.city,
                          card.extracted.religiousLevel,
                          card.extracted.gender === 'MALE'
                            ? '♂'
                            : card.extracted.gender === 'FEMALE'
                              ? '♀'
                              : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>

                  {/* AI notes */}
                  {card.aiNotes && (
                    <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      💡 {card.aiNotes}
                    </p>
                  )}

                  {/* Actions */}
                  {!isSaved && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onSave(card.id)}
                        disabled={isSaving}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5 ml-1.5" />
                        )}
                        {isSaving ? 'שומר...' : 'אשר ושמור'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExpanded(true)}
                      >
                        ערוך
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Expanded edit form */}
              {isExpanded && (
                <div className="space-y-3">
                  {/* Images */}
                  {card.images.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {card.images.map((img, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="relative flex-shrink-0 w-14 h-14 group"
                        >
                          <img
                            src={img.preview}
                            className="rounded-md object-cover w-full h-full border"
                            alt=""
                          />
                          {!isDisabled && (
                            <button
                              type="button"
                              onClick={() => onRemoveImage(card.id, imgIdx)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fields grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        key: 'firstName' as const,
                        label: 'שם פרטי',
                        required: true,
                      },
                      {
                        key: 'lastName' as const,
                        label: 'שם משפחה',
                        required: true,
                      },
                      { key: 'age' as const, label: 'גיל', type: 'number' },
                      {
                        key: 'height' as const,
                        label: 'גובה (ס״מ)',
                        type: 'number',
                      },
                      { key: 'city' as const, label: 'עיר' },
                      { key: 'occupation' as const, label: 'עיסוק' },
                      { key: 'education' as const, label: 'לימודים' },
                      { key: 'phone' as const, label: 'טלפון', dir: 'ltr' },
                      // הסרנו את origin מכאן!
                      { key: 'referredBy' as const, label: 'הופנה ע״י' },
                      { key: 'languages' as const, label: 'שפות' },
                      { key: 'militaryService' as const, label: 'שירות צבאי' },
                    ].map(({ key, label, type, dir, required }) => (
                      <div key={key}>
                        <Label className="text-[10px] text-gray-500">
                          {label}
                          {required && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          value={card.extracted?.[key] || ''}
                          onChange={(e) =>
                            onUpdateField(card.id, key, e.target.value)
                          }
                          dir={(dir as 'ltr' | 'rtl') || 'rtl'}
                          type={type || 'text'}
                          className="h-7 text-xs"
                          disabled={isDisabled}
                        />
                      </div>
                    ))}

                    {/* Gender select */}
                    <div>
                      <Label className="text-[10px] text-gray-500">
                        מגדר<span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={card.extracted?.gender || ''}
                        onValueChange={(v) =>
                          onUpdateField(card.id, 'gender', v)
                        }
                        disabled={isDisabled}
                      >
                        <SelectTrigger className="h-7 text-xs" dir="rtl">
                          <SelectValue placeholder="בחר" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">זכר</SelectItem>
                          <SelectItem value="FEMALE">נקבה</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Marital status select */}
                    <div>
                      <Label className="text-[10px] text-gray-500">
                        מצב משפחתי
                      </Label>
                      <Select
                        value={card.extracted?.maritalStatus || ''}
                        onValueChange={(v) =>
                          onUpdateField(card.id, 'maritalStatus', v)
                        }
                        disabled={isDisabled}
                      >
                        <SelectTrigger className="h-7 text-xs" dir="rtl">
                          <SelectValue placeholder="בחר" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">רווק/ה</SelectItem>
                          <SelectItem value="divorced">גרוש/ה</SelectItem>
                          <SelectItem value="widowed">אלמן/ה</SelectItem>
                          <SelectItem value="separated">פרוד/ה</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Religious level select */}
                    <div>
                      <Label className="text-[10px] text-gray-500">
                        רמה דתית
                      </Label>
                      <Select
                        value={card.extracted?.religiousLevel || ''}
                        onValueChange={(v) =>
                          onUpdateField(card.id, 'religiousLevel', v)
                        }
                        disabled={isDisabled}
                      >
                        <SelectTrigger className="h-7 text-xs" dir="rtl">
                          <SelectValue placeholder="בחר" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="dati_leumi_standard">
                            דתי/ה לאומי/ת (סטנדרטי)
                          </SelectItem>
                          <SelectItem value="dati_leumi_liberal">
                            דתי/ה לאומי/ת ליברלי/ת
                          </SelectItem>
                          <SelectItem value="dati_leumi_torani">
                            דתי/ה לאומי/ת תורני/ת
                          </SelectItem>
                          <SelectItem value="masorti_strong">
                            מסורתי/ת (קרוב/ה לדת)
                          </SelectItem>
                          <SelectItem value="masorti_light">
                            מסורתי/ת (קשר קל למסורת)
                          </SelectItem>
                          <SelectItem value="secular_traditional_connection">
                            חילוני/ת עם זיקה למסורת
                          </SelectItem>
                          <SelectItem value="secular">חילוני/ת</SelectItem>
                          <SelectItem value="spiritual_not_religious">
                            רוחני/ת (לאו דווקא דתי/ה)
                          </SelectItem>
                          <SelectItem value="charedi_modern">
                            חרדי/ת מודרני/ת
                          </SelectItem>
                          <SelectItem value="charedi_litvak">
                            חרדי/ת ליטאי/ת
                          </SelectItem>
                          <SelectItem value="charedi_sephardic">
                            חרדי/ת ספרדי/ת
                          </SelectItem>
                          <SelectItem value="charedi_hasidic">
                            חרדי/ת חסידי/ת
                          </SelectItem>
                          <SelectItem value="chabad">חב״ד</SelectItem>
                          <SelectItem value="breslov">ברסלב</SelectItem>
                          <SelectItem value="other">אחר</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Origin select - Hebrew with expanded options - הוסף כאן! */}
                    <div>
                      <Label className="text-[10px] text-gray-500">מוצא</Label>
                      <Select
                        value={card.extracted?.origin || ''}
                        onValueChange={(v) =>
                          onUpdateField(card.id, 'origin', v)
                        }
                        disabled={isDisabled}
                      >
                        <SelectTrigger className="h-7 text-xs" dir="rtl">
                          <SelectValue placeholder="בחר מוצא" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="אשכנזי">אשכנזי</SelectItem>
                          <SelectItem value="ספרדי">ספרדי</SelectItem>
                          <SelectItem value="מזרחי">מזרחי</SelectItem>
                          <SelectItem value="תימני">תימני</SelectItem>
                          <SelectItem value="מרוקאי">מרוקאי</SelectItem>
                          <SelectItem value="עיראקי">עיראקי</SelectItem>
                          <SelectItem value="פרסי">פרסי</SelectItem>
                          <SelectItem value="כורדי">כורדי</SelectItem>
                          <SelectItem value="תוניסאי">תוניסאי</SelectItem>
                          <SelectItem value="לובי">לובי</SelectItem>
                          <SelectItem value="אתיופי">אתיופי</SelectItem>
                          <SelectItem value="גרוזיני">גרוזיני</SelectItem>
                          <SelectItem value="בוכרי">בוכרי</SelectItem>
                          <SelectItem value="הודי">הודי</SelectItem>
                          <SelectItem value="תורכי">תורכי</SelectItem>
                          <SelectItem value="מעורב">מעורב</SelectItem>
                          <SelectItem value="אחר">אחר</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Text fields */}
                  <div>
                    <Label className="text-[10px] text-gray-500">
                      אופי ותכונות
                    </Label>
                    <Textarea
                      value={card.extracted?.personality || ''}
                      onChange={(e) =>
                        onUpdateField(card.id, 'personality', e.target.value)
                      }
                      rows={2}
                      dir="rtl"
                      className="text-xs resize-none"
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-500">מחפש/ת</Label>
                    <Textarea
                      value={card.extracted?.lookingFor || ''}
                      onChange={(e) =>
                        onUpdateField(card.id, 'lookingFor', e.target.value)
                      }
                      rows={2}
                      dir="rtl"
                      className="text-xs resize-none"
                      disabled={isDisabled}
                    />
                  </div>

                  {/* Actions */}
                  {!isSaved && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={() => onSave(card.id)}
                        disabled={isSaving}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5 ml-1.5" />
                        )}
                        אשר ושמור
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExpanded(false)}
                      >
                        <ChevronUp className="w-3 h-3 ml-1" />
                        סגור
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAnalyze(card.id)}
                        className="text-purple-600"
                      >
                        <RotateCcw className="w-3 h-3 ml-1" />
                        נתח שוב
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
      </div>
    );
  }
);

CandidateCard.displayName = 'CandidateCard';

// ---------------------------------------------------------------------------
// ConfidenceBadge (small)
// ---------------------------------------------------------------------------
const ConfidenceBadge = ({ level }: { level: string }) => {
  const cfg: Record<string, { label: string; cls: string }> = {
    high: { label: '✓', cls: 'bg-green-100 text-green-700' },
    medium: { label: '~', cls: 'bg-yellow-100 text-yellow-700' },
    low: { label: '!', cls: 'bg-red-100 text-red-700' },
  };
  const c = cfg[level] || { label: '?', cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.cls}`}>
      {c.label}
    </span>
  );
};
