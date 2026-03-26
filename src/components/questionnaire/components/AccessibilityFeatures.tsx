// src/components/questionnaire/components/AccessibilityFeatures.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accessibility,
  Plus,
  Minus,
  MoonStar,
  SunMedium,
  Type,
  MousePointer,
  Hand,
  Contrast,
  Speech,
  X,
  Settings,
  Volume2,
  VolumeX,
  Palette,
  Eye,
  RefreshCw,
  Check,
  Sparkles,
  Link2,
  ArrowUpDown,
  BookOpen,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AccessibilityFeaturesDict } from '@/types/dictionary';
import { useIsMobile } from '../hooks/useMediaQuery';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AccessibilityFeaturesProps {
  className?: string;
  isPanelOpen?: boolean;
  onPanelOpenChange?: (isOpen: boolean) => void;
  dict: AccessibilityFeaturesDict;
}

interface AccessibilitySettings {
  fontScale: number;
  lineHeight: number;
  contrastMode: 'normal' | 'high' | 'dark';
  reducedMotion: boolean;
  readableMode: boolean;
  dyslexiaFont: boolean;
  bigCursor: boolean;
  textReader: boolean;
  soundEnabled: boolean;
  highlightLinks: boolean;
  readingGuide: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

const defaultSettings: AccessibilitySettings = {
  fontScale: 1,
  lineHeight: 1.5,
  contrastMode: 'normal',
  reducedMotion: false,
  readableMode: false,
  dyslexiaFont: false,
  bigCursor: false,
  textReader: false,
  soundEnabled: true,
  highlightLinks: false,
  readingGuide: false,
  colorBlindMode: 'none',
};

// ---------------------------------------------------------------------------
// Singleton AudioContext – avoids hitting browser instance limit (~6)
// ---------------------------------------------------------------------------

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      sharedAudioCtx = new Ctor();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Injected CSS – built once, kept static
// ---------------------------------------------------------------------------

const STYLE_ELEMENT_ID = 'a11y-accessibility-styles';

function buildAccessibilityCSS(): string {
  return `
    /* Dark mode: counter-invert media & a11y panel so they look normal */
    .a11y-dark-mode img,
    .a11y-dark-mode video,
    .a11y-dark-mode picture,
    .a11y-dark-mode canvas,
    .a11y-dark-mode [data-a11y-panel],
    .a11y-dark-mode [data-accessibility-trigger] {
      filter: invert(1) hue-rotate(180deg);
    }
    /* Reduce motion */
    .a11y-reduce-motion *,
    .a11y-reduce-motion *::before,
    .a11y-reduce-motion *::after {
      animation-duration: 0.001s !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001s !important;
    }
    /* Readable font */
    .a11y-readable-font * {
      font-family: 'Arial', 'Helvetica', sans-serif !important;
      letter-spacing: 0.05em !important;
      word-spacing: 0.1em !important;
    }
    /* Dyslexia-friendly font */
    .a11y-dyslexia-font * {
      font-family: 'Comic Sans MS', 'Verdana', cursive !important;
      letter-spacing: 0.1em !important;
      word-spacing: 0.2em !important;
    }
    /* Custom line height (value comes from CSS variable) */
    .a11y-custom-line-height * {
      line-height: var(--a11y-line-height) !important;
    }
    /* Big cursor */
    .a11y-big-cursor,
    .a11y-big-cursor * {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16"><circle fill="%23000" stroke="%23fff" stroke-width="2" cx="8" cy="8" r="6"/></svg>') 16 16, auto !important;
    }
    /* Highlight links */
    .a11y-highlight-links a,
    .a11y-highlight-links [role="link"] {
      text-decoration: underline !important;
      text-underline-offset: 3px !important;
      outline: 2px solid currentColor !important;
      outline-offset: 2px !important;
      border-radius: 2px;
    }
  `;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getSettingName = (
  key: keyof AccessibilitySettings,
  dict: AccessibilityFeaturesDict
): string => {
  return dict.settingNames[key] || key;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AccessibilityFeatures({
  className,
  isPanelOpen,
  onPanelOpenChange,
  dict,
}: AccessibilityFeaturesProps) {
  const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings);
  const [internalShowPanel, setInternalShowPanel] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState<{
    message: string;
    type: 'success' | 'info';
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const readingGuideRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  const showAccessibilityPanel =
    isPanelOpen !== undefined ? isPanelOpen : internalShowPanel;
  const setShowAccessibilityPanel = onPanelOpenChange || setInternalShowPanel;

  // -----------------------------------------------------------------------
  // Load saved settings from localStorage (+ fix hasChanges accuracy)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem('accessibilitySettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged: AccessibilitySettings = { ...defaultSettings, ...parsed };
        setSettings(merged);
        setHasChanges(
          JSON.stringify(merged) !== JSON.stringify(defaultSettings)
        );
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    }
  }, []);

