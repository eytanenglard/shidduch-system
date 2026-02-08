// =============================================================================
// File: src/components/matchmaker/new/dialogs/BulkImportDialog.tsx
// Description: Dialog for bulk importing candidates
//   Tab 1 (Flow A): Upload images (forms + photos)
//   Tab 2 (Flow B): Upload WhatsApp chat export + media
// =============================================================================

'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Users,
  Send,
  FileText,
  MessageSquare,
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

interface ExtractedCandidate {
  tempId: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  age: number | null;
  birthDate: string | null;
  birthDateIsApproximate: boolean;
  height: number | null;
  maritalStatus: string | null;
  religiousLevel: string | null;
  origin: string | null;
  languages: string[];
  city: string | null;
  occupation: string | null;
  education: string | null;
  educationLevel: string | null;
  militaryService: string | null;
  personality: string | null;
  hobbies: string | null;
  familyDescription: string | null;
  lookingFor: string | null;
  contactPhone: string | null;
  referredBy: string | null;
  rawFormText: string;
  photoImageIndices: number[];
  formImageIndices: number[];
  photoFileNames: string[];
  confidence: 'high' | 'medium' | 'low';
  notes: string | null;
}

interface BulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  locale: string;
}

type Step = 'upload' | 'analyzing' | 'review' | 'importing' | 'done';
type FlowType = 'images' | 'chat';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  locale,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [flow, setFlow] = useState<FlowType>('images');
  const [progress, setProgress] = useState(0);
  const [testMode, setTestMode] = useState(false); // Limit to 2 candidates for testing
  const [testLimit, setTestLimit] = useState(2);

  // Flow A state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Flow B state
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [chatMediaFiles, setChatMediaFiles] = useState<File[]>([]);
  const [chatMediaPreviews, setChatMediaPreviews] = useState<string[]>([]);

  // Review state (shared)
  const [candidates, setCandidates] = useState<ExtractedCandidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(
    new Set()
  );
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Done state
  const [importResults, setImportResults] = useState<{
    total: number;
    created: number;
    failed: number;
  } | null>(null);

  // =========================================================================
  // Reset
  // =========================================================================
  const resetAll = useCallback(() => {
    setStep('upload');
    setFlow('images');
    setProgress(0);
    setImageFiles([]);
    setImagePreviews([]);
    setChatFile(null);
    setChatMediaFiles([]);
    setChatMediaPreviews([]);
    setCandidates([]);
    setSelectedCandidates(new Set());
    setExpandedCard(null);
    setWarnings([]);
    setStats(null);
    setImportResults(null);
  }, []);

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // =========================================================================
  // Flow A: Image handling
  // =========================================================================
  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const valid: File[] = [];
    const previews: string[] = [];

    newFiles.forEach((file) => {
      if (imageFiles.length + valid.length >= 30) {
        toast.warning('מקסימום 30 תמונות');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} גדול מדי (מקס 10MB)`);
        return;
      }
      valid.push(file);
      previews.push(URL.createObjectURL(file));
    });

    setImageFiles((prev) => [...prev, ...valid]);
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================================================================
  // Flow B: Chat + media handling
  // =========================================================================
  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.zip')) {
      toast.error('נא להעלות קובץ .txt (ייצוא וואטסאפ)');
      return;
    }
    setChatFile(file);
  };

  const handleChatMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const valid: File[] = [];
    const previews: string[] = [];

    newFiles.forEach((file) => {
      if (chatMediaFiles.length + valid.length >= 100) {
        toast.warning('מקסימום 100 תמונות');
        return;
      }
      valid.push(file);
      if (file.type.startsWith('image/')) {
        previews.push(URL.createObjectURL(file));
      }
    });

    setChatMediaFiles((prev) => [...prev, ...valid]);
    setChatMediaPreviews((prev) => [...prev, ...previews]);
  };

  // =========================================================================
  // Analyze (Step 1)
  // =========================================================================
  const handleAnalyze = async () => {
    setStep('analyzing');
    setProgress(0);

    try {
      const formData = new FormData();

      if (flow === 'images') {
        formData.append('mode', 'images');
        if (imageFiles.length === 0) {
          toast.error('נא להעלות תמונות');
          setStep('upload');
          return;
        }
        imageFiles.forEach((f) => formData.append('images', f));
      } else {
        formData.append('mode', 'chat');
        if (!chatFile && chatMediaFiles.length === 0) {
          toast.error('נא להעלות קובץ צ׳אט ו/או תמונות');
          setStep('upload');
          return;
        }
        if (chatFile) formData.append('chatFile', chatFile);
        chatMediaFiles.forEach((f) => formData.append('images', f));
      }

      // Test mode: limit number of candidates
      if (testMode) {
        formData.append('limit', String(testLimit));
      }

      // Progress animation
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 1.5, 90));
      }, 600);

      const res = await fetch('/api/matchmaker/candidates/bulk-import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(result.error || 'Analysis failed');

      const data = result.data;
      setCandidates(data.candidates || []);
      setWarnings(data.warnings || []);
      setStats(data.stats || null);
      setSelectedCandidates(
        new Set((data.candidates || []).map((c: any) => c.tempId))
      );

      setStep('review');
      toast.success(`זוהו ${data.candidates?.length || 0} מועמדים`);
    } catch (err) {
      console.error('Analyze error:', err);
      toast.error(`שגיאה: ${(err as Error).message}`);
      setStep('upload');
    }
  };

  // =========================================================================
  // Import (Step 2)
  // =========================================================================
  const handleImport = async () => {
    const selected = candidates.filter((c) => selectedCandidates.has(c.tempId));
    if (!selected.length) {
      toast.error('בחר לפחות מועמד אחד');
      return;
    }

    setStep('importing');
    setProgress(0);

    try {
      // Build image data map
      const imageDataMap: Record<string, string> = {};
      const sourceFiles = flow === 'images' ? imageFiles : chatMediaFiles;

      for (const candidate of selected) {
        // Try by index first (Flow A)
        if (candidate.photoImageIndices?.length > 0) {
          const idx = candidate.photoImageIndices[0];
          if (sourceFiles[idx]) {
            const buf = await sourceFiles[idx].arrayBuffer();
            imageDataMap[candidate.tempId] =
              Buffer.from(buf).toString('base64');
            continue;
          }
        }
        // Try by filename (Flow B)
        if (candidate.photoFileNames?.length > 0) {
          const targetName = candidate.photoFileNames[0];
          const matchFile = sourceFiles.find((f) => f.name === targetName);
          if (matchFile) {
            const buf = await matchFile.arrayBuffer();
            imageDataMap[candidate.tempId] =
              Buffer.from(buf).toString('base64');
          }
        }
      }

      setProgress(30);

      const res = await fetch('/api/matchmaker/candidates/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: selected, imageDataMap }),
      });

      setProgress(90);
      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(result.error || 'Import failed');

      setImportResults(result.summary);
      setProgress(100);
      setStep('done');
      toast.success(`נוצרו ${result.summary.created} מועמדים!`);
    } catch (err) {
      console.error('Import error:', err);
      toast.error(`שגיאה: ${(err as Error).message}`);
      setStep('review');
    }
  };

  // =========================================================================
  // Candidate editing helpers
  // =========================================================================
  const updateCandidate = (tempId: string, field: string, value: any) => {
    setCandidates((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, [field]: value } : c))
    );
  };

  const toggleCandidate = (tempId: string) => {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) next.delete(tempId);
      else next.add(tempId);
      return next;
    });
  };

  const removeCandidate = (tempId: string) => {
    setCandidates((prev) => prev.filter((c) => c.tempId !== tempId));
    setSelectedCandidates((prev) => {
      const n = new Set(prev);
      n.delete(tempId);
      return n;
    });
  };

  // =========================================================================
  // Sub-components
  // =========================================================================
  const ConfidenceBadge = ({ level }: { level: string }) => {
    const cfg: Record<string, { label: string; cls: string }> = {
      high: {
        label: 'ביטחון גבוה',
        cls: 'bg-green-100 text-green-700 border-green-200',
      },
      medium: {
        label: 'ביטחון בינוני',
        cls: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      low: {
        label: 'ביטחון נמוך',
        cls: 'bg-red-100 text-red-700 border-red-200',
      },
    };
    const c = cfg[level] || { label: level, cls: 'bg-gray-100 text-gray-700' };
    return (
      <Badge variant="outline" className={c.cls}>
        {c.label}
      </Badge>
    );
  };

  const ImageGrid = ({
    previews,
    onRemove,
  }: {
    previews: string[];
    onRemove: (i: number) => void;
  }) => (
    <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
      {previews.map((src, i) => (
        <div key={i} className="relative group aspect-square">
          <img
            src={src}
            className="rounded-md object-cover w-full h-full border border-gray-200"
            alt=""
          />
          <button
            onClick={() => onRemove(i)}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
          <span className="absolute bottom-0 left-0 bg-black/60 text-white text-[9px] px-0.5 rounded-tr">
            {i}
          </span>
        </div>
      ))}
    </div>
  );

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-5 h-5 text-purple-600" />
            ייבוא מועמדים מקבוצת וואטסאפ
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'בחר שיטת ייבוא — העלאת תמונות או ייצוא צ׳אט'}
            {step === 'analyzing' && 'AI מנתח את הנתונים... אנא המתן'}
            {step === 'review' &&
              `זוהו ${candidates.length} מועמדים${testMode ? ` (מצב בדיקה — מוגבל ל-${testLimit})` : ''} — בדוק ותקן לפני ייבוא`}
            {step === 'importing' && 'מייבא מועמדים למערכת...'}
            {step === 'done' && 'הייבוא הושלם!'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        {(step === 'analyzing' || step === 'importing') && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0 mt-3">
          {/* ============================================================ */}
          {/* UPLOAD STEP */}
          {/* ============================================================ */}
          {step === 'upload' && (
            <Tabs
              value={flow}
              onValueChange={(v) => setFlow(v as FlowType)}
              className="px-1"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger
                  value="images"
                  className="flex items-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" />
                  העלאת תמונות
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  ייצוא צ׳אט
                </TabsTrigger>
              </TabsList>

              {/* ---- FLOW A: Images ---- */}
              <TabsContent value="images" className="space-y-4">
                <label
                  htmlFor="bulk-images"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer bg-purple-50/50 hover:bg-purple-100/50 transition-colors"
                >
                  <Upload className="w-8 h-8 mb-2 text-purple-400" />
                  <p className="text-sm text-purple-600 font-medium">
                    לחץ כאן או גרור תמונות
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    טפסים + תמונות אישיות · עד 30 תמונות · 10MB לתמונה
                  </p>
                  <input
                    id="bulk-images"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFilesChange}
                  />
                </label>

                {imagePreviews.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {imageFiles.length} תמונות
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setImageFiles([]);
                          setImagePreviews([]);
                        }}
                        className="text-red-500 text-xs"
                      >
                        <Trash2 className="w-3 h-3 ml-1" /> נקה
                      </Button>
                    </div>
                    <ImageGrid
                      previews={imagePreviews}
                      onRemove={removeImageFile}
                    />
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  <p className="font-medium mb-1">💡 פלו A — העלאת תמונות</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>העלה תמונות של טפסי שידוכים (כתב יד / מודפס)</li>
                    <li>העלה גם תמונות אישיות של המועמדים</li>
                    <li>ה-AI יזהה מה טופס ומה תמונה וישייך אוטומטית</li>
                    <li>מתאים כשמעתיקים תמונות ידנית מהקבוצה</li>
                  </ul>
                </div>
              </TabsContent>

              {/* ---- FLOW B: Chat Export ---- */}
              <TabsContent value="chat" className="space-y-4">
                {/* Chat file */}
                <div>
                  <Label className="text-sm font-medium mb-1 block">
                    <FileText className="w-4 h-4 inline ml-1" />
                    קובץ ייצוא צ׳אט (.txt)
                  </Label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1">
                      <div
                        className={`flex items-center justify-center h-16 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${chatFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50/30'}`}
                      >
                        {chatFile ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {chatFile.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(chatFile.size / 1024).toFixed(0)}KB)
                            </span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm text-gray-500">
                              לחץ לבחור קובץ _chat.txt
                            </p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept=".txt,.zip"
                        className="hidden"
                        onChange={handleChatFileChange}
                      />
                    </label>
                    {chatFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChatFile(null)}
                        className="text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Media files */}
                <div>
                  <Label className="text-sm font-medium mb-1 block">
                    <ImageIcon className="w-4 h-4 inline ml-1" />
                    תמונות מדיה מהצ׳אט (אופציונלי)
                  </Label>
                  <label
                    htmlFor="chat-media"
                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
                  >
                    <Upload className="w-6 h-6 mb-1 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      העלה את תיקיית התמונות מהייצוא · עד 100 קבצים
                    </p>
                    <input
                      id="chat-media"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleChatMediaChange}
                    />
                  </label>
                  {chatMediaPreviews.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">
                          {chatMediaFiles.length} קבצים
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setChatMediaFiles([]);
                            setChatMediaPreviews([]);
                          }}
                          className="text-red-400 text-xs"
                        >
                          נקה
                        </Button>
                      </div>
                      <ImageGrid
                        previews={chatMediaPreviews}
                        onRemove={(i) => {
                          setChatMediaFiles((p) => p.filter((_, j) => j !== i));
                          setChatMediaPreviews((p) =>
                            p.filter((_, j) => j !== i)
                          );
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  <p className="font-medium mb-1">
                    💡 פלו B — ייצוא צ׳אט (מומלץ!)
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>
                      בוואטסאפ: פתח קבוצה → ⋮ → עוד → ייצוא צ׳אט → עם מדיה
                    </li>
                    <li>תקבל קובץ ZIP שמכיל _chat.txt + תמונות</li>
                    <li>העלה את ה-txt + את התמונות</li>
                    <li>
                      <strong>יתרון:</strong> שיוך אוטומטי לפי timestamps — הרבה
                      יותר מדויק!
                    </li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* ============================================================ */}
          {/* ANALYZING STEP */}
          {/* ============================================================ */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Sparkles className="w-14 h-14 text-purple-500 animate-pulse mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {flow === 'images'
                  ? `מנתח ${imageFiles.length} תמונות...`
                  : `מנתח צ׳אט${chatMediaFiles.length > 0 ? ` + ${chatMediaFiles.length} תמונות` : ''}...`}
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-md">
                {flow === 'images'
                  ? 'מזהה טפסים, קורא כתב יד עברי, מחלץ נתונים ומשייך תמונות למועמדים.'
                  : 'מפרסר הודעות, מזהה פרופילים, מחלץ נתונים ומשייך תמונות.'}
                <br />
                תהליך זה יכול לקחת עד 2 דקות.
              </p>
            </div>
          )}

          {/* ============================================================ */}
          {/* REVIEW STEP */}
          {/* ============================================================ */}
          {step === 'review' && (
            <div className="space-y-3 px-1">
              {/* Test mode banner */}
              {testMode && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-lg">🧪</span>
                  <span className="text-sm text-amber-800 font-medium">
                    מצב בדיקה — מציג רק {testLimit} מועמדים. לאחר שתוודא שהכל
                    עובד, כבה את מצב הבדיקה וייבא הכל.
                  </span>
                </div>
              )}

              {/* Stats bar */}
              {stats && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {stats.chatBlocks > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700"
                    >
                      {stats.chatBlocks} בלוקים מהצ׳אט
                    </Badge>
                  )}
                  {stats.imagesProcessed > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700"
                    >
                      {stats.imagesProcessed} תמונות נותחו
                    </Badge>
                  )}
                  {stats.afterDedup !== undefined &&
                    stats.afterDedup <
                      (stats.candidatesFromChat || 0) +
                        (stats.candidatesFromImages || 0) && (
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700"
                      >
                        {(stats.candidatesFromChat || 0) +
                          (stats.candidatesFromImages || 0) -
                          stats.afterDedup}{' '}
                        כפילויות מוזגו
                      </Badge>
                    )}
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs">
                  <div className="flex items-center gap-1 text-amber-700 font-medium mb-0.5">
                    <AlertCircle className="w-3 h-3" /> אזהרות
                  </div>
                  {warnings.slice(0, 5).map((w, i) => (
                    <p key={i} className="text-amber-600">
                      • {w}
                    </p>
                  ))}
                  {warnings.length > 5 && (
                    <p className="text-amber-500">
                      ...ועוד {warnings.length - 5}
                    </p>
                  )}
                </div>
              )}

              {/* Selection controls */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedCandidates.size} / {candidates.length} נבחרו
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedCandidates(
                        new Set(candidates.map((c) => c.tempId))
                      )
                    }
                  >
                    בחר הכל
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCandidates(new Set())}
                  >
                    נקה
                  </Button>
                </div>
              </div>

              {/* Candidate cards */}
              {candidates.map((candidate) => {
                const isSelected = selectedCandidates.has(candidate.tempId);
                const isExpanded = expandedCard === candidate.tempId;
                const photoIdx = candidate.photoImageIndices?.[0];
                const previews =
                  flow === 'images' ? imagePreviews : chatMediaPreviews;
                const hasPreview = photoIdx !== undefined && previews[photoIdx];

                return (
                  <div
                    key={candidate.tempId}
                    className={`border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200 bg-white opacity-50'}`}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCandidate(candidate.tempId)}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0"
                      />
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {hasPreview ? (
                          <img
                            src={previews[photoIdx]}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-800 truncate">
                            {candidate.firstName} {candidate.lastName}
                          </h4>
                          <ConfidenceBadge level={candidate.confidence} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                          {candidate.age && <span>גיל {candidate.age}</span>}
                          {candidate.city && <span>📍 {candidate.city}</span>}
                          {candidate.maritalStatus && (
                            <span>{candidate.maritalStatus}</span>
                          )}
                          {candidate.religiousLevel && (
                            <span>🕎 {candidate.religiousLevel}</span>
                          )}
                          <span
                            className={
                              candidate.gender === 'MALE'
                                ? 'text-blue-500'
                                : 'text-pink-500'
                            }
                          >
                            {candidate.gender === 'MALE' ? '♂' : '♀'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedCard(
                              isExpanded ? null : candidate.tempId
                            )
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCandidate(candidate.tempId)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded edit form */}
                    {isExpanded && (
                      <div className="border-t p-4 bg-white space-y-3">
                        {candidate.notes && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
                            <AlertCircle className="w-3 h-3 inline ml-1" />
                            {candidate.notes}
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { key: 'firstName', label: 'שם פרטי' },
                            { key: 'lastName', label: 'שם משפחה' },
                            { key: 'age', label: 'גיל', type: 'number' },
                            {
                              key: 'height',
                              label: 'גובה (ס״מ)',
                              type: 'number',
                            },
                            { key: 'maritalStatus', label: 'מצב משפחתי' },
                            { key: 'religiousLevel', label: 'רמה דתית' },
                            { key: 'origin', label: 'מוצא' },
                            { key: 'city', label: 'עיר' },
                            { key: 'occupation', label: 'עיסוק' },
                            { key: 'education', label: 'השכלה' },
                            { key: 'contactPhone', label: 'טלפון', dir: 'ltr' },
                            { key: 'referredBy', label: 'הופנה ע״י' },
                          ].map(({ key, label, type, dir }) => (
                            <div key={key}>
                              <Label className="text-xs text-gray-500">
                                {label}
                              </Label>
                              {key === 'gender' ? (
                                <Select
                                  value={candidate.gender}
                                  onValueChange={(v) =>
                                    updateCandidate(
                                      candidate.tempId,
                                      'gender',
                                      v
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className="h-8 text-sm"
                                    dir="rtl"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MALE">זכר</SelectItem>
                                    <SelectItem value="FEMALE">נקבה</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={(candidate as any)[key] || ''}
                                  onChange={(e) =>
                                    updateCandidate(
                                      candidate.tempId,
                                      key,
                                      type === 'number'
                                        ? parseInt(e.target.value) || null
                                        : e.target.value
                                    )
                                  }
                                  dir={dir || 'rtl'}
                                  type={type || 'text'}
                                  className="h-8 text-sm"
                                />
                              )}
                            </div>
                          ))}

                          {/* Gender select */}
                          <div>
                            <Label className="text-xs text-gray-500">
                              מגדר
                            </Label>
                            <Select
                              value={candidate.gender}
                              onValueChange={(v) =>
                                updateCandidate(candidate.tempId, 'gender', v)
                              }
                            >
                              <SelectTrigger className="h-8 text-sm" dir="rtl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MALE">זכר</SelectItem>
                                <SelectItem value="FEMALE">נקבה</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-500">אופי</Label>
                          <Textarea
                            value={candidate.personality || ''}
                            onChange={(e) =>
                              updateCandidate(
                                candidate.tempId,
                                'personality',
                                e.target.value
                              )
                            }
                            dir="rtl"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            מחפש/ת
                          </Label>
                          <Textarea
                            value={candidate.lookingFor || ''}
                            onChange={(e) =>
                              updateCandidate(
                                candidate.tempId,
                                'lookingFor',
                                e.target.value
                              )
                            }
                            dir="rtl"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            טקסט מקורי
                          </Label>
                          <Textarea
                            value={candidate.rawFormText}
                            onChange={(e) =>
                              updateCandidate(
                                candidate.tempId,
                                'rawFormText',
                                e.target.value
                              )
                            }
                            dir="rtl"
                            rows={3}
                            className="text-sm text-gray-500 bg-gray-50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {candidates.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>לא זוהו מועמדים. נסה להעלות קבצים אחרים.</p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* IMPORTING STEP */}
          {/* ============================================================ */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-gray-800">
                מייבא {selectedCandidates.size} מועמדים...
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                יוצר פרופילים, מעלה תמונות, ומפעיל ניתוח AI
              </p>
            </div>
          )}

          {/* ============================================================ */}
          {/* DONE STEP */}
          {/* ============================================================ */}
          {step === 'done' && importResults && (
            <div className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                הייבוא הושלם!
              </h3>
              <div className="flex gap-8 mt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {importResults.created}
                  </p>
                  <p className="text-sm text-gray-500">נוצרו בהצלחה</p>
                </div>
                {importResults.failed > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-500">
                      {importResults.failed}
                    </p>
                    <p className="text-sm text-gray-500">נכשלו</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* ============================================================ */}
        {/* FOOTER */}
        {/* ============================================================ */}
        <DialogFooter className="pt-3 border-t">
          {step === 'upload' && (
            <div className="w-full space-y-3">
              {/* Test mode toggle */}
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="test-mode"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="test-mode"
                    className="text-sm text-amber-800 cursor-pointer"
                  >
                    🧪 מצב בדיקה
                  </label>
                </div>
                {testMode && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-amber-700">הגבל ל-</span>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={testLimit}
                      onChange={(e) =>
                        setTestLimit(parseInt(e.target.value) || 2)
                      }
                      className="w-14 h-7 text-sm text-center"
                    />
                    <span className="text-xs text-amber-700">מועמדים</span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-row-reverse gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={
                    flow === 'images'
                      ? imageFiles.length === 0
                      : !chatFile && chatMediaFiles.length === 0
                  }
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  {testMode && '🧪 '}
                  {flow === 'images'
                    ? `נתח ${imageFiles.length} תמונות`
                    : `נתח צ׳אט${chatMediaFiles.length > 0 ? ` + ${chatMediaFiles.length} תמונות` : ''}`}
                  {testMode && ` (רק ${testLimit})`}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  ביטול
                </Button>
              </div>
            </div>
          )}
          {step === 'review' && (
            <>
              <Button
                onClick={handleImport}
                disabled={selectedCandidates.size === 0}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
              >
                <Send className="w-4 h-4 ml-2" />
                ייבא {selectedCandidates.size} מועמדים
              </Button>
              <Button variant="outline" onClick={() => setStep('upload')}>
                חזור
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button
              onClick={() => {
                onImportComplete();
                handleClose();
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
            >
              סגור ורענן
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
