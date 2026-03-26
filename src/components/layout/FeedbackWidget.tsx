// src/components/layout/FeedbackWidget.tsx

'use client';

import React, { useReducer, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  ThumbsUp,
  Bug,
  Lightbulb,
  Loader2,
  Paperclip,
  X,
  Send,
  CheckCircle2,
} from 'lucide-react';
import type { FeedbackWidgetDict } from '@/types/dictionary';

// ─── Types ───────────────────────────────────────────────────────────

interface FeedbackWidgetProps {
  dict: FeedbackWidgetDict;
  locale?: string;
}

type FeedbackType = 'SUGGESTION' | 'BUG' | 'POSITIVE';
type Step = 'type' | 'form' | 'success';

interface State {
  isOpen: boolean;
  step: Step;
  feedbackType: FeedbackType | null;
  content: string;
  screenshot: File | null;
  isSubmitting: boolean;
  isHovered: boolean;
  isPermanentlyHidden: boolean;
  showConfirmClose: boolean;
}

type Action =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_STEP'; step: Step }
  | { type: 'SET_FEEDBACK_TYPE'; feedbackType: FeedbackType }
  | { type: 'SET_CONTENT'; content: string }
  | { type: 'SET_SCREENSHOT'; screenshot: File | null }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_HOVERED'; isHovered: boolean }
  | { type: 'HIDE_PERMANENTLY' }
  | { type: 'SHOW_WIDGET' }
  | { type: 'SHOW_CONFIRM_CLOSE' }
  | { type: 'HIDE_CONFIRM_CLOSE' }
  | { type: 'RESET' };

const MAX_CHARS = 5000;

const initialState: State = {
  isOpen: false,
  step: 'type',
  feedbackType: null,
  content: '',
  screenshot: null,
  isSubmitting: false,
  isHovered: false,
  isPermanentlyHidden: false,
  showConfirmClose: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true, step: 'type' };
    case 'CLOSE':
      return { ...state, isOpen: false, showConfirmClose: false };
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_FEEDBACK_TYPE':
      return { ...state, feedbackType: action.feedbackType, step: 'form' };
    case 'SET_CONTENT':
      return { ...state, content: action.content };
    case 'SET_SCREENSHOT':
      return { ...state, screenshot: action.screenshot };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'SET_HOVERED':
      return { ...state, isHovered: action.isHovered };
    case 'HIDE_PERMANENTLY':
      return { ...state, isPermanentlyHidden: true };
    case 'SHOW_WIDGET':
      return { ...state, isPermanentlyHidden: false };
    case 'SHOW_CONFIRM_CLOSE':
      return { ...state, showConfirmClose: true };
    case 'HIDE_CONFIRM_CLOSE':
      return { ...state, showConfirmClose: false };
    case 'RESET':
      return {
        ...initialState,
        isPermanentlyHidden: state.isPermanentlyHidden,
      };
    default:
      return state;
  }
}

// ─── Component ───────────────────────────────────────────────────────

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  dict,
  locale = 'en',
}) => {
  const isRTL = locale === 'he' || locale === 'ar';

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    isOpen,
    step,
    feedbackType,
    content,
    screenshot,
    isSubmitting,
    isHovered,
    isPermanentlyHidden,
    showConfirmClose,
  } = state;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Screenshot preview via URL.createObjectURL
  const screenshotPreview = useMemo(() => {
    if (!screenshot) return null;
    return URL.createObjectURL(screenshot);
  }, [screenshot]);

  // Cleanup object URL on unmount or screenshot change
  useEffect(() => {
    return () => {
      if (screenshotPreview) {
        URL.revokeObjectURL(screenshotPreview);
      }
    };
  }, [screenshotPreview]);

  // Load hidden state from localStorage
  useEffect(() => {
    const hidden = localStorage.getItem('feedback-widget-hidden');
    if (hidden === 'true') {
      dispatch({ type: 'HIDE_PERMANENTLY' });
    }
  }, []);

  // Feedback type options
  const feedbackOptions = useMemo(
    () => [
      {
        type: 'SUGGESTION' as FeedbackType,
        icon: Lightbulb,
        label: dict.types.suggestion.label,
        description: dict.types.suggestion.description,
        color: 'bg-amber-500',
        hoverBorder: 'hover:border-amber-300',
      },
      {
        type: 'BUG' as FeedbackType,
        icon: Bug,
        label: dict.types.bug.label,
        description: dict.types.bug.description,
        color: 'bg-rose-500',
        hoverBorder: 'hover:border-rose-300',
      },
      {
        type: 'POSITIVE' as FeedbackType,
        icon: ThumbsUp,
        label: dict.types.positive.label,
        description: dict.types.positive.description,
        color: 'bg-teal-500',
        hoverBorder: 'hover:border-teal-300',
      },
    ],
    [dict]
  );

  const selectedOption = useMemo(
    () => feedbackOptions.find((o) => o.type === feedbackType),
    [feedbackOptions, feedbackType]
  );

  const hasUnsavedContent = content.trim().length > 0 || screenshot !== null;

  // ─── Close logic with confirm ───────────────────────────────────

  const attemptClose = useCallback(() => {
    if (hasUnsavedContent && step === 'form') {
      dispatch({ type: 'SHOW_CONFIRM_CLOSE' });
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [hasUnsavedContent, step]);

  const confirmClose = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // ─── Escape key handler ─────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showConfirmClose) {
          dispatch({ type: 'HIDE_CONFIRM_CLOSE' });
        } else {
          attemptClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showConfirmClose, attemptClose]);

  // ─── Focus trap ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;

    // Focus first focusable element when opening
    const timer = setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 100);

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea, input:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen, step]);

  // ─── Permanently hide/show ──────────────────────────────────────

  const handleHidePermanently = useCallback(() => {
    dispatch({ type: 'HIDE_PERMANENTLY' });
    localStorage.setItem('feedback-widget-hidden', 'true');
  }, []);

  const handleShowWidget = useCallback(() => {
    dispatch({ type: 'SHOW_WIDGET' });
    localStorage.setItem('feedback-widget-hidden', 'false');
  }, []);

  // ─── File handling ──────────────────────────────────────────────

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isOpen || step !== 'form') {
        if (event.target) event.target.value = '';
        return;
      }

      const file = event.target.files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          toast.error(dict.toasts.imageTooLarge);
          return;
        }
        dispatch({ type: 'SET_SCREENSHOT', screenshot: file });
      }
      if (event.target) event.target.value = '';
    },
    [isOpen, step, dict.toasts.imageTooLarge]
  );

  // ─── Submit ─────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || !feedbackType) {
      toast.error(dict.toasts.contentRequired);
      return;
    }

    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    const formData = new FormData();
    formData.append('content', content);
    formData.append('feedbackType', feedbackType);
    formData.append('pageUrl', window.location.href);
    formData.append('screenWidth', String(window.innerWidth));
    formData.append('screenHeight', String(window.innerHeight));
    formData.append('language', navigator.language);
    if (screenshot) {
      formData.append('screenshot', screenshot);
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to submit feedback');

      // Show success step briefly before closing
      dispatch({ type: 'SET_STEP', step: 'success' });
      toast.success(dict.toasts.submitSuccess);

      setTimeout(() => {
        dispatch({ type: 'RESET' });
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error(dict.toasts.submitError);
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  }, [content, feedbackType, screenshot, dict.toasts]);

  // ─── Character count display ────────────────────────────────────

  const charCountText = dict.charCount
    .replace('{{count}}', String(content.length))
    .replace('{{max}}', String(MAX_CHARS));

  const isOverLimit = content.length > MAX_CHARS;

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <>
      {/* Floating Tab Button */}
      <div className="fixed top-1/2 -translate-y-1/2 right-0 z-50">
        <div
          className={cn(
            'transition-all duration-500',
            isOpen || isPermanentlyHidden
              ? 'translate-x-4 opacity-0 scale-95 pointer-events-none'
              : 'translate-x-0 opacity-100 scale-100'
          )}
        >
          <div className="relative group">
            <button
              onClick={() => dispatch({ type: 'OPEN' })}
              onMouseEnter={() =>
                dispatch({ type: 'SET_HOVERED', isHovered: true })
              }
              onMouseLeave={() =>
                dispatch({ type: 'SET_HOVERED', isHovered: false })
              }
              className={cn(
                'relative text-white px-1.5 sm:px-2 py-4 sm:py-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] hover:scale-105 active:scale-95 overflow-hidden bg-teal-600 hover:bg-teal-700 rounded-l-2xl',
                isHovered ? 'w-20 sm:w-28' : 'w-8 sm:w-12'
              )}
              aria-label={dict.openAriaLabel}
            >
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mb-2 sm:mb-3" />
                {!isHovered ? (
                  <span
                    className="text-xs sm:text-sm font-bold tracking-wider"
                    style={{
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                    }}
                  >
                    {dict.tabLabel}
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm font-bold whitespace-nowrap px-1">
                    {dict.tabLabel}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleHidePermanently();
              }}
              className="absolute -top-2 -left-2 w-6 h-6 bg-white hover:bg-rose-500 text-gray-600 hover:text-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 border border-gray-200 z-20"
              aria-label={dict.hideAriaLabel}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {isPermanentlyHidden && (
          <button
            onClick={handleShowWidget}
            className="w-8 h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
            aria-label={dict.showAriaLabel}
            title={dict.showAriaLabel}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={attemptClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              attemptClose();
            }
          }}
          role="button"
          tabIndex={-1}
          aria-label={dict.closeAriaLabel}
        />
      )}

      {/* Main Widget Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={dict.title}
        className={cn(
          'fixed inset-x-4 top-1/2 -translate-y-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:left-auto sm:right-24 z-50 w-auto sm:w-96 max-w-lg mx-auto sm:mx-0 transition-all duration-400',
          isOpen
            ? 'opacity-100 translate-x-0 scale-100'
            : 'opacity-0 translate-x-8 scale-95 pointer-events-none'
        )}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden max-h-[85vh] sm:max-h-none overflow-y-auto">
          <div className="relative">
            {/* Header */}
            <div className="bg-gray-50/80 p-4 sm:p-6 border-b border-gray-100">
              <div
                className={cn(
                  'flex items-center justify-between',
                  isRTL && 'flex-row-reverse'
                )}
              >
                <div
                  className={cn(
                    'flex items-center gap-2 sm:gap-3',
                    isRTL && 'flex-row-reverse'
                  )}
                >
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-teal-500 rounded-full" />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                      {dict.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      {dict.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  ref={firstFocusableRef}
                  onClick={attemptClose}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors duration-200 border border-gray-200"
                  aria-label={dict.closeAriaLabel}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* ─── Step: Type Selection ──────────────────────────── */}
              {step === 'type' && (
                <div className="space-y-3 sm:space-y-4">
                  <p
                    className={cn(
                      'text-gray-600 font-medium text-sm sm:text-base text-center mb-4 sm:mb-5',
                    )}
                  >
                    {dict.step_type_title}
                  </p>

                  {feedbackOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() =>
                        dispatch({
                          type: 'SET_FEEDBACK_TYPE',
                          feedbackType: option.type,
                        })
                      }
                      className={cn(
                        'w-full p-3 sm:p-4 rounded-xl bg-white border border-gray-150 transition-all duration-200 group flex items-center gap-3 sm:gap-4 hover:shadow-md hover:scale-[1.01]',
                        option.hoverBorder,
                        isRTL && 'flex-row-reverse'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200',
                          option.color
                        )}
                      >
                        <option.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div
                        className={cn(
                          'flex-1',
                          isRTL ? 'text-right' : 'text-left'
                        )}
                      >
                        <div className="font-medium text-gray-800 mb-0.5 text-sm sm:text-base">
                          {option.label}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* ─── Step: Form ────────────────────────────────────── */}
              {step === 'form' && (
                <div className="space-y-4 sm:space-y-5">
                  {/* Back button */}
                  <button
                    onClick={() =>
                      dispatch({ type: 'SET_STEP', step: 'type' })
                    }
                    className={cn(
                      'text-sm text-gray-500 hover:text-teal-600 flex items-center gap-2 transition-colors duration-200 group',
                      isRTL && 'flex-row-reverse'
                    )}
                  >
                    <span
                      className={cn(
                        'transition-transform',
                        isRTL
                          ? 'group-hover:-translate-x-1'
                          : 'group-hover:translate-x-1'
                      )}
                    >
                      {isRTL ? '\u2192' : '\u2190'}
                    </span>
                    {dict.cancelButton}
                  </button>

                  {/* Selected type indicator */}
                  {selectedOption && (
                    <div
                      className={cn(
                        'flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl border border-gray-100',
                        isRTL && 'flex-row-reverse'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center',
                          selectedOption.color
                        )}
                      >
                        <selectedOption.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div
                        className={cn(
                          'flex-1',
                          isRTL ? 'text-right' : 'text-left'
                        )}
                      >
                        <div className="font-medium text-gray-800 text-sm sm:text-base">
                          {selectedOption.label}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {selectedOption.description}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Textarea */}
                  <div>
                    <Textarea
                      value={content}
                      onChange={(e) =>
                        dispatch({
                          type: 'SET_CONTENT',
                          content: e.target.value,
                        })
                      }
                      placeholder={dict.placeholder}
                      maxLength={MAX_CHARS}
                      className={cn(
                        'min-h-[100px] sm:min-h-[120px] resize-none border border-gray-200 bg-white focus:bg-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 rounded-xl transition-all duration-200 placeholder:text-gray-400 text-sm sm:text-base',
                        isRTL ? 'text-right' : 'text-left'
                      )}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      required
                    />
                    {/* Character counter */}
                    <div
                      className={cn(
                        'flex justify-end mt-1.5',
                        isRTL && 'flex-row-reverse'
                      )}
                    >
                      <span
                        className={cn(
                          'text-xs',
                          isOverLimit
                            ? 'text-rose-500 font-medium'
                            : content.length > MAX_CHARS * 0.9
                              ? 'text-amber-500'
                              : 'text-gray-400'
                        )}
                      >
                        {charCountText}
                      </span>
                    </div>
                  </div>

                  {/* Attachment section */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (step === 'form' && isOpen) {
                            fileInputRef.current?.click();
                          }
                        }}
                        className="group px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-gray-200 hover:border-teal-300 rounded-xl transition-all duration-200 flex items-center gap-2 sm:gap-3 hover:shadow-sm w-full sm:w-auto"
                      >
                        <Paperclip className="w-4 h-4 text-gray-500 group-hover:text-teal-600 transition-colors duration-200" />
                        <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-teal-700 transition-colors duration-200">
                          {dict.attachScreenshot}
                        </span>
                      </button>

                      {screenshotPreview && (
                        <div className="flex items-center justify-center sm:justify-start">
                          <div className="relative group/preview">
                            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                              <img
                                src={screenshotPreview}
                                alt={dict.screenshotTooltip}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                dispatch({
                                  type: 'SET_SCREENSHOT',
                                  screenshot: null,
                                })
                              }
                              className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors duration-200"
                            >
                              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <p
                      className={cn(
                        'text-xs text-gray-400 flex items-center gap-1.5',
                        isRTL && 'flex-row-reverse'
                      )}
                    >
                      {dict.fileInstructions}
                    </p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      tabIndex={-1}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={attemptClose}
                      className="flex-1 hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base"
                    >
                      {dict.cancelButton}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        isSubmitting || !content.trim() || isOverLimit
                      }
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm sm:text-base"
                    >
                      {isSubmitting ? (
                        <div
                          className={cn(
                            'flex items-center gap-2',
                            isRTL && 'flex-row-reverse'
                          )}
                        >
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                          <span>{dict.submittingButton}</span>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'flex items-center gap-2',
                            isRTL && 'flex-row-reverse'
                          )}
                        >
                          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>{dict.submitButton}</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── Step: Success ─────────────────────────────────── */}
              {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-teal-500" />
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
                    {dict.successMessage}
                  </p>
                  <p className="text-sm text-gray-500">{dict.subtitle}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Confirm Close Dialog ─────────────────────────────── */}
        {showConfirmClose && (
          <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-6 text-center">
            <h4 className="text-lg font-bold text-gray-800 mb-2">
              {dict.confirmCloseTitle}
            </h4>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              {dict.confirmCloseMessage}
            </p>
            <div className="flex gap-3 w-full max-w-xs">
              <Button
                variant="ghost"
                onClick={confirmClose}
                className="flex-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                {dict.confirmCloseDiscard}
              </Button>
              <Button
                onClick={() => dispatch({ type: 'HIDE_CONFIRM_CLOSE' })}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {dict.confirmCloseKeepEditing}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FeedbackWidget;