  // -----------------------------------------------------------------------
  // Apply settings to DOM
  // -----------------------------------------------------------------------
  useEffect(() => {
    const html = document.documentElement;

    // Font scale
    html.style.fontSize = `${settings.fontScale * 100}%`;

    // Line height CSS variable
    html.style.setProperty('--a11y-line-height', `${settings.lineHeight}`);

    // Combined filter: contrast + color blind mode
    // (must be a single filter string to avoid overwriting)
    const filters: string[] = [];
    if (settings.contrastMode === 'high') {
      filters.push('contrast(1.5)', 'brightness(1.1)');
    }
    if (settings.contrastMode === 'dark') {
      filters.push('invert(1)', 'hue-rotate(180deg)');
    }
    if (settings.colorBlindMode !== 'none') {
      filters.push(`url(#a11y-${settings.colorBlindMode})`);
    }
    html.style.filter = filters.length ? filters.join(' ') : '';

    // Toggle CSS classes for non-filter settings
    html.classList.toggle(
      'a11y-dark-mode',
      settings.contrastMode === 'dark'
    );
    html.classList.toggle('a11y-reduce-motion', settings.reducedMotion);
    html.classList.toggle(
      'a11y-readable-font',
      settings.readableMode && !settings.dyslexiaFont
    );
    html.classList.toggle('a11y-dyslexia-font', settings.dyslexiaFont);
    html.classList.toggle('a11y-big-cursor', settings.bigCursor);
    html.classList.toggle('a11y-highlight-links', settings.highlightLinks);
    html.classList.toggle(
      'a11y-custom-line-height',
      settings.lineHeight !== defaultSettings.lineHeight
    );

    // Inject / update style element
    let styleEl = document.getElementById(
      STYLE_ELEMENT_ID
    ) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = buildAccessibilityCSS();

    // Persist
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
  }, [settings]);

