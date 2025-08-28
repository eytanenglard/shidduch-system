// src/components/FeedbackWidget/FeedbackWidget.tsx

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      {/* Floating Tab Button - NeshamaTech Style */}
      <div className="fixed top-1/2 -translate-y-1/2 right-0 z-50">
        <div
          className={`transition-all duration-700 ${isOpen ? 'translate-x-4 opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'}`}
        >
          <button
            onClick={() => setIsOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group relative text-white px-2 py-6 rounded-l-2xl shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col items-center justify-center min-h-[120px] hover:scale-105 active:scale-95 overflow-hidden bg-gradient-to-l from-teal-600 via-orange-500 to-amber-400 bg-size-200 hover:bg-pos-100 ${
              isHovered ? 'w-32' : 'w-12'
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
              <MessageSquare className="w-5 h-5 transition-all duration-300 mb-3 drop-shadow-sm" />

              {/* Text - NeshamaTech style */}
              {!isHovered ? (
                <span
                  className="text-sm font-bold tracking-wider transition-all duration-700 ease-in-out drop-shadow-sm"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                  }}
                >
                  {dict.tabLabel}
                </span>
              ) : (
                <span className="text-sm font-bold whitespace-nowrap transition-all duration-700 ease-in-out drop-shadow-sm">
                  {dict.tabLabel}
                </span>
              )}
            </div>

            {/* Animated glow effect - matches NeshamaTech style */}
            <div className="absolute -inset-1 bg-gradient-to-br from-teal-400 via-orange-400 to-amber-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-all duration-700" />

            {/* Floating particles on hover */}
            {isHovered && (
              <>
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-amber-400 rounded-full animate-ping shadow-lg" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-300 shadow-lg" />
                <div className="absolute top-1/2 -left-2 w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse delay-500 shadow-lg" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-500"
          onClick={() => resetState()}
        />
      )}

      {/* Main Widget */}
      <div
        className={`fixed top-1/2 -translate-y-1/2 right-24 z-50 w-96 transition-all duration-500 ${
          isOpen
            ? 'opacity-100 translate-x-0 scale-100'
            : 'opacity-0 translate-x-8 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Ambient light effect - NeshamaTech style */}
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-400/20 via-orange-400/20 to-amber-400/20 rounded-3xl blur-xl" />

          <div className="relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500/20 via-orange-500/15 to-amber-500/20 p-6 border-b border-white/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-teal-400 to-amber-400 rounded-full animate-pulse shadow-lg" />
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                      {dict.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {dict.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => resetState()}
                  className="w-8 h-8 rounded-full bg-white/50 hover:bg-white/70 flex items-center justify-center transition-all duration-300 group hover:scale-110"
                  aria-label={dict.closeAriaLabel}
                >
                  <X className="w-4 h-4 text-gray-600 group-hover:text-gray-800 transition-colors" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'type' && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <Sparkles className="w-8 h-8 text-transparent bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text mx-auto mb-2" />
                    <p className="text-gray-700 font-medium">
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
                      className="w-full p-4 rounded-2xl bg-gradient-to-r from-gray-50/80 to-white/80 hover:from-white to-gray-50 border border-gray-100/50 hover:border-orange-200/50 transition-all duration-300 group flex items-center gap-4 hover:shadow-md hover:scale-[1.02]"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <option.icon className="w-6 h-6 text-white drop-shadow-sm" />
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-medium text-gray-800 mb-1">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {step === 'form' && (
                <div className="space-y-6">
                  <button
                    onClick={() => setStep('type')}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 transition-colors duration-300 group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      ←
                    </span>
                    {dict.cancelButton}
                  </button>

                  {/* Selected type indicator */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50/80 to-white/80 rounded-xl border border-gray-100/50">
                    {(() => {
                      const selectedOption = feedbackOptions.find(
                        (option) => option.type === feedbackType
                      );
                      return selectedOption ? (
                        <>
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedOption.gradient} flex items-center justify-center shadow-md`}
                          >
                            <selectedOption.icon className="w-5 h-5 text-white drop-shadow-sm" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {selectedOption.label}
                            </div>
                            <div className="text-sm text-gray-500">
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
                    className="min-h-[120px] resize-none border-0 bg-gray-50/80 focus:bg-white rounded-2xl shadow-inner transition-all duration-300 placeholder:text-gray-400"
                    required
                  />

                  {/* Enhanced File Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 hover:border-orange-300 rounded-xl transition-all duration-300 flex items-center gap-3 hover:shadow-md hover:scale-[1.02] overflow-hidden"
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
                        <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700 transition-colors duration-300 relative z-10">
                          {dict.attachScreenshot}
                        </span>

                        {/* Hover indicator */}
                        <div className="w-2 h-2 bg-gradient-to-r from-teal-400 to-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                      </button>

                      {/* Enhanced Screenshot Preview */}
                      {screenshotPreview && (
                        <div className="flex items-center gap-3">
                          <div className="relative group/preview">
                            {/* Image container with enhanced styling */}
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-orange-200 shadow-lg bg-white">
                              <img
                                src={screenshotPreview}
                                alt="Screenshot preview"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/preview:scale-110"
                              />
                              {/* Overlay on hover */}
                              <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/20 transition-colors duration-300" />
                            </div>

                            {/* Enhanced remove button */}
                            <button
                              type="button"
                              onClick={() => setScreenshot(null)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 group/remove"
                            >
                              <X className="w-3 h-3 group-hover/remove:rotate-90 transition-transform duration-300" />
                              {/* Glow effect */}
                              <div className="absolute inset-0 bg-red-400 rounded-full blur opacity-0 group-hover/remove:opacity-50 transition-opacity duration-300" />
                            </button>

                            {/* File info tooltip */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                              {dict.screenshotTooltip}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upload instructions/status */}
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

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => resetState()}
                      className="flex-1 hover:bg-gray-100 transition-colors duration-300"
                    >
                      {dict.cancelButton}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !content.trim()}
                      className="flex-1 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          {dict.submittingButton}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 ml-2" />
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