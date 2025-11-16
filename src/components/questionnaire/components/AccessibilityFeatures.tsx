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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AccessibilityFeaturesDict } from '@/types/dictionary'; // Import dictionary type
import { useIsMobile } from '../hooks/useMediaQuery'; // <-- הוסף את הייבוא הזה

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface AccessibilityFeaturesProps {
  className?: string;
  isPanelOpen?: boolean;
  onPanelOpenChange?: (isOpen: boolean) => void;
  dict: AccessibilityFeaturesDict; // Use the specific dictionary type
}

interface AccessibilitySettings {
  fontScale: number;
  contrastMode: 'normal' | 'high' | 'dark';
  reducedMotion: boolean;
  readableMode: boolean;
  bigCursor: boolean;
  textReader: boolean;
  soundEnabled: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontScale: 1,
  contrastMode: 'normal',
  reducedMotion: false,
  readableMode: false,
  bigCursor: false,
  textReader: false,
  soundEnabled: true,
};

const getSettingName = (
  key: keyof AccessibilitySettings,
  dict: AccessibilityFeaturesDict
): string => {
  return dict.settingNames[key] || key;
};

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
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile(); // <-- הוסף את השורה הזו

  const showAccessibilityPanel =
    isPanelOpen !== undefined ? isPanelOpen : internalShowPanel;
  const setShowAccessibilityPanel = onPanelOpenChange || setInternalShowPanel;

  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    const htmlElement = document.documentElement;
    htmlElement.style.fontSize = `${settings.fontScale * 100}%`;
    htmlElement.classList.toggle(
      'high-contrast',
      settings.contrastMode === 'high'
    );
    htmlElement.classList.toggle('dark-mode', settings.contrastMode === 'dark');
    htmlElement.classList.toggle('reduce-motion', settings.reducedMotion);
    htmlElement.classList.toggle('readable-font', settings.readableMode);
    htmlElement.classList.toggle('big-cursor', settings.bigCursor);
    updateAccessibilityStyles();
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
  }, [settings]);

  const updateAccessibilityStyles = () => {
    const styleElement =
      document.getElementById('accessibility-styles') ||
      document.createElement('style');
    styleElement.id = 'accessibility-styles';
    styleElement.textContent = `
      .high-contrast { filter: contrast(1.5) brightness(1.1); }
      .dark-mode { filter: invert(1) hue-rotate(180deg); background: #1a1a1a !important; }
      .reduce-motion * { animation-duration: 0.001s !important; transition-duration: 0.001s !important; }
      .readable-font * { font-family: 'Arial', 'Helvetica', sans-serif !important; letter-spacing: 0.05em !important; word-spacing: 0.1em !important; line-height: 1.6 !important; }
      .big-cursor, .big-cursor * { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16"><circle fill="%23000" stroke="%23fff" stroke-width="2" cx="8" cy="8" r="6"/></svg>') 16 16, auto !important; }
      .accessibility-panel-enter { opacity: 0; transform: scale(0.95) translateY(10px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      .accessibility-panel-enter-active { opacity: 1; transform: scale(1) translateY(0); }
      .accessibility-panel-exit { opacity: 1; transform: scale(1) translateY(0); transition: all 0.2s ease-in; }
      .accessibility-panel-exit-active { opacity: 0; transform: scale(0.95) translateY(10px); }
      .accessibility-button { transition: all 0.3s ease; }
      .accessibility-button:hover { transform: scale(1.05); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); }
      .accessibility-button:active { transform: scale(0.95); }
      .toast-enter { opacity: 0; transform: translateY(20px) scale(0.9); transition: all 0.3s ease; }
      .toast-enter-active { opacity: 1; transform: translateY(0) scale(1); }
      .toast-exit { opacity: 1; transform: translateY(0) scale(1); transition: all 0.2s ease; }
      .toast-exit-active { opacity: 0; transform: translateY(20px) scale(0.9); }
      .pulse-animation { animation: pulse 2s infinite; }
      @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
      .setting-card { transition: all 0.2s ease; border-radius: 8px; }
      .setting-card:hover { background-color: rgba(59, 130, 246, 0.05); transform: translateX(-2px); }
    `;
    if (!document.getElementById('accessibility-styles')) {
      document.head.appendChild(styleElement);
    }
  };

  const showSuccessToast = useCallback((message: string) => {
    setShowToast({ message, type: 'success', visible: true });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  }, []);

  const playClickSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Could not play sound:', error);
    }
  }, []);

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

  const readSelectedText = useCallback((e: MouseEvent) => {
    const element = e.target as HTMLElement;
    if (element && element.textContent && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = element.textContent.trim();
      if (text && text.length > 0) {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const hebrewVoice = voices.find((voice) => voice.lang === 'he-IL');
        if (hebrewVoice) {
          utterance.voice = hebrewVoice;
          utterance.lang = 'he-IL';
        }
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, []);

  const toggleTextReader = useCallback(() => {
    const willBeActive = !settings.textReader;
    updateSetting('textReader', willBeActive);
    if (willBeActive) {
      document.addEventListener('click', readSelectedText);
      showSuccessToast(dict.toasts.readerEnabled);
    } else {
      document.removeEventListener('click', readSelectedText);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  }, [
    settings.textReader,
    updateSetting,
    readSelectedText,
    showSuccessToast,
    dict.toasts.readerEnabled,
  ]);

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(false);
    showSuccessToast(dict.toasts.settingsReset);
    if (settings.soundEnabled) playClickSound();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-accessibility-trigger]')) {
          setShowAccessibilityPanel(false);
        }
      }
    };
    if (showAccessibilityPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAccessibilityPanel, setShowAccessibilityPanel]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      document.removeEventListener('click', readSelectedText);
    };
  }, [readSelectedText]);

  const contrastOptions = [
    { key: 'normal' as const, icon: SunMedium },
    { key: 'high' as const, icon: Contrast },
    { key: 'dark' as const, icon: MoonStar },
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
    { key: 'motion' as const, setting: 'reducedMotion' as const, icon: Hand },
  ];

  return (
    <>
      <div
        className={cn(
          'fixed z-50 right-4',
          isMobile ? 'bottom-24' : 'bottom-4' // <-- התיקון נמצא כאן
        )}
      >
        <Button
          data-accessibility-trigger
          variant={showAccessibilityPanel ? 'default' : 'outline'}
          size="icon"
          className={cn(
            'accessibility-button rounded-full shadow-lg transition-all duration-300',
            'hover:shadow-xl bg-white border-2',
            showAccessibilityPanel
              ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
              : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
            hasChanges && 'ring-2 ring-blue-400 ring-opacity-50 ring-offset-2',
            className
          )}
          onClick={() => setShowAccessibilityPanel(!showAccessibilityPanel)}
          title={
            showAccessibilityPanel
              ? dict.triggerButton.close
              : dict.triggerButton.open
          }
        >
          <div className="relative">
            {showAccessibilityPanel ? (
              <X className="h-5 w-5" />
            ) : (
              <Accessibility className="h-5 w-5" />
            )}
            {hasChanges && !showAccessibilityPanel && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full pulse-animation" />
            )}
          </div>
        </Button>
      </div>

      {showAccessibilityPanel && (
        <div
          ref={panelRef}
          className={cn(
            'fixed z-40 bottom-20 right-4 max-w-sm w-[340px]',
            'accessibility-panel-enter accessibility-panel-enter-active'
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
                      <Sparkles className="h-3 w-3 mr-1" />
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
                />
                <p className="text-xs text-slate-500">
                  {dict.textSize.description}
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4 text-blue-500" />
                  {dict.displayMode.title}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {contrastOptions.map(({ key, icon: Icon }) => {
                    const optionDict = dict.contrastOptions[key];
                    return (
                      <Button
                        key={key}
                        variant={
                          settings.contrastMode === key ? 'default' : 'outline'
                        }
                        size="sm"
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
                          <div className="absolute top-1 right-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-200">
                <Label className="text-sm font-medium text-slate-700">
                  {dict.additionalSettings.title}
                </Label>
                {advancedOptions.map(({ key, setting, icon: Icon }) => {
                  const optionDict = dict.advancedOptions[key];
                  return (
                    <div
                      key={key}
                      className="setting-card flex items-center justify-between group p-3 rounded-lg"
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
                        onCheckedChange={(checked) => {
                          if (setting === 'textReader') toggleTextReader();
                          else updateSetting(setting, checked);
                        }}
                      />
                    </div>
                  );
                })}
              </div>

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

      {showToast.visible && (
        <div className="fixed bottom-4 left-4 z-50 toast-enter toast-enter-active">
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
