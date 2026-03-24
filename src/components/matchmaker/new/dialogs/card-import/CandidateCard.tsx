'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
import type {
  CandidateImage,
  CardData,
  ExtractedFields,
  CandidateCardProps,
  ExpandedEditFormProps,
} from './types';
import { AiPrepSection } from './AiPrepSection';
import { MAX_IMAGES_PER_CARD, MARITAL_STATUS_DISPLAY } from './utils';

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
// CandidateCard
// ---------------------------------------------------------------------------
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
        onPrepareAi,
        duplicates,
      },
      ref
    ) => {
      const [isExpanded, setIsExpanded] = useState(false);
      const [isDragOver, setIsDragOver] = useState(false);
      const [previewImage, setPreviewImage] = useState<string | null>(null);

      // Debounced textarea: local state + sync back to parent after 300ms
      const [localText, setLocalText] = useState(card.rawText);
      const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

      useEffect(() => {
        setLocalText(card.rawText);
      }, [card.rawText]);

      useEffect(() => {
        return () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
        };
      }, []);

      const handleTextChange = useCallback(
        (value: string) => {
          setLocalText(value);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            onUpdateCard(card.id, { rawText: value, status: 'has-input' });
          }, 300);
        },
        [card.id, onUpdateCard]
      );

      const handleAnalyzeClick = useCallback(() => {
        // Flush pending debounce before analyzing
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          onUpdateCard(card.id, { rawText: localText, status: 'has-input' });
        }
        onAnalyze(card.id);
      }, [card.id, localText, onUpdateCard, onAnalyze]);

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
          color: card.aiPrepStatus === 'preparing' ? 'text-purple-600' : 'text-emerald-600',
          bg: card.aiPrepStatus === 'preparing' ? 'bg-purple-50/20' : 'bg-emerald-50/20',
          border: card.aiPrepStatus === 'preparing' ? 'border-purple-300' : 'border-emerald-300',
          label: card.aiPrepStatus === 'preparing'
            ? 'מכין AI...'
            : card.aiPrepStatus === 'ready'
              ? 'AI מוכן ✓'
              : 'נשמר ✓',
          icon: card.aiPrepStatus === 'preparing'
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : card.aiPrepStatus === 'ready'
              ? <Sparkles className="w-3 h-3" />
              : <Check className="w-3 h-3" />,
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
            isSaved && card.aiPrepStatus === 'idle' ? 'opacity-50' : ''
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
                    value={localText}
                    onChange={(e) => handleTextChange(e.target.value)}
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
                onClick={handleAnalyzeClick}
                disabled={
                  isInputDisabled ||
                  (card.images.length === 0 && !localText.trim())
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

                  {duplicates && duplicates.length > 0 && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1.5 rounded-lg flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <span className="font-medium">כפילות אפשרית: </span>
                        {duplicates.map((d, i) => (
                          <span key={d.id}>
                            {d.firstName} {d.lastName}
                            {d.matchType === 'phone' ? ` (טלפון)` : ` (שם)`}
                            {i < duplicates.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

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

          {/* AI PREPARATION RESULTS */}
          {isSaved && card.aiPrepStatus !== 'idle' && (
            <AiPrepSection
              status={card.aiPrepStatus}
              result={card.aiPrepResult}
              error={card.aiPrepError}
              onRetry={
                card.savedCandidateId
                  ? () => onPrepareAi(card.id, card.savedCandidateId!)
                  : undefined
              }
            />
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
    <>
    <div className="space-y-2.5 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto overscroll-contain pr-1 -mr-1">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

    </div>

      {/* Actions — fixed footer outside scroll */}
      {!isSaved && (
        <div className="flex gap-2 pt-2 border-t border-gray-100 mt-1 px-1">
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
  </>
  );
};

export { CandidateCard };
