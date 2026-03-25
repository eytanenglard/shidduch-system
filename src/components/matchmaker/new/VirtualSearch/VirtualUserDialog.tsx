// ===========================================
// קובץ חדש: src/components/matchmaker/new/VirtualSearch/VirtualUserDialog.tsx
// ===========================================

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, User, Heart, Edit3, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface GeneratedVirtualProfile {
  inferredAge: number;
  inferredCity: string | null;
  inferredOccupation: string | null;
  inferredMaritalStatus: string | null;
  inferredEducation: string | null;
  personalitySummary: string;
  lookingForSummary: string;
  preferredAgeMin: number;
  preferredAgeMax: number;
  preferredReligiousLevels: string[];
  preferredLocations: string[];
  keyTraits: string[];
  idealPartnerTraits: string[];
  dealBreakers: string[];
  displaySummary: string;
}

interface VirtualProfile {
  id: string;
  name: string | null;
  gender: 'MALE' | 'FEMALE';
  religiousLevel: string;
  generatedProfile: GeneratedVirtualProfile;
  editedSummary?: string | null;
  wasEdited?: boolean;
  createdAt: string;
}

interface VirtualUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreated: (profile: VirtualProfile) => void;
  locale: string;
}

// רמות דתיות (אותו מיפוי כמו במערכת)
const RELIGIOUS_LEVELS = [
  { value: 'charedi_modern', label: 'חרדי מודרני' },
  { value: 'dati_leumi_torani', label: 'דתי לאומי תורני' },
  { value: 'dati_leumi_standard', label: 'דתי לאומי' },
  { value: 'dati_leumi_liberal', label: 'דתי לאומי ליברלי' },
  { value: 'masorti_strong', label: 'מסורתי חזק' },
  { value: 'masorti_light', label: 'מסורתי לייט' },
  { value: 'secular_traditional_connection', label: 'חילוני עם חיבור למסורת' },
  { value: 'secular', label: 'חילוני' },
];

// ============================================================================
// COMPONENT
// ============================================================================

