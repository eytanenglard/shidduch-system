// src/app/components/matchmaker/suggestions/NewSuggestionForm/SuggestionDetails.tsx

'use client';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Priority } from '@prisma/client';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Loader2,
  Sparkles,
  AlertTriangle,
  Star,
  Flame,
  Target,
  Shield,
  Heart,
  MessageCircle,
  User,
  Calendar,
  Zap,
  Crown,
  Award,
  Gift,
  Clock,
  Wand2,
  Brain,
  Eye,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { NewSuggestionFormData } from './schema';
import type { Candidate } from '../../new/types/candidates';
import { cn } from '@/lib/utils';

interface SuggestionDetailsProps {
  firstParty: Candidate;
  secondParty: Candidate;
}

const EnhancedSection: React.FC<{
  icon: React.ElementType;
  title: string;
  description?: string;
  gradient: string;
  children: React.ReactNode;
  className?: string;
}> = ({ icon: Icon, title, description, gradient, children, className }) => (
  <Card
    className={cn(
      'border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group overflow-hidden rounded-3xl',
      'bg-gradient-to-br from-white via-gray-50/30 to-white',
      className
    )}
  >
    {/* Background decoration */}
    <div className="absolute inset-0">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-900"></div>
    </div>

    <CardContent className="relative z-10 p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className={cn(
            'p-4 rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300 bg-gradient-to-r text-white',
            gradient
          )}
        >
          <Icon className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h3
            className="text-2xl font-bold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-300"
            style={{
              backgroundImage: `linear-gradient(to right, ${gradient.replace('from-', '').replace('to-', ', ')})`,
            }}
          >
            {title}
          </h3>
          {description && (
            <p className="text-gray-600 mt-1 leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      {children}
    </CardContent>
  </Card>
);

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const getPriorityInfo = (p: Priority) => {
    switch (p) {
      case Priority.URGENT:
        return {
          label: 'דחוף',
          icon: Flame,
          className:
            'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse shadow-xl',
          description: 'דורש טיפול מיידי!',
        };
      case Priority.HIGH:
        return {
          label: 'גבוהה',
          icon: Star,
          className:
            'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl',
          description: 'עדיפות גבוהה',
        };
      case Priority.MEDIUM:
        return {
          label: 'רגילה',
          icon: Target,
          className:
            'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl',
          description: 'עדיפות רגילה',
        };
      case Priority.LOW:
        return {
          label: 'נמוכה',
          icon: Shield,
          className:
            'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-xl',
          description: 'עדיפות נמוכה',
        };
      default:
        return {
          label: 'רגילה',
          icon: Target,
          className:
            'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl',
          description: 'עדיפות רגילה',
        };
    }
  };

  const info = getPriorityInfo(priority);
  const IconComponent = info.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl font-bold',
        info.className
      )}
    >
      <IconComponent className="w-4 h-4" />
      <span>{info.label}</span>
    </div>
  );
};

