import React from 'react';

// ---------------------------------------------------------------------------
// Types for CardBasedImportDialog
// ---------------------------------------------------------------------------

export interface CandidateImage {
  file: File;
  preview: string;
  isFormImage: boolean;
}

export interface AiPrepMetrics {
  aiPersonalitySummary: string | null;
  aiSeekingSummary: string | null;
  aiBackgroundSummary: string | null;
  aiMatchmakerGuidelines: string | null;
  inferredPersonalityType: string | null;
  inferredAttachmentStyle: string | null;
  inferredLoveLanguages: any[] | null;
  inferredRelationshipGoals: any | null;
  socialEnergy: number | null;
  emotionalExpression: number | null;
  stabilityVsSpontaneity: number | null;
  independenceLevel: number | null;
  optimismLevel: number | null;
  ambitionLevel: number | null;
  careerOrientation: number | null;
  intellectualOrientation: number | null;
  spiritualDepth: number | null;
  adventureScore: number | null;
  communicationStyle: string | null;
  conflictStyle: string | null;
  humorStyle: string | null;
  confidenceScore: number | null;
  dataCompleteness: number | null;
  difficultyFlags: any[] | null;
  aiInferredDealBreakers: any[] | null;
  aiInferredMustHaves: any[] | null;
}

export interface AiPrepTags {
  sectorTags: string[];
  backgroundTags: string[];
  personalityTags: string[];
  careerTags: string[];
  lifestyleTags: string[];
  familyVisionTags: string[];
  relationshipTags: string[];
  aiDerivedTags: string[];
  source: string;
}

export interface AiPrepResult {
  metricsUpdated: boolean;
  vectorsUpdated: boolean;
  tagsGenerated: boolean;
  metrics: AiPrepMetrics | null;
  tags: AiPrepTags | null;
  errors?: string[];
}

export interface CardData {
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
  // AI preparation state
  savedCandidateId: string | null;
  aiPrepStatus: 'idle' | 'preparing' | 'ready' | 'error';
  aiPrepResult: AiPrepResult | null;
  aiPrepError: string | null;
}

export interface ExtractedFields {
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

export interface SourceOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  referredByValue: string;
}

export interface CardBasedImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  locale: string;
}

export interface ValidationResult {
  cardId: string;
  name: string;
  isValid: boolean;
  missingFields: string[];
  hasDuplicate: boolean;
}

export interface CandidateCardProps {
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
  onPrepareAi: (cardId: string, candidateId: string) => void;
  duplicates?: { id: string; firstName: string; lastName: string; phone?: string | null; matchType: string }[];
}

export interface ExpandedEditFormProps {
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

export interface AiPrepSectionProps {
  status: CardData['aiPrepStatus'];
  result: AiPrepResult | null;
  error: string | null;
  onRetry?: () => void;
}
