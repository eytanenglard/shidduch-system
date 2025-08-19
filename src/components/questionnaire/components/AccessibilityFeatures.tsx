'use client';

import React, { useState, useEffect, useRef } from 'react';
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

// FIX: Teach TypeScript about the non-standard webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface AccessibilityFeaturesProps {
  className?: string;
  isPanelOpen?: boolean;
  onPanelOpenChange?: (isOpen: boolean) => void;
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

export default function AccessibilityFeatures({
  className,
  isPanelOpen,
  onPanelOpenChange,
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
  const toastTimeoutRef = useRef<NodeJS.Timeout>();

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

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    if (settings.soundEnabled) playClickSound();
    showSuccessToast(`הגדרת ${getSettingName(key)} עודכנה`);
  };

  const getSettingName = (key: keyof AccessibilitySettings): string => {
    const names = {
      fontScale: 'גודל הטקסט',
      contrastMode: 'מצב התצוגה',
      reducedMotion: 'הפחתת אנימציות',
      readableMode: 'פונט קריא',
      bigCursor: 'סמן גדול',
      textReader: 'הקראת תוכן',
      soundEnabled: 'צלילים',
    };
    return names[key] || key;
  };

  const showSuccessToast = (message: string) => {
    setShowToast({ message, type: 'success', visible: true });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  };

  const playClickSound = () => {
    try {
      // Get the correct AudioContext class, depending on the browser
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Browser does not support AudioContext.');
        return;
      }

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Browser does not support AudioContext.');
        return;
      }
      const audioContext = new AudioContextClass();

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
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(false);
    showSuccessToast('כל ההגדרות אופסו');
    if (settings.soundEnabled) playClickSound();
  };

  const toggleTextReader = () => {
    const willBeActive = !settings.textReader;
    updateSetting('textReader', willBeActive);
    if (willBeActive) {
      document.addEventListener('click', readSelectedText);
      showSuccessToast('הקראת תוכן הופעלה - לחץ על טקסט כדי להקריא');
    } else {
      document.removeEventListener('click', readSelectedText);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  };

  const readSelectedText = (e: MouseEvent) => {
    const element = e.target as HTMLElement;
    if (element && element.textContent && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = element.textContent.trim();
      if (text && text.length > 0) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // --- START OF UPGRADE ---
        // 1. Find an available Hebrew voice on the user's system.
        const voices = window.speechSynthesis.getVoices();
        const hebrewVoice = voices.find(voice => voice.lang === 'he-IL');

        // 2. If a Hebrew voice is found, use it.
        if (hebrewVoice) {
          utterance.voice = hebrewVoice;
          utterance.lang = 'he-IL';
        } 
        // 3. If not, don't specify language. Let the browser use its default voice.
        // This is better than silence, even if pronunciation is incorrect.
        
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
        // --- END OF UPGRADE ---
      }
    }
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
    };
  }, []);

  const contrastOptions: {
    value: AccessibilitySettings['contrastMode'];
    label: string;
    icon: React.ElementType;
    desc: string;
  }[] = [
    { value: 'normal', label: 'רגיל', icon: SunMedium, desc: 'מצב רגיל' },
    {
      value: 'high',
      label: 'ניגודיות',
      icon: Contrast,
      desc: 'ניגודיות גבוהה',
    },
    { value: 'dark', label: 'חשוך', icon: MoonStar, desc: 'מצב לילה' },
  ];

  const advancedOptions = [
    {
      key: 'soundEnabled' as const,
      label: 'צלילי משוב',
      icon: settings.soundEnabled ? Volume2 : VolumeX,
      description: 'השמע צלילים קצרים על פעולות ושינויים',
    },
    {
      key: 'textReader' as const,
      label: 'הקראת תוכן',
      icon: Speech,
      description: 'לחץ על כל טקסט באתר כדי להקריא אותו בקול',
    },
    {
      key: 'bigCursor' as const,
      label: 'סמן עכבר גדול',
      icon: MousePointer,
      description: 'סמן עכבר מוגדל ובולט יותר',
    },
    {
      key: 'readableMode' as const,
      label: 'פונט קריא',
      icon: Eye,
      description: 'פונט ברור עם ריווח מוגדל בין האותיות',
    },
    {
      key: 'reducedMotion' as const,
      label: 'הפחתת אנימציות',
      icon: Hand,
      description: 'מפחית תנועות ואנימציות ברחבי האתר',
    },
  ];

  return (
    <>
      <div className="fixed z-50 bottom-4 right-4">
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
            showAccessibilityPanel ? 'סגור הגדרות נגישות' : 'פתח הגדרות נגישות'
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
                  הגדרות נגישות
                  {hasChanges && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      שונה
                    </Badge>
                  )}
                </CardTitle>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                התאם את האתר לצרכיך האישיים
              </p>
            </CardHeader>

            <CardContent className="space-y-6 pt-5 max-h-[65vh] overflow-y-auto">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Type className="h-4 w-4 text-blue-500" />
                    גודל טקסט
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
                  הגדל או הקטן את גודל הטקסט בכל האתר
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4 text-blue-500" />
                  מצב תצוגה ונגישות
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {contrastOptions.map(({ value, label, icon: Icon, desc }) => (
                    <Button
                      key={value}
                      variant={
                        settings.contrastMode === value ? 'default' : 'outline'
                      }
                      size="sm"
                      className={cn(
                        'h-14 flex flex-col gap-1 text-xs transition-all relative',
                        settings.contrastMode === value
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'hover:bg-blue-50 border-blue-200'
                      )}
                      onClick={() => updateSetting('contrastMode', value)}
                      title={desc}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{label}</span>
                      {settings.contrastMode === value && (
                        <div className="absolute top-1 right-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-200">
                <Label className="text-sm font-medium text-slate-700">
                  הגדרות נוספות
                </Label>
                {advancedOptions.map(
                  ({ key, label, icon: Icon, description }) => (
                    <div
                      key={key}
                      className="setting-card flex items-center justify-between group p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            settings[key]
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm font-medium cursor-pointer">
                            {label}
                          </Label>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings[key]}
                        onCheckedChange={(checked) => {
                          if (key === 'textReader') toggleTextReader();
                          else updateSetting(key, checked);
                        }}
                      />
                    </div>
                  )
                )}
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
                  איפוס כל ההגדרות
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