const SuggestionDetails: React.FC<SuggestionDetailsProps> = ({
  firstParty,
  secondParty,
}) => {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<NewSuggestionFormData>();
  const [isGeneratingRationale, setIsGeneratingRationale] = useState(false);

  const priority = watch('priority', Priority.MEDIUM);

  const handleGenerateRationale = async () => {
    setIsGeneratingRationale(true);
    toast.info('ה-AI מנסח את חבילת הנימוקים...', {
      description: 'זה יכול לקחת כמה שניות',
      duration: 3000,
    });

    try {
      const response = await fetch('/api/ai/generate-suggestion-rationale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId1: firstParty.id,
          userId2: secondParty.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.rationales) {
        throw new Error(data.error || 'שגיאה ביצור הנימוקים');
      }

      const { generalRationale, rationaleForParty1, rationaleForParty2 } =
        data.rationales;

      setValue('matchingReason', generalRationale, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('firstPartyNotes', rationaleForParty1, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('secondPartyNotes', rationaleForParty2, {
        shouldValidate: true,
        shouldDirty: true,
      });

      toast.success('הנימוקים נוצרו בהצלחה!', {
        description: 'כל השדות מולאו באופן אוטומטי עם תוכן מותאם אישית',
        duration: 5000,
      });
    } catch (error) {
      console.error('Failed to generate rationales:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה לא צפויה', {
        description: 'נסה שוב או מלא את השדות ידנית',
      });
    } finally {
      setIsGeneratingRationale(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Priority Section */}
      <EnhancedSection
        icon={Crown}
        title="עדיפות ההצעה"
        description="קבע את רמת החשיבות והדחיפות של ההצעה"
        gradient="from-purple-500 to-pink-500"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-gray-700">
              בחר רמת עדיפות
            </Label>
            <PriorityBadge priority={priority} />
          </div>

          <Select
            onValueChange={(value: Priority) =>
              setValue('priority', value, { shouldValidate: true })
            }
            defaultValue={priority}
            name="priority"
          >
            <SelectTrigger className="h-14 border-2 border-purple-200 hover:border-purple-300 focus:border-purple-500 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg transition-all text-lg">
              <SelectValue placeholder="בחר/י עדיפות" />
            </SelectTrigger>
            <SelectContent className="border-0 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm">
              <SelectItem value={Priority.URGENT}>
                <div className="flex items-center gap-3 py-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="font-bold text-red-600">דחופה</div>
                    <div className="text-xs text-red-500">דורש טיפול מיידי</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value={Priority.HIGH}>
                <div className="flex items-center gap-3 py-2">
                  <Star className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="font-bold text-orange-600">גבוהה</div>
                    <div className="text-xs text-orange-500">עדיפות מוגברת</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value={Priority.MEDIUM}>
                <div className="flex items-center gap-3 py-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-bold text-blue-600">רגילה</div>
                    <div className="text-xs text-blue-500">עדיפות סטנדרטית</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value={Priority.LOW}>
                <div className="flex items-center gap-3 py-2">
                  <Shield className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-bold text-gray-600">נמוכה</div>
                    <div className="text-xs text-gray-500">ללא דחיפות</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {errors.priority && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600 font-medium">
                {errors.priority.message}
              </p>
            </div>
          )}
        </div>
      </EnhancedSection>

      {/* AI-Generated Matching Reason */}
      <EnhancedSection
        icon={Brain}
        title="סיבת ההתאמה הכללית"
        description="נימוק מפורט המסביר מדוע יש התאמה בין הצדדים"
        gradient="from-emerald-500 to-green-500"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-gray-700">
              תוכן יוצג לצדדים
            </Label>
            <Button
              type="button"
              onClick={handleGenerateRationale}
              disabled={isGeneratingRationale}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl px-6 py-3 font-bold"
            >
              {isGeneratingRationale ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  <span>מנסח...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 ml-2 text-yellow-300" />
                  <span>צור נימוקים (AI)</span>
                </>
              )}
            </Button>
          </div>

          <Textarea
            id="matchingReason"
            {...register('matchingReason')}
            placeholder="נימוק כללי המסביר מדוע יש התאמה בין הצדדים..."
            className="min-h-[140px] border-2 border-emerald-200 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg transition-all text-lg resize-none"
          />

          {errors.matchingReason && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600 font-medium">
                {errors.matchingReason.message}
              </p>
            </div>
          )}

          <Alert className="border-0 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg rounded-2xl">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <AlertDescription className="text-blue-800 font-medium leading-relaxed">
              💡 <strong>טיפ חכם:</strong> לחיצה על כפתור ה-AI תמלא אוטומטית את
              שדה זה וגם את שדות ההערות האישיות לכל צד עם תוכן מותאם ומקצועי.
            </AlertDescription>
          </Alert>
        </div>
      </EnhancedSection>

      {/* Personal Notes for Each Party */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* First Party Notes */}
        <EnhancedSection
          icon={User}
          title={`הערות אישיות ל${firstParty.firstName}`}
          description="טקסט אישי המדגיש את היתרונות של הצד השני עבורו"
          gradient="from-blue-500 to-cyan-500"
          className="lg:col-span-1"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">
                {firstParty.firstName[0]}
              </div>
              <div>
                <div className="font-bold text-blue-800">
                  {firstParty.firstName} {firstParty.lastName}
                </div>
                <div className="text-sm text-blue-600">צד א&apos; בהצעה</div>
              </div>
            </div>

            <Textarea
              id="firstPartyNotes"
              {...register('firstPartyNotes')}
              placeholder={`טקסט אישי המדגיש את היתרונות של ${secondParty.firstName} עבור ${firstParty.firstName}...`}
              className="min-h-[160px] border-2 border-blue-200 hover:border-blue-300 focus:border-blue-500 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg transition-all text-lg resize-none"
            />

            {errors.firstPartyNotes && (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600 font-medium">
                  {errors.firstPartyNotes.message}
                </p>
              </div>
            )}
          </div>
        </EnhancedSection>

        {/* Second Party Notes */}
        <EnhancedSection
          icon={User}
          title={`הערות אישיות ל${secondParty.firstName}`}
          description="טקסט אישי המדגיש את היתרונות של הצד השני עבורה"
          gradient="from-purple-500 to-pink-500"
          className="lg:col-span-1"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                {secondParty.firstName[0]}
              </div>
              <div>
                <div className="font-bold text-purple-800">
                  {secondParty.firstName} {secondParty.lastName}
                </div>
                <div className="text-sm text-purple-600">צד ב&apos; בהצעה</div>
              </div>
            </div>

            <Textarea
              id="secondPartyNotes"
              {...register('secondPartyNotes')}
              placeholder={`טקסט אישי המדגיש את היתרונות של ${firstParty.firstName} עבור ${secondParty.firstName}...`}
              className="min-h-[160px] border-2 border-purple-200 hover:border-purple-300 focus:border-purple-500 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg transition-all text-lg resize-none"
            />

            {errors.secondPartyNotes && (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600 font-medium">
                  {errors.secondPartyNotes.message}
                </p>
              </div>
            )}
          </div>
        </EnhancedSection>
      </div>

      {/* Internal Notes */}
      <EnhancedSection
        icon={MessageCircle}
        title="הערות פנימיות"
        description="הערות והנחיות לשימוש צוות השדכנים בלבד"
        gradient="from-amber-500 to-orange-500"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
            <div className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-amber-800">מידע סודי</div>
              <div className="text-sm text-amber-600">
                נראה רק לצוות השדכנים
              </div>
            </div>
          </div>

          <Textarea
            id="internalNotes"
            {...register('internalNotes')}
            placeholder="הערות והנחיות לשימוש פנימי בלבד..."
            className="min-h-[120px] border-2 border-amber-200 hover:border-amber-300 focus:border-amber-500 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg transition-all text-lg resize-none"
          />

          {errors.internalNotes && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600 font-medium">
                {errors.internalNotes.message}
              </p>
            </div>
          )}
        </div>
      </EnhancedSection>

      {/* Decision Deadline */}
      <EnhancedSection
        icon={Clock}
        title="תאריך יעד להחלטה"
        description="קבע את המועד האחרון למתן תגובה מהצדדים"
        gradient="from-indigo-500 to-purple-500"
      >
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-gray-700">
            בחר תקופת זמן למענה
          </Label>

          <Select
            onValueChange={(value) => {
              const days = parseInt(value, 10);
              const deadline = new Date();
              deadline.setDate(deadline.getDate() + days);
              setValue('decisionDeadline', deadline, { shouldValidate: true });
            }}
            defaultValue="14"
          >
            <SelectTrigger className="h-14 border-2 border-indigo-200 hover:border-indigo-300 focus:border-indigo-500 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg transition-all text-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-0 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm">
              <SelectItem value="3">
                <div className="flex items-center gap-3 py-2">
                  <Zap className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="font-bold text-red-600">3 ימים</div>
                    <div className="text-xs text-red-500">מהיר וזריז</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="7">
                <div className="flex items-center gap-3 py-2">
                  <Award className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="font-bold text-orange-600">7 ימים</div>
                    <div className="text-xs text-orange-500">תקופה קצרה</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="14">
                <div className="flex items-center gap-3 py-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-bold text-blue-600">14 ימים</div>
                    <div className="text-xs text-blue-500">
                      תקופה סטנדרטית (מומלץ)
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="30">
                <div className="flex items-center gap-3 py-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-bold text-green-600">30 ימים</div>
                    <div className="text-xs text-green-500">תקופה מורחבת</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {errors.decisionDeadline && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600 font-medium">
                {errors.decisionDeadline.message}
              </p>
            </div>
          )}

          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-indigo-500 mt-1" />
              <div>
                <div className="font-bold text-indigo-800 mb-1">מידע חשוב</div>
                <p className="text-sm text-indigo-700 leading-relaxed">
                  לאחר תקופת הזמן שנבחרה, אם לא התקבלה תגובה מאחד הצדדים, ההצעה
                  תועבר אוטומטית לסטטוס &quot;פג תוקף&quot;.
                </p>
              </div>
            </div>
          </div>
        </div>
      </EnhancedSection>

      {/* Summary Card */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-xl">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  סיכום ההצעה
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  כל הפרטים מוכנים ליצירת ההצעה
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-purple-500" />
                <span className="font-bold text-purple-600">מוכן ליצירה!</span>
              </div>
              <p className="text-sm text-gray-500">
                לאחר יצירת ההצעה, היא תישלח אוטומטי לצד הראשון
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestionDetails;