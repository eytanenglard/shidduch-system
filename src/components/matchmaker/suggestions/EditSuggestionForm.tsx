// EditSuggestionForm.tsx — Enterprise-grade Redesign
// ═══════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  Info,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MatchmakerPageDictionary } from '@/types/dictionary';
import type { LucideIcon } from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Constants — extracted to module scope for performance
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PRIORITY_CONFIG: Record<
  Priority,
  { icon: LucideIcon; color: string; bg: string; border: string; dot: string }
> = {
  URGENT: {
    icon: Flame,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  HIGH: {
    icon: Star,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  MEDIUM: {
    icon: Target,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  LOW: {
    icon: Shield,
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  },
};

const STATUS_ICON_MAP: Partial<
  Record<MatchSuggestionStatus, { icon: LucideIcon; color: string }>
> = {
  PENDING_FIRST_PARTY: { icon: Clock, color: 'text-amber-500' },
  PENDING_SECOND_PARTY: { icon: Clock, color: 'text-amber-500' },
  FIRST_PARTY_APPROVED: { icon: CheckCircle, color: 'text-emerald-500' },
  SECOND_PARTY_APPROVED: { icon: CheckCircle, color: 'text-emerald-500' },
  DATING: { icon: Heart, color: 'text-pink-500' },
  ENGAGED: { icon: Crown, color: 'text-yellow-500' },
  MARRIED: { icon: Sparkles, color: 'text-purple-500' },
};

const DEFAULT_STATUS_STYLE = { icon: RefreshCw, color: 'text-gray-400' };

const PRIORITY_KEYS = Object.keys(PRIORITY_CONFIG) as Priority[];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sub-components — reusable building blocks
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface FormSectionProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  icon: Icon,
  iconClassName,
  title,
  subtitle,
  headerAction,
  children,
  className,
}) => (
  <div
    className={cn(
      'rounded-xl border border-gray-200 bg-white transition-shadow duration-200 hover:shadow-sm',
      className
    )}
  >
    {/* Section Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-gray-100 shrink-0'
          )}
        >
          <Icon
            className={cn('w-3.5 h-3.5', iconClassName || 'text-gray-500')}
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 leading-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {headerAction && <div className="shrink-0 mr-2">{headerAction}</div>}
    </div>

    {/* Section Body */}
    <div className="p-4">{children}</div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const EditSuggestionForm: React.FC<EditSuggestionFormProps> = ({
  dict,
  isOpen,
  onClose,
  suggestion,
  onSave,
}) => {
  // ── State ──────────────────────────────────────────
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

  // ── Effects ────────────────────────────────────────
  useEffect(() => {
    if (!suggestion) return;

    setPriority(suggestion.priority as Priority);
    setMatchingReason(suggestion.matchingReason || '');
    setFirstPartyNotes(suggestion.firstPartyNotes || '');
    setSecondPartyNotes(suggestion.secondPartyNotes || '');
    setInternalNotes(suggestion.internalNotes || '');
    setSelectedStatus(null);
    setStatusNotes('');
    setShowStatusChange(false);

    if (suggestion.decisionDeadline) {
      const d = new Date(suggestion.decisionDeadline);
      setDecisionDeadline(!isNaN(d.getTime()) ? d : undefined);
    } else {
      setDecisionDeadline(undefined);
    }
  }, [suggestion]);

  // ── Helpers ────────────────────────────────────────
  const getStatusLabel = useCallback(
    (s: MatchSuggestionStatus): string => dict.statusLabels[s] || s,
    [dict.statusLabels]
  );

  const getAvailableStatuses = useCallback(
    (): MatchSuggestionStatus[] =>
      suggestion
        ? (Object.keys(dict.statusLabels) as MatchSuggestionStatus[])
        : [],
    [suggestion, dict.statusLabels]
  );

  const getPriorityInfo = useCallback(
    (p: Priority) => ({
      label: dict.priorityLabels[p],
      ...PRIORITY_CONFIG[p],
    }),
    [dict.priorityLabels]
  );

  const getStatusStyle = useCallback(
    (s: MatchSuggestionStatus) => STATUS_ICON_MAP[s] || DEFAULT_STATUS_STYLE,
    []
  );

  // ── Submit Handler ─────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!suggestion) {
      toast.error(dict.toasts.noSuggestionData);
      return;
    }

    setIsSubmitting(true);

    try {
      const updates: {
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
        updates.status = selectedStatus;
        updates.statusNotes =
          statusNotes ||
          `סטטוס שונה מ-${getStatusLabel(suggestion.status)} ל-${getStatusLabel(selectedStatus)}`;
      }

      await onSave({ suggestionId: suggestion.id, updates });
      toast.success(dict.toasts.updateSuccess);
      onClose();
    } catch (error) {
      console.error('Error updating suggestion:', error);
      toast.error(dict.toasts.updateError);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    suggestion,
    priority,
    selectedStatus,
    statusNotes,
    matchingReason,
    firstPartyNotes,
    secondPartyNotes,
    internalNotes,
    decisionDeadline,
    dict,
    onSave,
    onClose,
    getStatusLabel,
  ]);

  // ── Early Return ───────────────────────────────────
  if (!suggestion) return null;

  // ── Derived Values ─────────────────────────────────
  const currentPriority = getPriorityInfo(priority);
  const currentStatusStyle = getStatusStyle(suggestion.status);
  const StatusIcon = currentStatusStyle.icon;
  const party1Name = `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`;
  const party2Name = `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`;

  // ── Render ─────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 shadow-xl rounded-2xl p-0 gap-0"
        dir="rtl"
      >
        {/* ═══════════════════════════════════════════════
            HEADER — Fixed, always visible
            ═══════════════════════════════════════════════ */}
        <header className="shrink-0 px-6 pt-6 pb-5 border-b border-gray-100 bg-white rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            {/* Title Block */}
            <div className="flex items-start gap-3.5 min-w-0">
              <div
                className={cn(
                  'mt-0.5 flex items-center justify-center w-10 h-10 rounded-xl border shrink-0',
                  currentPriority.bg,
                  currentPriority.border
                )}
              >
                <StatusIcon
                  className={cn('w-5 h-5', currentStatusStyle.color)}
                />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">
                  {dict.header.title.replace('{{id}}', suggestion.id.slice(-8))}
                </h2>
                <p className="text-sm text-gray-500 mt-1 leading-snug">
                  {dict.header.description
                    .replace('{{party1}}', party1Name)
                    .replace('{{party2}}', party2Name)}
                </p>

                {/* Badges */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs font-medium px-2.5 py-0.5',
                      currentPriority.bg,
                      currentPriority.color,
                      `border ${currentPriority.border}`
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full ml-1.5',
                        currentPriority.dot
                      )}
                    />
                    {dict.header.priorityLabel.replace(
                      '{{priority}}',
                      currentPriority.label
                    )}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="text-xs font-medium text-gray-600 px-2.5 py-0.5"
                  >
                    <StatusIcon
                      className={cn('w-3 h-3 ml-1.5', currentStatusStyle.color)}
                    />
                    {dict.header.currentStatusLabel.replace(
                      '{{status}}',
                      getStatusLabel(suggestion.status)
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-lg h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════
            CONTENT — Scrollable area
            ═══════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto bg-gray-50/40">
          <div className="px-6 py-5 space-y-5">
            {/* ── Info Banner ─────────────────────────── */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-blue-50/70 border border-blue-100">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700 leading-relaxed">
                <span className="font-semibold">{dict.infoAlert.title}</span>{' '}
                {dict.infoAlert.createdFor
                  .replace('{{party1}}', party1Name)
                  .replace('{{party2}}', party2Name)}
                {' · '}
                <span className="font-medium">
                  {dict.infoAlert.status.replace(
                    '{{status}}',
                    getStatusLabel(suggestion.status)
                  )}
                </span>
                {' · '}
                <span className="font-medium">
                  {dict.infoAlert.priority.replace(
                    '{{priority}}',
                    currentPriority.label
                  )}
                </span>
              </p>
            </div>

            {/* ── Settings Row ────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <FormSection
                icon={Star}
                iconClassName="text-amber-500"
                title={dict.sections.priority.title}
              >
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as Priority)}
                >
                  <SelectTrigger className="h-10 border-gray-200 rounded-lg text-sm">
                    <SelectValue
                      placeholder={dict.sections.priority.placeholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_KEYS.map((p) => {
                      const info = getPriorityInfo(p);
                      const PIcon = info.icon;
                      return (
                        <SelectItem key={p} value={p}>
                          <div className="flex items-center gap-2">
                            <PIcon className={cn('w-3.5 h-3.5', info.color)} />
                            <span>{info.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormSection>

              {/* Status Change */}
              <FormSection
                icon={RefreshCw}
                iconClassName="text-indigo-500"
                title={dict.sections.statusChange.title}
                headerAction={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatusChange(!showStatusChange)}
                    className={cn(
                      'text-xs h-7 rounded-md px-2.5 font-medium transition-colors',
                      showStatusChange
                        ? 'text-indigo-700 bg-indigo-100 hover:bg-indigo-150'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <RefreshCw className="w-3 h-3 ml-1.5" />
                    {showStatusChange
                      ? dict.sections.statusChange.cancelChangeButton
                      : dict.sections.statusChange.changeButton}
                  </Button>
                }
              >
                {showStatusChange ? (
                  <div className="space-y-3">
                    <Select
                      value={selectedStatus || ''}
                      onValueChange={(v) =>
                        setSelectedStatus(
                          v && v !== 'NO_CHANGE'
                            ? (v as MatchSuggestionStatus)
                            : null
                        )
                      }
                    >
                      <SelectTrigger className="h-10 border-gray-200 rounded-lg text-sm">
                        <SelectValue
                          placeholder={dict.sections.statusChange.placeholder}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NO_CHANGE">
                          {dict.sections.statusChange.noChangeOption}
                        </SelectItem>
                        {getAvailableStatuses().map((s) => (
                          <SelectItem key={s} value={s}>
                            {getStatusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedStatus && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-600">
                          {dict.sections.statusChange.notesLabel}
                        </Label>
                        <Textarea
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          placeholder={
                            dict.sections.statusChange.notesPlaceholder
                          }
                          className="min-h-[64px] text-sm border-gray-200 rounded-lg resize-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-0.5">
                    <StatusIcon
                      className={cn('w-4 h-4', currentStatusStyle.color)}
                    />
                    <span>{getStatusLabel(suggestion.status)}</span>
                  </div>
                )}
              </FormSection>
            </div>

            {/* ── Decision Deadline ───────────────────── */}
            <FormSection
              icon={Calendar}
              iconClassName="text-orange-500"
              title={dict.sections.decisionDeadline.title}
            >
              <DatePicker
                value={{ from: decisionDeadline, to: undefined }}
                onChange={({ from }) => setDecisionDeadline(from)}
              />
            </FormSection>

            {/* ── Visual Separator ────────────────────── */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center px-2">
                <div className="w-full border-t border-gray-200/80" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50/40 px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  {dict.sections.matchingReason.title}
                </span>
              </div>
            </div>

            {/* ── Matching Reason ─────────────────────── */}
            <FormSection
              icon={Heart}
              iconClassName="text-rose-500"
              title={dict.sections.matchingReason.title}
            >
              <Textarea
                value={matchingReason}
                onChange={(e) => setMatchingReason(e.target.value)}
                placeholder={dict.sections.matchingReason.placeholder}
                className="min-h-[120px] border-gray-200 rounded-lg resize-none text-sm leading-relaxed"
              />
            </FormSection>

            {/* ── Party Notes ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormSection
                icon={User}
                iconClassName="text-blue-500"
                title={dict.sections.firstPartyNotes.title.replace(
                  '{{name}}',
                  suggestion.firstParty.firstName
                )}
              >
                <Textarea
                  value={firstPartyNotes}
                  onChange={(e) => setFirstPartyNotes(e.target.value)}
                  placeholder={dict.sections.firstPartyNotes.placeholder}
                  className="min-h-[100px] border-gray-200 rounded-lg resize-none text-sm leading-relaxed"
                />
              </FormSection>

              <FormSection
                icon={User}
                iconClassName="text-purple-500"
                title={dict.sections.secondPartyNotes.title.replace(
                  '{{name}}',
                  suggestion.secondParty.firstName
                )}
              >
                <Textarea
                  value={secondPartyNotes}
                  onChange={(e) => setSecondPartyNotes(e.target.value)}
                  placeholder={dict.sections.secondPartyNotes.placeholder}
                  className="min-h-[100px] border-gray-200 rounded-lg resize-none text-sm leading-relaxed"
                />
              </FormSection>
            </div>

            {/* ── Internal Notes ──────────────────────── */}
            <FormSection
              icon={Lock}
              iconClassName="text-gray-400"
              title={dict.sections.internalNotes.title}
              className="border-dashed"
            >
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder={dict.sections.internalNotes.placeholder}
                className="min-h-[100px] border-gray-200 rounded-lg resize-none text-sm leading-relaxed bg-gray-50/50"
              />
            </FormSection>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            FOOTER — Fixed, always visible
            ═══════════════════════════════════════════════ */}
        <footer className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white rounded-b-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{dict.footer.info}</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 h-9 text-sm border-gray-200 rounded-lg hover:bg-gray-50"
              >
                {dict.footer.cancelButton}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 h-9 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 ml-2 animate-spin" />
                    {dict.footer.savingButton}
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 ml-2" />
                    {dict.footer.saveButton}
                  </>
                )}
              </Button>
            </div>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
};

export default EditSuggestionForm;
