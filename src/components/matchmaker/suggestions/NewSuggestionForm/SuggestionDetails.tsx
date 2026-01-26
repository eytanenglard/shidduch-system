// src/app/components/matchmaker/suggestions/NewSuggestionForm/SuggestionDetails.tsx

'use client';
import React, { useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';

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
import { Globe, Languages } from 'lucide-react';

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
import type { MatchmakerPageDictionary } from '@/types/dictionary';

interface SuggestionDetailsProps {
  dict: MatchmakerPageDictionary['suggestionsDashboard']['newSuggestionForm']['suggestionDetails'];
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
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-900"></div>
    </div>
    <CardContent className="relative z-10 p-8 space-y-6">
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

const PriorityBadge: React.FC<{
  priority: Priority;
  dict: MatchmakerPageDictionary['suggestionsDashboard']['newSuggestionForm']['suggestionDetails']['priority'];
}> = ({ priority, dict }) => {
  const getPriorityInfo = (p: Priority) => {
    switch (p) {
      case Priority.URGENT:
        return {
          label: dict.options.URGENT.title,
          icon: Flame,
          className:
            'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse shadow-xl',
        };
      case Priority.HIGH:
        return {
          label: dict.options.HIGH.title,
          icon: Star,
          className:
            'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl',
        };
      case Priority.MEDIUM:
        return {
          label: dict.options.MEDIUM.title,
          icon: Target,
          className:
            'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl',
        };
      case Priority.LOW:
        return {
          label: dict.options.LOW.title,
          icon: Shield,
          className:
            'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-xl',
        };
      default:
        return {
          label: dict.options.MEDIUM.title,
          icon: Target,
          className:
            'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl',
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
const LanguageSelector: React.FC<{
  partyName: string;
  partyLanguage: 'he' | 'en';
  // שינוי קריטי: הגדרת השדה להיות מוגבל למפתחות הספציפיים בטופס
  fieldName: keyof NewSuggestionFormData; 
  gradient: string;
  dict: {
    label: string;
    description: string;
    options: {
      he: string;
      en: string;
    };
  };
  // שינוי קריטי: שימוש בטיפוס המדויק של Hook Form
  setValue: UseFormSetValue<NewSuggestionFormData>;
}> = ({ partyName, partyLanguage, fieldName, gradient, dict, setValue }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Languages className="w-5 h-5 text-gray-500" />
        <Label className="text-base font-medium text-gray-700">
          {dict.label.replace('{{name}}', partyName)}
        </Label>
      </div>
      <p className="text-sm text-gray-500">{dict.description}</p>
      <Select
        onValueChange={(value: 'he' | 'en') =>
          // אין צורך ב-cast, הטיפוסים כעת תואמים
          setValue(fieldName, value, { shouldValidate: true })
        }
        defaultValue={partyLanguage}
        name={fieldName}
      >
        <SelectTrigger className={cn(
          "h-12 border-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-md transition-all",
          gradient === 'blue' 
            ? "border-blue-200 hover:border-blue-300 focus:border-blue-500"
            : "border-purple-200 hover:border-purple-300 focus:border-purple-500"
        )}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-0 shadow-xl rounded-xl bg-white/95 backdrop-blur-sm">
          <SelectItem value="he">
            <div className="flex items-center gap-3 py-1">
              <span className="text-xl">🇮🇱</span>
              <span className="font-medium">{dict.options.he}</span>
            </div>
          </SelectItem>
          <SelectItem value="en">
            <div className="flex items-center gap-3 py-1">
              <span className="text-xl">🇺🇸</span>
              <span className="font-medium">{dict.options.en}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};



const SuggestionDetails: React.FC<SuggestionDetailsProps> = ({
  dict,
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
const firstPartyLanguage = watch('firstPartyLanguage') || firstParty.language || 'he';
const secondPartyLanguage = watch('secondPartyLanguage') || secondParty.language || 'he';
React.useEffect(() => {
  // הגדר שפת ברירת מחדל מהמועמד אם קיימת
  if (firstParty.language) {
    setValue('firstPartyLanguage', firstParty.language as 'he' | 'en');
  }
  if (secondParty.language) {
    setValue('secondPartyLanguage', secondParty.language as 'he' | 'en');
  }
}, [firstParty.language, secondParty.language, setValue]);

  const handleGenerateRationale = async () => {
    setIsGeneratingRationale(true);
    toast.info(dict.toasts.aiLoading.title, {
      description: dict.toasts.aiLoading.description,
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
        throw new Error(data.error || 'Error generating rationale');
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
      toast.success(dict.toasts.aiSuccess.title, {
        description: dict.toasts.aiSuccess.description,
        duration: 5000,
      });
    } catch (error) {
      console.error('Failed to generate rationales:', error);
      toast.error(dict.toasts.aiError.title, {
        description: dict.toasts.aiError.description,
      });
    } finally {
      setIsGeneratingRationale(false);
    }
  };

  return (
    <div className="space-y-8">
      <EnhancedSection
        icon={Crown}
        title={dict.priority.title}
        description={dict.priority.description}
        gradient="from-purple-500 to-pink-500"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-gray-700">
              {dict.priority.label}
            </Label>
            <PriorityBadge priority={priority} dict={dict.priority} />
          </div>
          <Select
            onValueChange={(value: Priority) =>
              setValue('priority', value, { shouldValidate: true })
            }
            defaultValue={priority}
            name="priority"
          >
            <SelectTrigger className="h-14 border-2 border-purple-200 hover:border-purple-300 focus:border-purple-500 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg transition-all text-lg">
              <SelectValue placeholder={dict.priority.placeholder} />
            </SelectTrigger>
            <SelectContent className="border-0 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm">
              <SelectItem value={Priority.URGENT}>
                <div className="flex items-center gap-3 py-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="font-bold text-red-600">
                      {dict.priority.options.URGENT.title}
                    </div>
                    <div className="text-xs text-red-500">
                      {dict.priority.options.URGENT.description}
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value={Priority.HIGH}>
                <div className="flex items-center gap-3 py-2">
                  <Star className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="font-bold text-orange-600">
                      {dict.priority.options.HIGH.title}
                    </div>
                    <div className="text-xs text-orange-500">
                      {dict.priority.options.HIGH.description}
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value={Priority.MEDIUM}>
                <div className="flex items-center gap-3 py-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-bold text-blue-600">
                      {dict.priority.options.MEDIUM.title}
                    </div>
                    <div className="text-xs text-blue-500">
                      {dict.priority.options.MEDIUM.description}
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value={Priority.LOW}>
                <div className="flex items-center gap-3 py-2">
                  <Shield className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-bold text-gray-600">
                      {dict.priority.options.LOW.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {dict.priority.options.LOW.description}
                    </div>
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

      <EnhancedSection
        icon={Brain}
        title={dict.rationale.title}
        description={dict.rationale.description}
        gradient="from-emerald-500 to-green-500"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-gray-700">
              {dict.rationale.label}
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
                  <span>{dict.rationale.aiButtonLoading}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 ml-2 text-yellow-300" />
                  <span>{dict.rationale.aiButton}</span>
                </>
              )}
            </Button>
          </div>
          <Textarea
            id="matchingReason"
            {...register('matchingReason')}
            placeholder={dict.rationale.placeholder}
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
            <AlertDescription
              className="text-blue-800 font-medium leading-relaxed"
              dangerouslySetInnerHTML={{ __html: dict.rationale.aiTip }}
            />
          </Alert>
        </div>
      </EnhancedSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EnhancedSection
          icon={User}
          title={dict.notes.party1Title.replace(
            '{{name}}',
            firstParty.firstName
          )}
          description={dict.notes.description}
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
                <div className="text-sm text-blue-600">
                  {dict.notes.party1Label}
                </div>
              </div>
            </div>
            <Textarea
              id="firstPartyNotes"
              {...register('firstPartyNotes')}
              placeholder={dict.notes.party1Placeholder
                .replace('{{otherName}}', secondParty.firstName)
                .replace('{{name}}', firstParty.firstName)}
              className="min-h-[160px] border-2 border-blue-200 hover:border-blue-300 focus:border-blue-500 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg transition-all text-lg resize-none"
            />
            <div className="pt-4 border-t border-blue-100">
  <LanguageSelector
    partyName={firstParty.firstName}
    partyLanguage={firstPartyLanguage}
    fieldName="firstPartyLanguage"
    gradient="blue"
    dict={dict.language}
    setValue={setValue}
  />
</div>

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
        <EnhancedSection
          icon={User}
          title={dict.notes.party2Title.replace(
            '{{name}}',
            secondParty.firstName
          )}
          description={dict.notes.description}
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
                <div className="text-sm text-purple-600">
                  {dict.notes.party2Label}
                </div>
              </div>
            </div>
            <Textarea
              id="secondPartyNotes"
              {...register('secondPartyNotes')}
              placeholder={dict.notes.party2Placeholder
                .replace('{{otherName}}', firstParty.firstName)
                .replace('{{name}}', secondParty.firstName)}
              className="min-h-[160px] border-2 border-purple-200 hover:border-purple-300 focus:border-purple-500 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg transition-all text-lg resize-none"
            />
            <div className="pt-4 border-t border-purple-100">
  <LanguageSelector
    partyName={secondParty.firstName}
    partyLanguage={secondPartyLanguage}
    fieldName="secondPartyLanguage"
    gradient="purple"
    dict={dict.language}
    setValue={setValue}
  />
</div>
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

      <EnhancedSection
        icon={MessageCircle}
        title={dict.internalNotes.title}
        description={dict.internalNotes.description}
        gradient="from-amber-500 to-orange-500"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
            <div className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-amber-800">
                {dict.internalNotes.secretInfo}
              </div>
              <div className="text-sm text-amber-600">
                {dict.internalNotes.visibleTo}
              </div>
            </div>
          </div>
          <Textarea
            id="internalNotes"
            {...register('internalNotes')}
            placeholder={dict.internalNotes.placeholder}
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

      <EnhancedSection
        icon={Clock}
        title={dict.deadline.title}
        description={dict.deadline.description}
        gradient="from-indigo-500 to-purple-500"
      >
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-gray-700">
            {dict.deadline.label}
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
                    <div className="font-bold text-red-600">
                      {dict.deadline.options['3'].title}
                    </div>
                    <div className="text-xs text-red-500">
                      {dict.deadline.options['3'].description}
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="7">
                <div className="flex items-center gap-3 py-2">
                  <Award className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="font-bold text-orange-600">
                      {dict.deadline.options['7'].title}
                    </div>
                    <div className="text-xs text-orange-500">
                      {dict.deadline.options['7'].description}
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="14">
                <div className="flex items-center gap-3 py-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-bold text-blue-600">
                      {dict.deadline.options['14'].title}
                    </div>
                    <div className="text-xs text-blue-500">
                      {dict.deadline.options['14'].description}
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="30">
                <div className="flex items-center gap-3 py-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-bold text-green-600">
                      {dict.deadline.options['30'].title}
                    </div>
                    <div className="text-xs text-green-500">
                      {dict.deadline.options['30'].description}
                    </div>
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
                <div className="font-bold text-indigo-800 mb-1">
                  {dict.deadline.infoBox.title}
                </div>
                <p className="text-sm text-indigo-700 leading-relaxed">
                  {dict.deadline.infoBox.body}
                </p>
              </div>
            </div>
          </div>
        </div>
      </EnhancedSection>

      <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-xl">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {dict.summary.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {dict.summary.description}
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-purple-500" />
                <span className="font-bold text-purple-600">
                  {dict.summary.ready}
                </span>
              </div>
              <p className="text-sm text-gray-500">{dict.summary.info}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestionDetails;