  // -----------------------------------------------------------------------
  // Cleanup injected style element on unmount
  // -----------------------------------------------------------------------
  useEffect(() => {
    return () => {
      document.getElementById(STYLE_ELEMENT_ID)?.remove();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Text reader – sync event listener with settings.textReader
  // (Fixes: listener now re-attaches after unmount/remount)
  // -----------------------------------------------------------------------
  const readSelectedText = useCallback((e: MouseEvent) => {
    const element = e.target as HTMLElement;
    if (element?.textContent && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = element.textContent.trim();
      if (text.length > 0) {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const hebrewVoice = voices.find((v) => v.lang === 'he-IL');
        if (hebrewVoice) {
          utterance.voice = hebrewVoice;
          utterance.lang = 'he-IL';
        }
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, []);

  useEffect(() => {
    if (settings.textReader) {
      document.addEventListener('click', readSelectedText);
    }
    return () => {
      document.removeEventListener('click', readSelectedText);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [settings.textReader, readSelectedText]);

  // -----------------------------------------------------------------------
  // Reading guide – follow mouse with a horizontal highlight bar
  // (Uses ref to avoid re-renders on mousemove)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!settings.readingGuide) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (readingGuideRef.current) {
        readingGuideRef.current.style.top = `${e.clientY - 20}px`;
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [settings.readingGuide]);

  // -----------------------------------------------------------------------
  // Focus trap + Escape key (WCAG: keyboard navigation)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!showAccessibilityPanel || !panelRef.current) return;

    // Auto-focus first focusable element after panel renders
    const timer = setTimeout(() => {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [role="switch"]'
      );
      focusable?.[0]?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAccessibilityPanel(false);
        triggerButtonRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      // Re-query on every Tab press so dynamically-enabled elements are caught
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [role="switch"]'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAccessibilityPanel, setShowAccessibilityPanel]);

  // -----------------------------------------------------------------------
  // Click outside to close
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!showAccessibilityPanel) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('[data-accessibility-trigger]')
      ) {
        setShowAccessibilityPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAccessibilityPanel, setShowAccessibilityPanel]);

  // -----------------------------------------------------------------------
  // Global keyboard shortcut: Alt+A (also Alt+ש on Hebrew keyboard)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (
        e.altKey &&
        (e.key === 'a' || e.key === 'A' || e.key === 'ש')
      ) {
        e.preventDefault();
        setShowAccessibilityPanel(!showAccessibilityPanel);
        if (showAccessibilityPanel) {
          triggerButtonRef.current?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [showAccessibilityPanel, setShowAccessibilityPanel]);

  // -----------------------------------------------------------------------
  // Sound (reuses singleton AudioContext)
  // -----------------------------------------------------------------------
  const playClickSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch {
      // Silently fail
    }
  }, []);

  // -----------------------------------------------------------------------
  // Toast
  // -----------------------------------------------------------------------
  const showSuccessToast = useCallback((message: string) => {
    setShowToast({ message, type: 'success', visible: true });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  }, []);

  // -----------------------------------------------------------------------
  // Update a single setting
  // -----------------------------------------------------------------------
  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K]
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      setHasChanges(true);
      if (settings.soundEnabled) playClickSound();
      const settingName = getSettingName(key, dict);
      showSuccessToast(
        dict.toasts.settingUpdated.replace('{{settingName}}', settingName)
      );
    },
    [settings.soundEnabled, playClickSound, dict, showSuccessToast]
  );

