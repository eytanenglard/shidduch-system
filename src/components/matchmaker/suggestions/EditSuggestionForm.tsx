// EditSuggestionForm.tsx - גרסה מתורגמת ומלאה

import React, { useState } from 'react';
import {useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Priority, MatchSuggestionStatus } from '@prisma/client';
import { DatePicker } from '@/components/ui/date-picker';
import type { Suggestion } from '@/types/suggestions';
import {
  RefreshCw,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  MessageCircle,
  CheckCircle,
  Sparkles,
  Heart,
  Save,
  X,
  Star,
  Flame,
  Target,
  Shield,
  Crown,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MatchmakerPageDictionary } from '@/types/dictionary';

interface EditSuggestionFormProps {
  dict: MatchmakerPageDictionary['suggestionsDashboard']['editSuggestionForm'];
  isOpen: boolean;
  onClose: () => void;
  suggestion: Suggestion | null;
  onSave: (data: {
    suggestionId: string;
    updates: {
      priority?: Priority;
      status?: MatchSuggestionStatus;
      statusNotes?: string;
      matchingReason?: string;
      firstPartyNotes?: string;
      secondPartyNotes?: string;
      internalNotes?: string;
      decisionDeadline?: Date;
    };
  }) => Promise<void>;
}

const EditSuggestionForm: React.FC<EditSuggestionFormProps> = ({
  dict,
  isOpen,
  onClose,
  suggestion,
  onSave,
}) => {
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [selectedStatus, setSelectedStatus] =
    useState<MatchSuggestionStatus | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [matchingReason, setMatchingReason] = useState('');
  const [firstPartyNotes, setFirstPartyNotes] = useState('');
  const [secondPartyNotes, setSecondPartyNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [decisionDeadline, setDecisionDeadline] = useState<Date | undefined>(
    undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);

  useEffect(() => {
    if (suggestion) {
      setPriority(suggestion.priority as Priority);
      setMatchingReason(suggestion.matchingReason || '');
      setFirstPartyNotes(suggestion.firstPartyNotes || '');
      setSecondPartyNotes(suggestion.secondPartyNotes || '');
      setInternalNotes(suggestion.internalNotes || '');

      setSelectedStatus(null);
      setStatusNotes('');
      setShowStatusChange(false);

      if (suggestion.decisionDeadline) {
        const deadlineDate = new Date(suggestion.decisionDeadline);
        if (!isNaN(deadlineDate.getTime())) {
          setDecisionDeadline(deadlineDate);
        }
      } else {
        setDecisionDeadline(undefined);
      }
    }
  }, [suggestion]);

  const getStatusLabel = (statusValue: MatchSuggestionStatus): string => {
    return dict.statusLabels[statusValue] || statusValue;
  };

  const getAvailableStatuses = (): MatchSuggestionStatus[] => {
    if (!suggestion) return [];
    return Object.keys(dict.statusLabels) as MatchSuggestionStatus[];
  };

  const handleSubmit = async () => {
    if (!suggestion) {
      toast.error(dict.toasts.noSuggestionData);
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: {
        priority: Priority;
        status?: MatchSuggestionStatus;
        statusNotes?: string;
        matchingReason: string;
        firstPartyNotes: string;
        secondPartyNotes: string;
        internalNotes: string;
        decisionDeadline?: Date;
      } = {
        priority,
        matchingReason,
        firstPartyNotes,
        secondPartyNotes,
        internalNotes,
        decisionDeadline,
      };

      if (selectedStatus && selectedStatus !== suggestion.status) {
        updateData.status = selectedStatus;
        updateData.statusNotes =
          statusNotes ||
          `סטטוס שונה מ-${getStatusLabel(suggestion.status)} ל-${getStatusLabel(selectedStatus)}`; // Note: This internal-facing string may not need translation
      }

      await onSave({
        suggestionId: suggestion.id,
        updates: updateData,
      });

      toast.success(dict.toasts.updateSuccess);
      onClose();
    } catch (error) {
      console.error('Error updating suggestion:', error);
      toast.error(dict.toasts.updateError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityInfo = (p: Priority) => {
    const infoMap = {
      URGENT: { color: 'from-red-500 to-pink-500', icon: Flame, textColor: 'text-red-600' },
      HIGH: { color: 'from-orange-500 to-amber-500', icon: Star, textColor: 'text-orange-600' },
      MEDIUM: { color: 'from-blue-500 to-cyan-500', icon: Target, textColor: 'text-blue-600' },
      LOW: { color: 'from-gray-500 to-slate-500', icon: Shield, textColor: 'text-gray-600' },
    };
    return {
      label: dict.priorityLabels[p],
      ...infoMap[p],
    };
  };

  const getStatusInfo = (status: MatchSuggestionStatus) => {
    switch (status) {
      case 'PENDING_FIRST_PARTY':
      case 'PENDING_SECOND_PARTY':
        return { icon: Clock, color: 'text-yellow-600', bg: 'from-yellow-50 to-amber-50' };
      case 'FIRST_PARTY_APPROVED':
      case 'SECOND_PARTY_APPROVED':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'from-green-50 to-emerald-50' };
      case 'DATING':
        return { icon: Heart, color: 'text-pink-600', bg: 'from-pink-50 to-rose-50' };
      case 'ENGAGED':
        return { icon: Crown, color: 'text-yellow-600', bg: 'from-yellow-50 to-orange-50' };
      case 'MARRIED':
        return { icon: Sparkles, color: 'text-purple-600', bg: 'from-purple-50 to-pink-50' };
      default:
        return { icon: RefreshCw, color: 'text-gray-600', bg: 'from-gray-50 to-slate-50' };
    }
  };

  if (!suggestion) return null;

  const currentPriorityInfo = getPriorityInfo(priority);
  const currentStatusInfo = getStatusInfo(suggestion.status);
  const CurrentStatusIcon = currentStatusInfo.icon;
  const CurrentPriorityIcon = currentPriorityInfo.icon;
  const fullParty1Name = `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`;
  const fullParty2Name = `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl rounded-3xl p-0" dir="rtl">
        <div className={cn('relative overflow-hidden bg-gradient-to-br', currentStatusInfo.bg, 'border-b border-gray-100')}>
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
          </div>
          <div className="relative z-10 p-8">
            <DialogHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
                    <CurrentStatusIcon className={cn('w-8 h-8', currentStatusInfo.color)} />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-gray-800">{dict.header.title.replace('{{id}}', suggestion.id.slice(-8))}</DialogTitle>
                    <DialogDescription className="text-lg text-gray-600 mt-1">
                      {dict.header.description.replace('{{party1}}', fullParty1Name).replace('{{party2}}', fullParty2Name)}
                    </DialogDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-12 w-12 text-gray-500 hover:text-gray-700 hover:bg-white/50 backdrop-blur-sm">
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={cn('px-4 py-2 font-bold shadow-lg bg-gradient-to-r text-white', currentPriorityInfo.color)}>
                  <CurrentPriorityIcon className="w-4 h-4 ml-2" />
                  {dict.header.priorityLabel.replace('{{priority}}', currentPriorityInfo.label)}
                </Badge>
                <Badge className="px-4 py-2 bg-white/20 backdrop-blur-sm text-gray-700 border border-white/30">
                  {dict.header.currentStatusLabel.replace('{{status}}', getStatusLabel(suggestion.status))}
                </Badge>
              </div>
            </DialogHeader>
          </div>
        </div>
        <div className="p-8 space-y-8">
          <Alert className="border-0 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-blue-500" />
            <AlertDescription className="text-blue-800 font-medium">
              <strong>{dict.infoAlert.title}</strong> {dict.infoAlert.createdFor.replace('{{party1}}', fullParty1Name).replace('{{party2}}', fullParty2Name)}
              <br />
              <strong>{dict.infoAlert.status.replace('{{status}}', getStatusLabel(suggestion.status))}</strong> •{' '}
              <strong>{dict.infoAlert.priority.replace('{{priority}}', currentPriorityInfo.label)}</strong>
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn('p-2 rounded-full bg-gradient-to-r text-white shadow-lg', currentPriorityInfo.color)}><Star className="w-5 h-5" /></div>
                <Label className="text-lg font-bold text-gray-800">{dict.sections.priority.title}</Label>
              </div>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-xl transition-all">
                  <SelectValue placeholder={dict.sections.priority.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(dict.priorityLabels).map((p) => {
                    const info = getPriorityInfo(p as Priority);
                    const Icon = info.icon;
                    return (
                      <SelectItem key={p} value={p}>
                        <div className="flex items-center gap-2"><Icon className={cn('w-4 h-4', info.textColor)} />{info.label}</div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4 p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"><RefreshCw className="w-5 h-5" /></div>
                  <Label className="text-lg font-bold text-gray-800">{dict.sections.statusChange.title}</Label>
                </div>
                <Button type="button" variant={showStatusChange ? 'default' : 'outline'} size="sm" onClick={() => setShowStatusChange(!showStatusChange)} className={cn('rounded-xl transition-all duration-300', showStatusChange ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'border-2 border-purple-200 text-purple-600 hover:bg-purple-50')}>
                  <RefreshCw className="w-4 h-4 ml-2" />{showStatusChange ? dict.sections.statusChange.cancelChangeButton : dict.sections.statusChange.changeButton}
                </Button>
              </div>
              {showStatusChange && (
                <div className="space-y-4 p-4 border-2 border-purple-100 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
                  <Select value={selectedStatus || ''} onValueChange={(value) => setSelectedStatus(value && value !== 'NO_CHANGE' ? value as MatchSuggestionStatus : null)}>
                    <SelectTrigger className="h-12 border-2 border-purple-200 bg-white"><SelectValue placeholder={dict.sections.statusChange.placeholder} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_CHANGE">{dict.sections.statusChange.noChangeOption}</SelectItem>
                      {getAvailableStatuses().map((status) => (<SelectItem key={status} value={status}>{getStatusLabel(status)}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {selectedStatus && (
                    <div>
                      <Label className="text-sm font-medium text-purple-800">{dict.sections.statusChange.notesLabel}</Label>
                      <Textarea value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)} placeholder={dict.sections.statusChange.notesPlaceholder} className="mt-2 h-20 border-2 border-purple-200 focus:border-purple-400 rounded-xl" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"><Calendar className="w-5 h-5" /></div>
              <Label className="text-lg font-bold text-gray-800">{dict.sections.decisionDeadline.title}</Label>
            </div>
            <DatePicker value={{ from: decisionDeadline, to: undefined }} onChange={({ from }) => setDecisionDeadline(from)} />
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg"><Heart className="w-5 h-5" /></div>
              <Label className="text-lg font-bold text-gray-800">{dict.sections.matchingReason.title}</Label>
            </div>
            <Textarea value={matchingReason} onChange={(e) => setMatchingReason(e.target.value)} placeholder={dict.sections.matchingReason.placeholder} className="h-32 border-2 border-gray-200 focus:border-emerald-400 rounded-xl transition-all resize-none" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"><User className="w-5 h-5" /></div>
                <Label className="text-lg font-bold text-gray-800">{dict.sections.firstPartyNotes.title.replace('{{name}}', suggestion.firstParty.firstName)}</Label>
              </div>
              <Textarea value={firstPartyNotes} onChange={(e) => setFirstPartyNotes(e.target.value)} placeholder={dict.sections.firstPartyNotes.placeholder} className="h-32 border-2 border-gray-200 focus:border-blue-400 rounded-xl transition-all resize-none" />
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"><User className="w-5 h-5" /></div>
                <Label className="text-lg font-bold text-gray-800">{dict.sections.secondPartyNotes.title.replace('{{name}}', suggestion.secondParty.firstName)}</Label>
              </div>
              <Textarea value={secondPartyNotes} onChange={(e) => setSecondPartyNotes(e.target.value)} placeholder={dict.sections.secondPartyNotes.placeholder} className="h-32 border-2 border-gray-200 focus:border-purple-400 rounded-xl transition-all resize-none" />
            </div>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"><MessageCircle className="w-5 h-5" /></div>
              <Label className="text-lg font-bold text-gray-800">{dict.sections.internalNotes.title}</Label>
            </div>
            <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder={dict.sections.internalNotes.placeholder} className="h-32 border-2 border-gray-200 focus:border-amber-400 rounded-xl transition-all resize-none" />
          </div>
        </div>
        <DialogFooter className="p-8 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="flex justify-between w-full items-center">
            <span className="text-sm text-gray-500 font-medium">{dict.footer.info}</span>
            <div className="flex gap-4">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="px-8 py-3 border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all">{dict.footer.cancelButton}</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl transform hover:scale-105">
                {isSubmitting ? (<><RefreshCw className="w-5 h-5 ml-2 animate-spin" />{dict.footer.savingButton}</>) : (<><Save className="w-5 h-5 ml-2" />{dict.footer.saveButton}</>)}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSuggestionForm;