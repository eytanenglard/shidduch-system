// =============================================================================
// File: src/components/matchmaker/new/dialogs/CardBasedImportDialog.tsx
// Description: Unified card-based candidate import with source selection,
//   AI analysis, and batch save. This replaces BulkImportDialog and
//   AddManualCandidateDialog as the single entry point.
// =============================================================================

'use client';

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
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
import { toast } from 'sonner';
import {
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus,
  Save,
  X,
  RotateCcw,
  Zap,
  Check,
  ZoomIn,
  Camera,
  Users,
  CalendarHeart,
  MessageSquareText,
  ArrowRight,
  SaveAll,
  Hash,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CandidateImage {
  file: File;
  preview: string;
  isFormImage: boolean;
}

interface CardData {
  id: string;
  images: CandidateImage[];
  rawText: string;
  extracted: ExtractedFields | null;
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
  nativeLanguage: string;
  additionalLanguages: string;
  about: string;
  manualEntryText: string;
  hasChildrenFromPrevious: string;
}

interface SourceOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  referredByValue: string;
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

const SOURCE_OPTIONS: SourceOption[] = [
  {
    id: 'shvivel',
    label: 'קבוצת שידוכים שוובל',
    icon: <Users className="w-6 h-6" />,
    description: 'מועמדים מקבוצת השידוכים',
    referredByValue: 'קבוצת שידוכים שוובל',
  },
  {
    id: 'event3',
    label: 'ערב שידוכים 3',
    icon: <CalendarHeart className="w-6 h-6" />,
    description: 'מועמדים מערב שידוכים 3',
    referredByValue: 'ערב שידוכים 3',
  },
  {
    id: 'custom',
    label: 'מקור אחר',
    icon: <MessageSquareText className="w-6 h-6" />,
    description: 'הזן מקור מותאם אישית',
    referredByValue: '',
  },
];

// Marital status mapping
const MARITAL_STATUS_NORMALIZE: Record<string, string> = {
  single: 'SINGLE',
  divorced: 'DIVORCED',
  widowed: 'WIDOWED',
  SINGLE: 'SINGLE',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED',
  רווק: 'SINGLE',
  רווקה: 'SINGLE',
  גרוש: 'DIVORCED',
  גרושה: 'DIVORCED',
  אלמן: 'WIDOWED',
  אלמנה: 'WIDOWED',
  פרוד: 'DIVORCED',
  פרודה: 'DIVORCED',
  separated: 'DIVORCED',
};

const MARITAL_STATUS_DISPLAY: Record<string, string> = {
  SINGLE: 'רווק/ה',
  DIVORCED: 'גרוש/ה',
  WIDOWED: 'אלמן/ה',
};

function normalizeMaritalStatus(value: string | null | undefined): string {
  if (!value) return 'SINGLE';
  return MARITAL_STATUS_NORMALIZE[value.trim()] || 'SINGLE';
}

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
// Hook: detect mobile
// ---------------------------------------------------------------------------
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

// ---------------------------------------------------------------------------
// ProgressBar component
// ---------------------------------------------------------------------------
const ProgressBar: React.FC<{
  filled: number;
  analyzed: number;
  saved: number;
  total: number;
  errors: number;
}> = ({ filled, analyzed, saved, total, errors }) => {
  const pctFilled = total > 0 ? (filled / total) * 100 : 0;
  const pctAnalyzed = total > 0 ? (analyzed / total) * 100 : 0;
  const pctSaved = total > 0 ? (saved / total) * 100 : 0;

  if (filled === 0 && analyzed === 0 && saved === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 px-0.5">
        <div className="flex items-center gap-3">
          {filled > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              {filled} תוכן
            </span>
          )}
          {analyzed > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              {analyzed} נותחו
            </span>
          )}
          {saved > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {saved} נשמרו
            </span>
          )}
          {errors > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              {errors} שגיאות
            </span>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
        <div
          className="bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${pctSaved}%` }}
        />
        <div
          className="bg-purple-400 transition-all duration-500 ease-out"
          style={{ width: `${Math.max(0, pctAnalyzed - pctSaved)}%` }}
        />
        <div
          className="bg-blue-300 transition-all duration-500 ease-out"
          style={{ width: `${Math.max(0, pctFilled - pctAnalyzed)}%` }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ImageStrip component — improved mobile layout
// ---------------------------------------------------------------------------
interface ImageStripProps {
  cardId: string;
  images: CandidateImage[];
  canEdit: boolean;
  isMobile: boolean;
  size?: 'sm' | 'md';
  onRemoveImage: (cardId: string, index: number) => void;
  onImageUpload: (
    cardId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onPreview: (url: string) => void;
}

const ImageStrip: React.FC<ImageStripProps> = ({
  cardId,
  images,
  canEdit,
  isMobile,
  size = 'md',
  onRemoveImage,
  onImageUpload,
  onPreview,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const dim = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16 sm:w-18 sm:h-18';
  const addDim = dim;

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin items-center">
      {images.map((img, imgIdx) => (
        <div key={imgIdx} className={`relative flex-shrink-0 ${dim} group`}>
          <img
            src={img.preview}
            className="rounded-lg object-cover w-full h-full border border-gray-200 cursor-pointer active:scale-95 transition-transform"
            alt=""
            onClick={() => onPreview(img.preview)}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(img.preview);
            }}
            className="absolute bottom-0 left-0 bg-black/50 text-white rounded-tr-lg rounded-bl-lg w-5 h-5 text-[9px] flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(cardId, imgIdx);
              }}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-[9px] flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow"
            >
              ×
            </button>
          )}
        </div>
      ))}

      {canEdit && images.length < MAX_IMAGES_PER_CARD && (
        <label
          className={`flex-shrink-0 ${addDim} border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-colors active:bg-teal-100/50 active:scale-95`}
        >
          <Plus className="w-4 h-4 text-gray-400" />
          <span className="text-[9px] text-gray-400 mt-0.5">הוסף</span>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => onImageUpload(cardId, e)}
          />
        </label>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ConfidenceBadge
// ---------------------------------------------------------------------------
const ConfidenceBadge = ({ level }: { level: string }) => {
  const cfg: Record<string, { label: string; cls: string }> = {
    high: { label: '✓', cls: 'bg-emerald-100 text-emerald-700' },
    medium: { label: '~', cls: 'bg-amber-100 text-amber-700' },
    low: { label: '!', cls: 'bg-red-100 text-red-700' },
  };
  const c = cfg[level] || { label: '?', cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.cls}`}>
      {c.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// SourceSelectionScreen
// ---------------------------------------------------------------------------
interface SourceSelectionScreenProps {
  onSelectSource: (source: SourceOption, customValue?: string) => void;
}

const SourceSelectionScreen: React.FC<SourceSelectionScreenProps> = ({
  onSelectSource,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customSource, setCustomSource] = useState('');

  const handleContinue = () => {
    const source = SOURCE_OPTIONS.find((s) => s.id === selectedId);
    if (!source) return;
    if (source.id === 'custom' && !customSource.trim()) {
      toast.error('נא להזין שם מקור');
      return;
    }
    onSelectSource(
      source,
      source.id === 'custom' ? customSource.trim() : undefined
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[40vh] px-4 sm:px-8 py-6">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200">
          <Users className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          מאיפה הגיעו המועמדים?
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          בחר את מקור ההפניה — הוא יוזן אוטומטית לכל המועמדים שתוסיף
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg sm:max-w-2xl">
        {SOURCE_OPTIONS.map((source) => {
          const isSelected = selectedId === source.id;
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => setSelectedId(source.id)}
              className={`
                relative flex flex-row sm:flex-col items-center gap-3 sm:gap-2 p-4 sm:p-5
                rounded-xl border-2 transition-all duration-200 text-right sm:text-center
                ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-100'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected
                    ? 'bg-teal-100 text-teal-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {source.icon}
              </div>
              <div className="min-w-0">
                <div
                  className={`font-semibold text-sm ${isSelected ? 'text-teal-700' : 'text-gray-700'}`}
                >
                  {source.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {source.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom source input */}
      {selectedId === 'custom' && (
        <div className="mt-4 w-full max-w-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <Input
            value={customSource}
            onChange={(e) => setCustomSource(e.target.value)}
            placeholder="הזן שם מקור (למשל: פנייה ישירה, אתר, חבר...)"
            dir="rtl"
            className="h-11 text-sm"
            autoFocus
          />
        </div>
      )}

      <Button
        onClick={handleContinue}
        disabled={!selectedId}
        className="mt-8 h-12 px-8 text-base bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-200 disabled:opacity-40 disabled:shadow-none"
      >
        המשך לייבוא
        <ArrowRight className="w-5 h-5 mr-2 rtl:rotate-180" />
      </Button>
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
          // Pass the global source so the server can use it
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

          // Normalize maritalStatus
          if (fields.maritalStatus) {
            fields.maritalStatus = normalizeMaritalStatus(fields.maritalStatus);
          } else {
            fields.maritalStatus = 'SINGLE';
          }

          // Fallback lastName
          if (!fields.lastName || fields.lastName.trim() === '') {
            fields.lastName = 'לא ידוע';
          }

          // Set referredBy from global source (override AI's guess)
          fields.referredBy =
            referredByGlobal || fields.referredBy || 'קבוצת שידוכים שוובל';

          // Fallback about
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
  // AI Analysis — All Cards
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
      await new Promise((r) => setTimeout(r, 500));
    }

    setIsAnalyzingAll(false);
    toast.success(`ניתוח הושלם: ${successCount} הצליחו, ${failCount} נכשלו`);
  };

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

        // Always use global referredBy
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

        updateCard(cardId, { status: 'saved' });
        setSavedCount((prev) => prev + 1);
        toast.success(`${fields.firstName} ${fields.lastName} נשמר/ה!`);
        return true;
      } catch (err) {
        updateCard(cardId, { status: 'error', error: (err as Error).message });
        toast.error(`שגיאה: ${(err as Error).message}`);
        return false;
      }
    },
    [cards, referredByGlobal, updateCard]
  );

  // =========================================================================
  // Save ALL analyzed cards
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

    for (const card of cardsToSave) {
      const success = await saveCard(card.id);
      if (success) successCount++;
      else failCount++;
      await new Promise((r) => setTimeout(r, 300));
    }

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
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t bg-gray-50/80 flex items-center justify-between flex-shrink-0 safe-area-bottom gap-2">
              <div className="flex items-center gap-2">
                {readyToSaveCount > 0 && (
                  <Button
                    onClick={saveAllAnalyzed}
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

// ===========================================================================
// CandidateCard Component — improved mobile layout
// ===========================================================================

interface CandidateCardProps {
  card: CardData;
  index: number;
  isMobile: boolean;
  onUpdateCard: (id: string, updates: Partial<CardData>) => void;
  onUpdateField: (
    id: string,
    field: keyof ExtractedFields,
    value: string
  ) => void;
  onImageUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string, index: number) => void;
  onPaste: (id: string, e: React.ClipboardEvent) => void;
  onDrop: (id: string, e: React.DragEvent) => void;
  onAnalyze: (id: string) => void;
  onSave: (id: string) => Promise<boolean>;
  onReset: (id: string) => void;
}

const CandidateCard = React.memo(
  React.forwardRef<HTMLDivElement, CandidateCardProps>(
    (
      {
        card,
        index,
        isMobile,
        onUpdateCard,
        onUpdateField,
        onImageUpload,
        onRemoveImage,
        onPaste,
        onDrop,
        onAnalyze,
        onSave,
        onReset,
      },
      ref
    ) => {
      const [isExpanded, setIsExpanded] = useState(false);
      const [isDragOver, setIsDragOver] = useState(false);
      const [previewImage, setPreviewImage] = useState<string | null>(null);

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
          bg: 'bg-blue-50/20',
          border: 'border-blue-200',
          label: 'ממתין לניתוח',
          icon: <Zap className="w-3 h-3" />,
        },
        analyzing: {
          color: 'text-purple-600',
          bg: 'bg-purple-50/20',
          border: 'border-purple-300',
          label: 'מנתח...',
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
        },
        analyzed: {
          color: 'text-teal-600',
          bg: 'bg-teal-50/20',
          border: 'border-teal-300',
          label: 'ממתין לאישור',
          icon: <CheckCircle2 className="w-3 h-3" />,
        },
        saving: {
          color: 'text-amber-600',
          bg: 'bg-amber-50/20',
          border: 'border-amber-300',
          label: 'שומר...',
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
        },
        saved: {
          color: 'text-emerald-600',
          bg: 'bg-emerald-50/20',
          border: 'border-emerald-300',
          label: 'נשמר ✓',
          icon: <Check className="w-3 h-3" />,
        },
        error: {
          color: 'text-red-600',
          bg: 'bg-red-50/20',
          border: 'border-red-300',
          label: 'שגיאה',
          icon: <AlertCircle className="w-3 h-3" />,
        },
      };

      const config = statusConfig[card.status];
      const isSaved = card.status === 'saved';
      const isAnalyzing = card.status === 'analyzing';
      const isSaving = card.status === 'saving';
      const canEditImages = !isSaved && !isSaving;
      const isInputDisabled = isSaved || isAnalyzing || isSaving;
      const isInputPhase =
        card.status === 'empty' ||
        card.status === 'has-input' ||
        card.status === 'error';
      const isPostAnalysis = card.extracted && !isInputPhase;

      const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (canEditImages) setIsDragOver(true);
      };
      const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      };
      const handleDropOnCard = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (canEditImages) onDrop(card.id, e);
      };

      return (
        <div
          ref={ref}
          className={`rounded-xl border-2 ${config.border} ${config.bg} transition-all duration-200 ${
            isSaved ? 'opacity-50' : ''
          } overflow-hidden relative`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDropOnCard}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              <div
                className={`flex items-center gap-1 text-[11px] font-medium ${config.color} truncate`}
              >
                {config.icon}
                <span className="truncate">{config.label}</span>
              </div>
              {card.aiConfidence && (
                <ConfidenceBadge level={card.aiConfidence} />
              )}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {!isSaved && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                  onClick={() => onReset(card.id)}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              )}
              {card.extracted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
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

          {/* INPUT PHASE */}
          {isInputPhase && (
            <div
              className="p-2.5 sm:p-3 space-y-2"
              onPaste={(e) => onPaste(card.id, e)}
            >
              {/* Compact input area: images + text side by side on mobile */}
              <div className="flex gap-2">
                {/* Image upload — compact thumbnail area */}
                <div className="flex-shrink-0">
                  {card.images.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {card.images.slice(0, 2).map((img, imgIdx) => (
                        <div key={imgIdx} className="relative w-14 h-14 group">
                          <img
                            src={img.preview}
                            className="rounded-lg object-cover w-full h-full border border-gray-200 cursor-pointer"
                            alt=""
                            onClick={() => setPreviewImage(img.preview)}
                          />
                          {canEditImages && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveImage(card.id, imgIdx);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center shadow"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {card.images.length > 2 && (
                        <span className="text-[9px] text-gray-400 text-center">
                          +{card.images.length - 2}
                        </span>
                      )}
                      {canEditImages &&
                        card.images.length < MAX_IMAGES_PER_CARD && (
                          <label className="w-14 h-8 border border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-teal-400 transition-colors">
                            <Plus className="w-3 h-3 text-gray-400" />
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => onImageUpload(card.id, e)}
                            />
                          </label>
                        )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-14 h-full min-h-[80px] border-2 border-dashed rounded-xl cursor-pointer transition-all active:scale-95 border-gray-300 hover:border-teal-400 hover:bg-teal-50/30">
                      <Camera className="w-5 h-5 text-gray-400 mb-0.5" />
                      <span className="text-[8px] text-gray-400 leading-tight text-center">
                        תמונה
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onImageUpload(card.id, e)}
                      />
                    </label>
                  )}
                </div>

                {/* Text area — takes remaining space */}
                <div className="flex-1 min-w-0">
                  <Textarea
                    value={card.rawText}
                    onChange={(e) =>
                      onUpdateCard(card.id, {
                        rawText: e.target.value,
                        status: 'has-input',
                      })
                    }
                    placeholder="הדבק כאן טקסט מוואטסאפ, טופס, או הקלד פרטים..."
                    rows={isMobile ? 4 : 3}
                    dir="rtl"
                    disabled={isInputDisabled}
                    className="text-sm resize-none h-full min-h-[80px]"
                  />
                </div>
              </div>

              {card.error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">שגיאה: </span>
                    <span>{card.error}</span>
                    <button
                      onClick={() => onAnalyze(card.id)}
                      className="block mt-1 text-red-700 underline font-medium"
                    >
                      נסה שוב
                    </button>
                  </div>
                </div>
              )}

              <Button
                onClick={() => onAnalyze(card.id)}
                disabled={
                  isInputDisabled ||
                  (card.images.length === 0 && !card.rawText.trim())
                }
                size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white h-10 sm:h-9 text-sm font-medium active:scale-[0.98] transition-transform"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 ml-2" />
                )}
                {isAnalyzing ? 'מנתח...' : 'סריקת AI'}
              </Button>
            </div>
          )}

          {/* POST-ANALYSIS PHASE */}
          {isPostAnalysis && (
            <div className="p-2.5 sm:p-3 space-y-2">
              {!isExpanded && (
                <div className="space-y-2">
                  {/* Compact summary: avatar-like image + info */}
                  <div className="flex items-start gap-2.5">
                    {card.images.length > 0 && (
                      <img
                        src={card.images[0].preview}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0 cursor-pointer"
                        alt=""
                        onClick={() => setPreviewImage(card.images[0].preview)}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 truncate text-sm sm:text-base leading-tight">
                        {card.extracted!.firstName} {card.extracted!.lastName}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {[
                          card.extracted!.age && `גיל ${card.extracted!.age}`,
                          card.extracted!.city,
                          card.extracted!.gender === 'MALE'
                            ? '♂'
                            : card.extracted!.gender === 'FEMALE'
                              ? '♀'
                              : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {[
                          card.extracted!.religiousLevel,
                          MARITAL_STATUS_DISPLAY[
                            card.extracted!.maritalStatus
                          ] || '',
                          card.extracted!.occupation,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {/* Extra images count */}
                    {card.images.length > 1 && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 flex-shrink-0">
                        +{card.images.length - 1} תמונות
                      </span>
                    )}
                  </div>

                  {card.aiNotes && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg leading-relaxed">
                      💡 {card.aiNotes}
                    </p>
                  )}

                  {!isSaved && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onSave(card.id)}
                        disabled={isSaving}
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 sm:h-9 text-sm font-medium active:scale-[0.98] transition-transform"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 ml-1.5 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 ml-1.5" />
                        )}
                        {isSaving ? 'שומר...' : 'אשר ושמור'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 sm:h-9 px-3"
                        onClick={() => setIsExpanded(true)}
                      >
                        ערוך
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {isExpanded && (
                <ExpandedEditForm
                  card={card}
                  isMobile={isMobile}
                  canEditImages={canEditImages}
                  isDisabled={isInputDisabled}
                  isSaved={isSaved}
                  isSaving={isSaving}
                  onUpdateField={onUpdateField}
                  onRemoveImage={onRemoveImage}
                  onImageUpload={onImageUpload}
                  onSave={onSave}
                  onAnalyze={onAnalyze}
                  setIsExpanded={setIsExpanded}
                  setPreviewImage={setPreviewImage}
                />
              )}
            </div>
          )}

          {/* Drag overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-teal-100/80 border-2 border-dashed border-teal-500 rounded-xl flex items-center justify-center z-10">
              <div className="text-center">
                <Upload className="w-6 h-6 text-teal-600 mx-auto mb-1" />
                <span className="text-sm text-teal-700 font-medium">
                  שחרר להוספה
                </span>
              </div>
            </div>
          )}

          {/* Image Preview Modal */}
          {previewImage && (
            <div
              className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
              onClick={() => setPreviewImage(null)}
            >
              <div className="relative max-w-[90vw] max-h-[85vh]">
                <img
                  src={previewImage}
                  alt="תצוגה מקדימה"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                />
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }
  )
);

CandidateCard.displayName = 'CandidateCard';

// ===========================================================================
// ExpandedEditForm
// ===========================================================================

interface ExpandedEditFormProps {
  card: CardData;
  isMobile: boolean;
  canEditImages: boolean;
  isDisabled: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onUpdateField: (
    id: string,
    field: keyof ExtractedFields,
    value: string
  ) => void;
  onRemoveImage: (id: string, index: number) => void;
  onImageUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: (id: string) => Promise<boolean>;
  onAnalyze: (id: string) => void;
  setIsExpanded: (v: boolean) => void;
  setPreviewImage: (v: string | null) => void;
}

const ExpandedEditForm: React.FC<ExpandedEditFormProps> = ({
  card,
  isMobile,
  canEditImages,
  isDisabled,
  isSaved,
  isSaving,
  onUpdateField,
  onRemoveImage,
  onImageUpload,
  onSave,
  onAnalyze,
  setIsExpanded,
  setPreviewImage,
}) => {
  const FIELD_DEFINITIONS: {
    key: keyof ExtractedFields;
    label: string;
    required?: boolean;
    type?: string;
    dir?: 'ltr' | 'rtl';
  }[] = [
    { key: 'firstName', label: 'שם פרטי', required: true },
    { key: 'lastName', label: 'שם משפחה', required: true },
    { key: 'age', label: 'גיל', type: 'number' },
    { key: 'height', label: 'גובה (ס״מ)', type: 'number' },
    { key: 'city', label: 'עיר' },
    { key: 'occupation', label: 'עיסוק' },
    { key: 'education', label: 'לימודים / מוסד' },
    { key: 'educationLevel', label: 'רמת השכלה' },
    { key: 'phone', label: 'טלפון', dir: 'ltr' },
    { key: 'referredBy', label: 'הופנה ע״י' },
    { key: 'nativeLanguage', label: 'שפת אם' },
    { key: 'additionalLanguages', label: 'שפות נוספות' },
    { key: 'militaryService', label: 'שירות צבאי / לאומי' },
  ];

  return (
    <div className="space-y-2.5 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto overscroll-contain pr-1 -mr-1 pb-2">
      {/* Image management */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
            <Camera className="w-3 h-3" />
            תמונות ({card.images.length}/{MAX_IMAGES_PER_CARD})
          </Label>
          {canEditImages && card.images.length < MAX_IMAGES_PER_CARD && (
            <label className="cursor-pointer">
              <span className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5">
                <Plus className="w-3 h-3" />
                הוסף
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => onImageUpload(card.id, e)}
              />
            </label>
          )}
        </div>
        <ImageStrip
          cardId={card.id}
          images={card.images}
          canEdit={canEditImages}
          isMobile={isMobile}
          size="sm"
          onRemoveImage={onRemoveImage}
          onImageUpload={onImageUpload}
          onPreview={setPreviewImage}
        />
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-2 gap-2">
        {FIELD_DEFINITIONS.map(({ key, label, type, dir, required }) => (
          <div key={key}>
            <Label className="text-[10px] text-gray-500 mb-0.5 block">
              {label}
              {required && <span className="text-red-500 mr-0.5">*</span>}
            </Label>
            <Input
              value={card.extracted?.[key] || ''}
              onChange={(e) => onUpdateField(card.id, key, e.target.value)}
              dir={dir || 'rtl'}
              type={type || 'text'}
              className="h-9 sm:h-8 text-sm sm:text-xs"
              disabled={isDisabled}
            />
          </div>
        ))}

        {/* Gender */}
        <div>
          <Label className="text-[10px] text-gray-500 mb-0.5 block">
            מגדר<span className="text-red-500 mr-0.5">*</span>
          </Label>
          <Select
            value={card.extracted?.gender || ''}
            onValueChange={(v) => onUpdateField(card.id, 'gender', v)}
            disabled={isDisabled}
          >
            <SelectTrigger className="h-9 sm:h-8 text-sm sm:text-xs" dir="rtl">
              <SelectValue placeholder="בחר" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">זכר</SelectItem>
              <SelectItem value="FEMALE">נקבה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Marital status */}
        <div>
          <Label className="text-[10px] text-gray-500 mb-0.5 block">
            מצב משפחתי
          </Label>
          <Select
            value={card.extracted?.maritalStatus || 'SINGLE'}
            onValueChange={(v) => onUpdateField(card.id, 'maritalStatus', v)}
            disabled={isDisabled}
          >
            <SelectTrigger className="h-9 sm:h-8 text-sm sm:text-xs" dir="rtl">
              <SelectValue placeholder="בחר" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">רווק/ה</SelectItem>
              <SelectItem value="DIVORCED">גרוש/ה</SelectItem>
              <SelectItem value="WIDOWED">אלמן/ה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Religious level */}
        <div>
          <Label className="text-[10px] text-gray-500 mb-0.5 block">
            רמה דתית
          </Label>
          <Select
            value={card.extracted?.religiousLevel || ''}
            onValueChange={(v) => onUpdateField(card.id, 'religiousLevel', v)}
            disabled={isDisabled}
          >
            <SelectTrigger className="h-9 sm:h-8 text-sm sm:text-xs" dir="rtl">
              <SelectValue placeholder="בחר" />
            </SelectTrigger>
            <SelectContent className="max-h-[250px]">
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
              <SelectItem value="masorti_light">מסורתי/ת (קשר קל)</SelectItem>
              <SelectItem value="secular_traditional_connection">
                חילוני/ת עם זיקה למסורת
              </SelectItem>
              <SelectItem value="secular">חילוני/ת</SelectItem>
              <SelectItem value="spiritual_not_religious">רוחני/ת</SelectItem>
              <SelectItem value="charedi_modern">חרדי/ת מודרני/ת</SelectItem>
              <SelectItem value="charedi_litvak">חרדי/ת ליטאי/ת</SelectItem>
              <SelectItem value="charedi_sephardic">חרדי/ת ספרדי/ת</SelectItem>
              <SelectItem value="charedi_hasidic">חרדי/ת חסידי/ת</SelectItem>
              <SelectItem value="chabad">חב״ד</SelectItem>
              <SelectItem value="breslov">ברסלב</SelectItem>
              <SelectItem value="other">אחר</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Origin */}
        <div>
          <Label className="text-[10px] text-gray-500 mb-0.5 block">מוצא</Label>
          <Select
            value={card.extracted?.origin || ''}
            onValueChange={(v) => onUpdateField(card.id, 'origin', v)}
            disabled={isDisabled}
          >
            <SelectTrigger className="h-9 sm:h-8 text-sm sm:text-xs" dir="rtl">
              <SelectValue placeholder="בחר מוצא" />
            </SelectTrigger>
            <SelectContent className="max-h-[250px]">
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

        {/* Has children */}
        <div>
          <Label className="text-[10px] text-gray-500 mb-0.5 block">
            ילדים מקשר קודם
          </Label>
          <Select
            value={card.extracted?.hasChildrenFromPrevious || ''}
            onValueChange={(v) =>
              onUpdateField(card.id, 'hasChildrenFromPrevious', v)
            }
            disabled={isDisabled}
          >
            <SelectTrigger className="h-9 sm:h-8 text-sm sm:text-xs" dir="rtl">
              <SelectValue placeholder="בחר" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">כן</SelectItem>
              <SelectItem value="false">לא</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* About */}
      <div>
        <Label className="text-[10px] text-gray-500 font-semibold mb-0.5 block">
          📄 טקסט מקור (אודות)
        </Label>
        <Textarea
          value={card.extracted?.about || ''}
          onChange={(e) => onUpdateField(card.id, 'about', e.target.value)}
          rows={3}
          dir="rtl"
          className="text-sm sm:text-xs resize-none bg-amber-50/50 border-amber-200"
          disabled={isDisabled}
          placeholder="הטקסט המקורי מהמקור"
        />
      </div>

      {/* Personality */}
      <div>
        <Label className="text-[10px] text-gray-500 mb-0.5 block">
          אופי ותכונות
        </Label>
        <Textarea
          value={card.extracted?.personality || ''}
          onChange={(e) =>
            onUpdateField(card.id, 'personality', e.target.value)
          }
          rows={2}
          dir="rtl"
          className="text-sm sm:text-xs resize-none"
          disabled={isDisabled}
        />
      </div>

      {/* Looking for */}
      <div>
        <Label className="text-[10px] text-gray-500 mb-0.5 block">מחפש/ת</Label>
        <Textarea
          value={card.extracted?.lookingFor || ''}
          onChange={(e) => onUpdateField(card.id, 'lookingFor', e.target.value)}
          rows={2}
          dir="rtl"
          className="text-sm sm:text-xs resize-none"
          disabled={isDisabled}
        />
      </div>

      {/* Actions — sticky bottom */}
      {!isSaved && (
        <div className="flex gap-2 pt-2 sticky bottom-0 bg-white/90 backdrop-blur-sm pb-2 -mx-1 px-1 border-t border-gray-100 mt-2">
          <Button
            onClick={() => onSave(card.id)}
            disabled={isSaving}
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 sm:h-9 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 ml-1.5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 ml-1.5" />
            )}
            אשר ושמור
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 sm:h-9 px-3"
            onClick={() => setIsExpanded(false)}
          >
            <ChevronUp className="w-3.5 h-3.5 ml-1" />
            סגור
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-600 h-10 sm:h-9 px-3"
            onClick={() => onAnalyze(card.id)}
          >
            <RotateCcw className="w-3.5 h-3.5 ml-1" />
            שוב
          </Button>
        </div>
      )}
    </div>
  );
};