  // -----------------------------------------------------------------------
  // Reset all
  // -----------------------------------------------------------------------
  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(false);
    showSuccessToast(dict.toasts.settingsReset);
    if (settings.soundEnabled) playClickSound();
  };

  // -----------------------------------------------------------------------
  // Option configs
  // -----------------------------------------------------------------------
  const contrastOptions = [
    { key: 'normal' as const, icon: SunMedium },
    { key: 'high' as const, icon: Contrast },
    { key: 'dark' as const, icon: MoonStar },
  ];

  const colorBlindOptions = [
    { key: 'none' as const },
    { key: 'protanopia' as const },
    { key: 'deuteranopia' as const },
    { key: 'tritanopia' as const },
  ];

  const advancedOptions = [
    {
      key: 'sound' as const,
      setting: 'soundEnabled' as const,
      icon: settings.soundEnabled ? Volume2 : VolumeX,
    },
    { key: 'reader' as const, setting: 'textReader' as const, icon: Speech },
    {
      key: 'cursor' as const,
      setting: 'bigCursor' as const,
      icon: MousePointer,
    },
    { key: 'font' as const, setting: 'readableMode' as const, icon: Eye },
    {
      key: 'dyslexia' as const,
      setting: 'dyslexiaFont' as const,
      icon: BookOpen,
    },
    { key: 'motion' as const, setting: 'reducedMotion' as const, icon: Hand },
    {
      key: 'highlightLinks' as const,
      setting: 'highlightLinks' as const,
      icon: Link2,
    },
    {
      key: 'readingGuide' as const,
      setting: 'readingGuide' as const,
      icon: ArrowUpDown,
    },
  ];

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <>
      {/* SVG filters for color-blindness simulation */}
      <svg
        className="absolute w-0 h-0 overflow-hidden"
        aria-hidden="true"
      >
        <defs>
          <filter id="a11y-protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"
            />
          </filter>
          <filter id="a11y-deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"
            />
          </filter>
          <filter id="a11y-tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>

      {/* Reading guide – horizontal highlight bar that follows the mouse */}
      {settings.readingGuide && (
        <div
          ref={readingGuideRef}
          className="fixed inset-x-0 h-10 pointer-events-none z-[9999]"
          aria-hidden="true"
          style={{
            top: 0,
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(59,130,246,0.08) 35%, rgba(59,130,246,0.15) 50%, rgba(59,130,246,0.08) 65%, transparent 100%)',
          }}
        />
      )}

      {/* Trigger button */}
      <div
        className={cn(
          'fixed z-50 end-4',
          isMobile ? 'bottom-24' : 'bottom-4'
        )}
      >
        <Button
          ref={triggerButtonRef}
          data-accessibility-trigger
          variant={showAccessibilityPanel ? 'default' : 'outline'}
          size="icon"
          aria-expanded={showAccessibilityPanel}
          aria-controls="a11y-panel"
          aria-label={
            showAccessibilityPanel
              ? dict.triggerButton.close
              : dict.triggerButton.open
          }
          className={cn(
            'rounded-full shadow-lg transition-all duration-300',
            'hover:shadow-xl bg-white border-2',
            showAccessibilityPanel
              ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
              : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
            hasChanges &&
              'ring-2 ring-blue-400 ring-opacity-50 ring-offset-2',
            className
          )}
          onClick={() => setShowAccessibilityPanel(!showAccessibilityPanel)}
        >
          <div className="relative">
            {showAccessibilityPanel ? (
              <X className="h-5 w-5" />
            ) : (
              <Accessibility className="h-5 w-5" />
            )}
            {hasChanges && !showAccessibilityPanel && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
            )}
          </div>
        </Button>
      </div>

      {/* Panel */}
      {showAccessibilityPanel && (
        <div
          ref={panelRef}
          id="a11y-panel"
          role="dialog"
          aria-modal="true"
          aria-label={dict.panelTitle}
          data-a11y-panel
          className={cn(
            'fixed z-40 max-w-sm w-[340px] end-4',
            isMobile ? 'bottom-40' : 'bottom-20',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300'
          )}
        >
          <Card className="shadow-2xl border-2 border-blue-100 bg-white">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Settings className="h-4 w-4 text-blue-600" />
                  </div>
                  {dict.panelTitle}
                  {hasChanges && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Sparkles className="h-3 w-3 me-1" />
                      {dict.changedBadge}
                    </Badge>
                  )}
                </CardTitle>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {dict.panelSubtitle}
              </p>
            </CardHeader>

            <CardContent className="space-y-6 pt-5 max-h-[65vh] overflow-y-auto">
              {/* ===== Text Size ===== */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Type className="h-4 w-4 text-blue-500" />
                    {dict.textSize.title}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50 border-blue-200"
                      onClick={() =>
                        updateSetting(
                          'fontScale',
                          Math.max(0.8, settings.fontScale - 0.1)
                        )
                      }
                      disabled={settings.fontScale <= 0.8}
                      aria-label={`${dict.textSize.title} -`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Badge
                      variant="outline"
                      className="min-w-[55px] text-center font-mono bg-blue-50 border-blue-200"
                    >
                      {Math.round(settings.fontScale * 100)}%
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50 border-blue-200"
                      onClick={() =>
                        updateSetting(
                          'fontScale',
                          Math.min(1.6, settings.fontScale + 0.1)
                        )
                      }
                      disabled={settings.fontScale >= 1.6}
                      aria-label={`${dict.textSize.title} +`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Slider
                  value={[settings.fontScale * 100]}
                  min={80}
                  max={160}
                  step={5}
                  onValueChange={(value) =>
                    updateSetting('fontScale', value[0] / 100)
                  }
                  className="py-2"
                  aria-label={dict.textSize.title}
                />
                <p className="text-xs text-slate-500">
                  {dict.textSize.description}
                </p>
              </div>

              {/* ===== Line Height ===== */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-blue-500" />
                    {dict.lineHeight.title}
                  </Label>
                  <Badge
                    variant="outline"
                    className="min-w-[45px] text-center font-mono bg-blue-50 border-blue-200"
                  >
                    {settings.lineHeight.toFixed(1)}
                  </Badge>
                </div>
                <Slider
                  value={[settings.lineHeight * 10]}
                  min={12}
                  max={25}
                  step={1}
                  onValueChange={(value) =>
                    updateSetting('lineHeight', value[0] / 10)
                  }
                  className="py-2"
                  aria-label={dict.lineHeight.title}
                />
                <p className="text-xs text-slate-500">
                  {dict.lineHeight.description}
                </p>
              </div>

              {/* ===== Display Mode ===== */}
              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4 text-blue-500" />
                  {dict.displayMode.title}
                </Label>
                <div
                  className="grid grid-cols-3 gap-2"
                  role="radiogroup"
                  aria-label={dict.displayMode.title}
                >
                  {contrastOptions.map(({ key, icon: Icon }) => {
                    const optionDict = dict.contrastOptions[key];
                    return (
                      <Button
                        key={key}
                        variant={
                          settings.contrastMode === key ? 'default' : 'outline'
                        }
                        size="sm"
                        role="radio"
                        aria-checked={settings.contrastMode === key}
                        className={cn(
                          'h-14 flex flex-col gap-1 text-xs transition-all relative',
                          settings.contrastMode === key
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'hover:bg-blue-50 border-blue-200'
                        )}
                        onClick={() => updateSetting('contrastMode', key)}
                        title={optionDict.description}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{optionDict.label}</span>
                        {settings.contrastMode === key && (
                          <div className="absolute top-1 end-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* ===== Color Blind Mode ===== */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  {dict.colorBlindMode.title}
                </Label>
                <div
                  className="grid grid-cols-2 gap-2"
                  role="radiogroup"
                  aria-label={dict.colorBlindMode.title}
                >
                  {colorBlindOptions.map(({ key }) => {
                    const optionDict = dict.colorBlindOptions[key];
                    return (
                      <Button
                        key={key}
                        variant={
                          settings.colorBlindMode === key
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        role="radio"
                        aria-checked={settings.colorBlindMode === key}
                        className={cn(
                          'h-12 flex flex-col gap-0.5 text-xs transition-all relative',
                          settings.colorBlindMode === key
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'hover:bg-blue-50 border-blue-200'
                        )}
                        onClick={() => updateSetting('colorBlindMode', key)}
                        title={optionDict.description}
                      >
                        <span className="font-medium">{optionDict.label}</span>
                        {settings.colorBlindMode === key && (
                          <div className="absolute top-1 end-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* ===== Additional Tools ===== */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <Label className="text-sm font-medium text-slate-700">
                  {dict.additionalSettings.title}
                </Label>
                {advancedOptions.map(({ key, setting, icon: Icon }) => {
                  const optionDict = dict.advancedOptions[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between group p-3 rounded-lg hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            settings[setting]
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm font-medium cursor-pointer">
                            {optionDict.label}
                          </Label>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {optionDict.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings[setting]}
                        onCheckedChange={(checked) =>
                          updateSetting(setting, checked)
                        }
                        aria-label={optionDict.label}
                      />
                    </div>
                  );
                })}
              </div>

              {/* ===== Keyboard Shortcuts ===== */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Keyboard className="h-3.5 w-3.5 shrink-0" />
                  <span>{dict.keyboardShortcuts.title}:</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono border border-slate-200">
                    Alt+A
                  </kbd>
                  <span>{dict.keyboardShortcuts.toggle}</span>
                </div>
              </div>

              {/* ===== Reset ===== */}
              <div className="pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'w-full flex items-center gap-2 transition-all',
                    hasChanges
                      ? 'hover:bg-red-50 hover:border-red-200 hover:text-red-700'
                      : 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={resetSettings}
                  disabled={!hasChanges}
                >
                  <RefreshCw className="h-4 w-4" />
                  {dict.resetButton}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toast notification */}
      {showToast.visible && (
        <div
          className="fixed bottom-4 start-4 z-50 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
          role="status"
          aria-live="polite"
        >
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border border-green-500">
            <div className="p-1 bg-green-500 rounded-full">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-sm font-medium">{showToast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
