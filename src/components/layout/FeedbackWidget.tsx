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
  ChevronRight,
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
      label: dict.types.suggestion,
      gradient: 'from-purple-400 to-purple-600',
      description: 'שתף רעיון לשיפור',
    },
    {
      type: 'BUG' as FeedbackType,
      icon: Bug,
      label: dict.types.bug,
      gradient: 'from-red-400 to-red-600',
      description: 'דווח על בעיה טכנית',
    },
    {
      type: 'POSITIVE' as FeedbackType,
      icon: ThumbsUp,
      label: dict.types.positive,
      gradient: 'from-green-400 to-green-600',
      description: 'משוב חיובי ומחמיא',
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
      {/* Floating Trigger Button */}
      <div className="fixed top-1/2 -translate-y-1/2 right-6 z-50">
        <div
          className={`relative transition-all duration-700 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        >
          <button
            onClick={() => setIsOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative w-14 h-14 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 flex items-center justify-center hover:scale-105 active:scale-95 overflow-hidden"
            aria-label={dict.openAriaLabel}
          >
            {/* Glass overlay */}
            <div className="absolute inset-0 bg-white/20 rounded-2xl backdrop-blur-sm" />

            {/* Main icon */}
            <MessageSquare
              className={`w-6 h-6 text-white relative z-10 transition-all duration-500 ${isHovered ? 'scale-110 rotate-12' : ''}`}
            />

            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400 to-pink-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />

            {/* Floating particles on hover */}
            {isHovered && (
              <>
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-pink-400 rounded-full animate-ping" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-300" />
              </>
            )}

            {/* Text label */}
            <div className="absolute left-full ml-3 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              {dict.tabLabel}
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-2 h-2 bg-white rotate-45" />
            </div>
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
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Ambient light effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 via-pink-400/20 to-purple-400/20 rounded-3xl blur-xl" />

          <div className="relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-pink-500/20 p-6 border-b border-white/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-pink-600 bg-clip-text text-transparent">
                      {dict.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {dict.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => resetState()}
                  className="w-8 h-8 rounded-full bg-white/50 hover:bg-white/70 flex items-center justify-center transition-colors duration-300 group"
                  aria-label="סגור"
                >
                  <X className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'type' && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <Sparkles className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                    <p className="text-gray-700 font-medium">איך נוכל לשפר?</p>
                  </div>

                  {feedbackOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => {
                        setFeedbackType(option.type);
                        setStep('form');
                      }}
                      className="w-full p-4 rounded-2xl bg-gradient-to-r from-gray-50/80 to-white/80 hover:from-white to-gray-50 border border-gray-100/50 hover:border-gray-200/50 transition-all duration-300 group flex items-center gap-4 hover:shadow-md hover:scale-[1.02]"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <option.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-medium text-gray-800 mb-1">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                      <div className="text-gray-400 group-hover:text-cyan-500 transition-colors">
                        <ChevronRight className="w-5 h-5" />
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
                            <selectedOption.icon className="w-5 h-5 text-white" />
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

                  {/* File Upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-gray-200 hover:bg-gray-50 transition-colors duration-300 flex items-center gap-2"
                      >
                        <Paperclip className="w-4 h-4" />
                        {dict.attachScreenshot}
                      </Button>

                      {screenshotPreview && (
                        <div className="flex items-center gap-2">
                          <div className="relative group">
                            <img
                              src={screenshotPreview}
                              alt="Screenshot preview"
                              className="w-12 h-12 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setScreenshot(null)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
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
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          שולח...
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