const VirtualUserDialog: React.FC<VirtualUserDialogProps> = ({
  isOpen,
  onClose,
  onProfileCreated,
  locale,
}) => {
  // State - שלב 1: קלט
  const [sourceText, setSourceText] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [religiousLevel, setReligiousLevel] = useState('');
  const [name, setName] = useState('');

  // State - שלב 2: סיכום
  const [generatedProfile, setGeneratedProfile] = useState<GeneratedVirtualProfile | null>(null);
  const [editedSummary, setEditedSummary] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);

  // State - כללי
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Reset on close
  const handleClose = () => {
    setStep(1);
    setSourceText('');
    setGender('');
    setReligiousLevel('');
    setName('');
    setGeneratedProfile(null);
    setEditedSummary('');
    setIsEditingMode(false);
    setProfileId(null);
    onClose();
  };

  // שלב 1: יצירת פרופיל
  const handleCreateProfile = async () => {
    if (!sourceText.trim() || sourceText.trim().length < 20) {
      toast.error('יש להזין תיאור של לפחות 20 תווים');
      return;
    }
    if (!gender) {
      toast.error('יש לבחור מגדר');
      return;
    }
    if (!religiousLevel) {
      toast.error('יש לבחור רמה דתית');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/virtual-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: sourceText.trim(),
          gender,
          religiousLevel,
          name: name.trim() || null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create profile');
      }

      setProfileId(data.virtualProfile.id);
      setGeneratedProfile(data.virtualProfile.generatedProfile);
      setEditedSummary(data.virtualProfile.generatedProfile.displaySummary);
      setStep(2);

      toast.success('הפרופיל נוצר בהצלחה!');

    } catch (error) {
      toast.error('שגיאה ביצירת הפרופיל. נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  // שלב 2: אישור והפעלת חיפוש
  const handleConfirmAndSearch = async () => {
    if (!profileId || !generatedProfile) return;

    setIsLoading(true);

    try {
      // אם הסיכום עודכן, נשמור אותו
      if (editedSummary !== generatedProfile.displaySummary) {
        await fetch('/api/ai/virtual-profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: profileId,
            editedSummary: editedSummary.trim(),
          }),
        });
      }

      // מעביר את הפרופיל לקומפוננטה האב
      onProfileCreated({
        id: profileId,
        name: name.trim() || null,
        gender: gender as 'MALE' | 'FEMALE',
        religiousLevel,
        generatedProfile,
        editedSummary: editedSummary !== generatedProfile.displaySummary ? editedSummary : null,
        wasEdited: editedSummary !== generatedProfile.displaySummary,
        createdAt: new Date().toISOString(),
      });

      handleClose();

    } catch (error) {
      toast.error('שגיאה בשמירת הפרופיל');
    } finally {
      setIsLoading(false);
    }
  };

  // חזרה לשלב 1
  const handleBackToEdit = () => {
    setStep(1);
    setGeneratedProfile(null);
    setEditedSummary('');
    setIsEditingMode(false);
  };

  const isRtl = locale === 'he';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {step === 1 ? 'יצירת מועמד וירטואלי' : 'אישור וחיפוש'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'תאר/י את המועמד ומה הוא/היא מחפש/ת, והמערכת תיצור פרופיל לחיפוש התאמות'
              : 'בדוק/י את הסיכום שנוצר, ערוך/י במידת הצורך, ואשר/י להתחלת החיפוש'
            }
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ========== STEP 1: INPUT ========== */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 mt-4"
            >
              {/* Text Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <User className="w-4 h-4 text-blue-500" />
                  תאר/י את המועמד ומה הוא/היא מחפש/ת
                </Label>
                <Textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder={`לדוגמה:
בחור בן 28, תוכניתן בהייטק, גר בתל אביב.
שקט, רציני, מאוד אחראי. אוהב טיולים בטבע וקריאה.
מחפש בחורה אינטליגנטית, רגישה, עם חום.
עדיפות לביתית, לא אוהב רועשות מדי...`}
                  className="min-h-[180px] resize-none"
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
                <p className="text-xs text-gray-500">
                  {sourceText.length} תווים (מינימום 20)
                </p>
              </div>

              {/* Gender & Religious Level */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">מגדר המועמד</Label>
                  <Select value={gender} onValueChange={(v) => setGender(v as 'MALE' | 'FEMALE')}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר מגדר" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">👨 גבר</SelectItem>
                      <SelectItem value="FEMALE">👩 אישה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">רמה דתית</Label>
                  <Select value={religiousLevel} onValueChange={setReligiousLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר רמה דתית" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELIGIOUS_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Optional Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">שם לזיהוי (אופציונלי)</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="לדוגמה: דני - בחור שקט מת״א"
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleCreateProfile}
                disabled={isLoading || !sourceText.trim() || sourceText.length < 20 || !gender || !religiousLevel}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    יוצר פרופיל...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 ml-2" />
                    צור פרופיל והמשך
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* ========== STEP 2: REVIEW & CONFIRM ========== */}
          {step === 2 && generatedProfile && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 mt-4"
            >
              {/* Profile Summary Card */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    סיכום הפרופיל
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingMode(!isEditingMode)}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    {isEditingMode ? (
                      <>
                        <Check className="w-4 h-4 ml-1" />
                        סיום עריכה
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 ml-1" />
                        ערוך סיכום
                      </>
                    )}
                  </Button>
                </div>

                {/* Editable Summary */}
                {isEditingMode ? (
                  <Textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className="min-h-[150px] bg-white"
                    dir={isRtl ? 'rtl' : 'ltr'}
                  />
                ) : (
                  <div className="bg-white rounded-lg p-4 text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {editedSummary || generatedProfile.displaySummary}
                  </div>
                )}

                {/* Inferred Details */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/60 rounded-lg p-3">
                    <span className="text-gray-500">גיל משוער:</span>
                    <span className="font-medium mr-2">{generatedProfile.inferredAge}</span>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <span className="text-gray-500">מגדר:</span>
                    <span className="font-medium mr-2">{gender === 'MALE' ? 'גבר' : 'אישה'}</span>
                  </div>
                  {generatedProfile.inferredCity && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="text-gray-500">עיר:</span>
                      <span className="font-medium mr-2">{generatedProfile.inferredCity}</span>
                    </div>
                  )}
                  {generatedProfile.inferredOccupation && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="text-gray-500">מקצוע:</span>
                      <span className="font-medium mr-2">{generatedProfile.inferredOccupation}</span>
                    </div>
                  )}
                </div>

                {/* Key Traits */}
                {generatedProfile.keyTraits && generatedProfile.keyTraits.length > 0 && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-500">תכונות מרכזיות:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {generatedProfile.keyTraits.map((trait, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Looking For */}
                {generatedProfile.idealPartnerTraits && generatedProfile.idealPartnerTraits.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-500">מחפש בבן/בת זוג:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {generatedProfile.idealPartnerTraits.map((trait, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBackToEdit}
                  className="flex-1"
                >
                  <X className="w-4 h-4 ml-2" />
                  חזור לעריכה
                </Button>
                <Button
                  onClick={handleConfirmAndSearch}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      שומר...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 ml-2" />
                      אשר והמשך לחיפוש
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualUserDialog;