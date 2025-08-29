'use client';

import React, { useState, useRef, useEffect, Fragment } from 'react';
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
  Image as ImageIcon,
  Send,
  Sparkles,
} from 'lucide-react';
import type { FeedbackWidgetDict } from '@/types/dictionary';

interface FeedbackWidgetProps {
  dict: FeedbackWidgetDict;
}

type FeedbackType = 'SUGGESTION' | 'BUG' | 'POSITIVE';

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ dict }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [content, setContent] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [isPermanentlyHidden, setIsPermanentlyHidden] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load hidden state from localStorage on mount
  useEffect(() => {
    const hidden = localStorage.getItem('feedback-widget-hidden');
    if (hidden === 'true') {
      setIsPermanentlyHidden(true);
    }
  }, []);

  const feedbackOptions = [
    {
      type: 'SUGGESTION' as FeedbackType,
      icon: Lightbulb,
      label: dict.types.suggestion.label,
      description: dict.types.suggestion.description,
      gradient: 'from-teal-400 via-orange-400 to-amber-400',
    },
    {
      type: 'BUG' as FeedbackType,
      icon: Bug,
      label: dict.types.bug.label,
      description: dict.types.bug.description,
      gradient: 'from-red-400 via-orange-400 to-pink-400',
    },
    {
      type: 'POSITIVE' as FeedbackType,
      icon: ThumbsUp,
      label: dict.types.positive.label,
      description: dict.types.positive.description,
      gradient: 'from-teal-400 via-green-400 to-amber-400',
    },
  ];

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe) {
      handleHidePermanently();
    }
  };

  // Function to hide widget permanently
  const handleHidePermanently = () => {
    setIsPermanentlyHidden(true);
    localStorage.setItem('feedback-widget-hidden', 'true');
  };

  // Function to show widget again
  const handleShowWidget = () => {
    setIsPermanentlyHidden(false);
    localStorage.setItem('feedback-widget-hidden', 'false');
  };

  useEffect(() => {
    if (screenshot) {
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(screenshot);
    } else {
      setScreenshotPreview(null);
    }
  }, [screenshot]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(dict.toasts.imageTooLarge);
        return;
      }
      setScreenshot(file);
    }
    if (event.target) event.target.value = '';
  };

  const resetState = (closeWidget: boolean = true) => {
    if (closeWidget) {
      setIsOpen(false);
      setTimeout(() => {
        setStep('type');
        setFeedbackType(null);
        setContent('');
        setScreenshot(null);
        setScreenshotPreview(null);
      }, 300);
    } else {
      setStep('type');
      setFeedbackType(null);
      setContent('');
      setScreenshot(null);
      setScreenshotPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !feedbackType) {
      toast.error(dict.toasts.contentRequired);
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('content', content);
    formData.append('feedbackType', feedbackType);
    formData.append('pageUrl', window.location.href);
    if (screenshot) {
      formData.append('screenshot', screenshot);
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      toast.success(dict.toasts.submitSuccess);
      resetState();
    } catch (error) {
      console.error(error);
      toast.error(dict.toasts.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Fragment>
      {/* Floating Tab Button - Responsive */}
      <div className="fixed top-1/2 -translate-y-1/2 right-0 z-50">
        <div
          className={`transition-all duration-700 ${
            isOpen || isPermanentlyHidden
              ? 'translate-x-4 opacity-0 scale-95'
              : 'translate-x-0 opacity-100 scale-100'
          }`}
        >
          <div className="relative group">
            <button
              onClick={() => setIsOpen(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className={`relative text-white px-1.5 sm:px-2 py-4 sm:py-6 rounded-l-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] hover:scale-105 active:scale-95 overflow-hidden bg-gradient-to-l from-teal-600 via-orange-500 to-amber-400 bg-size-200 hover:bg-pos-100 ${
                isHovered ? 'w-20 sm:w-32' : 'w-8 sm:w-12'
              }`}
              style={{
                backgroundSize: '200% 100%',
                backgroundPosition: isHovered ? '100% 0' : '0% 0',
              }}
              aria-label={dict.openAriaLabel}
            >
              {/* Glass overlay */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

              {/* Content container */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                {/* Icon */}
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 mb-2 sm:mb-3 drop-shadow-sm" />

                {/* Text - Mobile optimized */}
                {!isHovered ? (
                  <span
                    className="text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 ease-in-out drop-shadow-sm"
                    style={{
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                    }}
                  >
                    {dict.tabLabel}
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 ease-in-out drop-shadow-sm px-1">
                    {dict.tabLabel}
                  </span>
                )}
              </div>

              {/* Animated glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-br from-teal-400 via-orange-400 to-amber-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-all duration-300" />

              {/* Floating particles on hover */}
              {isHovered && (
                <>
                  <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-amber-400 rounded-full animate-ping shadow-lg" />
                  <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-teal-400 rounded-full animate-bounce delay-300 shadow-lg" />
                  <div className="absolute top-1/2 -left-1 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-400 rounded-full animate-pulse delay-500 shadow-lg" />
                </>
              )}
            </button>

            {/* Close button (X) - Both mobile and desktop */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleHidePermanently();
              }}
              className="absolute -top-2 -left-2 w-6 h-6 bg-white/90 hover:bg-red-500 text-gray-600 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 group/close opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-gray-200 z-20"
              aria-label="הסתר כפתור פידבק"
            >
              <X className="w-3 h-3 group-hover/close:rotate-45 transition-all duration-300" />
            </button>
          </div>
        </div>

        {/* Show button when permanently hidden */}
        {isPermanentlyHidden && (
          <div className="transition-all duration-700 opacity-100 translate-x-0">
            <button
              onClick={handleShowWidget}
              className="w-8 h-8 bg-gradient-to-r from-teal-500 to-amber-500 hover:from-teal-600 hover:to-amber-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group/show"
              aria-label="הצג כפתור משוב"
              title="הצג כפתור משוב"
            >
              <MessageSquare className="w-4 h-4 group-hover/show:scale-110 transition-transform duration-300" />
              {/* Subtle pulse ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-amber-400 animate-ping opacity-20"></div>
            </button>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-500"
          onClick={() => resetState()}
        />
      )}

      {/* Main Widget - Responsive */}
      <div
        className={`fixed inset-x-4 top-1/2 -translate-y-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:right-16 sm:left-auto sm:right-24 z-50 w-auto sm:w-96 max-w-lg mx-auto sm:mx-0 transition-all duration-500 ${
          isOpen
            ? 'opacity-100 translate-x-0 scale-100'
            : 'opacity-0 translate-x-8 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/50 overflow-hidden max-h-[85vh] sm:max-h-none overflow-y-auto">
          {/* Ambient light effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-400/20 via-orange-400/20 to-amber-400/20 rounded-2xl sm:rounded-3xl blur-xl" />

          <div className="relative">
            {/* Header - Mobile optimized */}
            <div className="bg-gradient-to-r from-teal-500/20 via-orange-500/15 to-amber-500/20 p-4 sm:p-6 border-b border-white/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-teal-400 to-amber-400 rounded-full animate-pulse shadow-lg" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-teal-600 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                      {dict.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {dict.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => resetState()}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/50 hover:bg-white/70 flex items-center justify-center transition-all duration-300 group hover:scale-110"
                  aria-label={dict.closeAriaLabel}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 group-hover:text-gray-800 transition-colors" />
                </button>
              </div>
            </div>

            {/* Content - Mobile optimized */}
            <div className="p-4 sm:p-6">
              {step === 'type' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-center mb-4 sm:mb-6">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-transparent bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text mx-auto mb-2" />
                    <p className="text-gray-700 font-medium text-sm sm:text-base">
                      {dict.step_type_title}
                    </p>
                  </div>

                  {feedbackOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => {
                        setFeedbackType(option.type);
                        setStep('form');
                      }}
                      className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-gray-50/80 to-white/80 hover:from-white to-gray-50 border border-gray-100/50 hover:border-orange-200/50 transition-all duration-300 group flex items-center gap-3 sm:gap-4 hover:shadow-md hover:scale-[1.02]"
                    >
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <option.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-sm" />
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-medium text-gray-800 mb-1 text-sm sm:text-base">
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

              {step === 'form' && (
                <div className="space-y-4 sm:space-y-6">
                  <button
                    onClick={() => setStep('type')}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 transition-colors duration-300 group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      ←
                    </span>
                    {dict.cancelButton}
                  </button>

                  {/* Selected type indicator - Mobile optimized */}
                  <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gradient-to-r from-gray-50/80 to-white/80 rounded-lg sm:rounded-xl border border-gray-100/50">
                    {(() => {
                      const selectedOption = feedbackOptions.find(
                        (option) => option.type === feedbackType
                      );
                      return selectedOption ? (
                        <>
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${selectedOption.gradient} flex items-center justify-center shadow-md`}
                          >
                            <selectedOption.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 text-sm sm:text-base">
                              {selectedOption.label}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {selectedOption.description}
                            </div>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>

                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={dict.placeholder}
                    className="min-h-[100px] sm:min-h-[120px] resize-none border-0 bg-gray-50/80 focus:bg-white rounded-xl sm:rounded-2xl shadow-inner transition-all duration-300 placeholder:text-gray-400 text-sm sm:text-base"
                    required
                  />

                  {/* File Upload Section - Mobile optimized */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 hover:border-orange-300 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center gap-2 sm:gap-3 hover:shadow-md hover:scale-[1.02] overflow-hidden w-full sm:w-auto"
                      >
                        {/* Background animation */}
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-50/50 via-orange-50/30 to-amber-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Icon with animation */}
                        <div className="relative">
                          <Paperclip className="w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-all duration-300 group-hover:rotate-12" />
                          {/* Pulse ring on hover */}
                          <div className="absolute inset-0 border-2 border-orange-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                        </div>

                        {/* Text */}
                        <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-orange-700 transition-colors duration-300 relative z-10">
                          {dict.attachScreenshot}
                        </span>

                        {/* Hover indicator */}
                        <div className="w-2 h-2 bg-gradient-to-r from-teal-400 to-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                      </button>

                      {/* Screenshot Preview - Mobile optimized */}
                      {screenshotPreview && (
                        <div className="flex items-center justify-center sm:justify-start">
                          <div className="relative group/preview">
                            {/* Image container */}
                            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border-2 border-orange-200 shadow-lg bg-white">
                              <img
                                src={screenshotPreview}
                                alt="Screenshot preview"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/preview:scale-110"
                              />
                              {/* Overlay on hover */}
                              <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/20 transition-colors duration-300" />
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => setScreenshot(null)}
                              className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 group/remove"
                            >
                              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover/remove:rotate-90 transition-transform duration-300" />
                              {/* Glow effect */}
                              <div className="absolute inset-0 bg-red-400 rounded-full blur opacity-0 group-hover/remove:opacity-50 transition-opacity duration-300" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upload instructions */}
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-teal-400 to-amber-400 rounded-full" />
                      <span>{dict.fileInstructions}</span>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                  </div>

                  {/* Action Buttons - Mobile optimized */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => resetState()}
                      className="flex-1 hover:bg-gray-100 transition-colors duration-300 text-sm sm:text-base"
                    >
                      {dict.cancelButton}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !content.trim()}
                      className="flex-1 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm sm:text-base"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin ml-2" />
                          {dict.submittingButton}
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                          {dict.submitButton}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default FeedbackWidget;
