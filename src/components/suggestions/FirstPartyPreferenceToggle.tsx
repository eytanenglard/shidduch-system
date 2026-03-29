'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Bell, BellOff, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ToggleDict {
  label: string;
  enabledDesc: string;
  disabledDesc: string;
  encourageEnable: string;
  enabledToast: string;
  disabledToast: string;
  errorToast: string;
  infoTitle: string;
  infoItems: string[];
  infoFooter: string;
  infoAriaLabel: string;
}

interface FirstPartyPreferenceToggleProps {
  initialValue: boolean;
  locale: 'he' | 'en';
  dict: ToggleDict;
  className?: string;
}

const FirstPartyPreferenceToggle: React.FC<FirstPartyPreferenceToggleProps> = ({
  initialValue,
  locale,
  dict,
  className,
}) => {
  const [wantsToBeFirst, setWantsToBeFirst] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [hasSeenInfo, setHasSeenInfo] = useState(true);
  const infoRef = useRef<HTMLDivElement>(null);

  const isHe = locale === 'he';

  // Check if user has seen info before (pulse hint for new users)
  useEffect(() => {
    const key = 'neshamatech_auto_suggest_info_seen';
    if (!localStorage.getItem(key)) {
      setHasSeenInfo(false);
    }
  }, []);

  const markInfoSeen = useCallback(() => {
    localStorage.setItem('neshamatech_auto_suggest_info_seen', '1');
    setHasSeenInfo(true);
  }, []);

  // Close popover on outside click
  useEffect(() => {
    if (!showInfo) return;
    const handleClick = (e: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setShowInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showInfo]);

  const handleToggle = useCallback(
    async (newValue: boolean) => {
      if (isSaving) return;

      setIsSaving(true);
      const previousValue = wantsToBeFirst;
      setWantsToBeFirst(newValue);

      try {
        const response = await fetch('/api/profile/first-party-preference', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wantsToBeFirstParty: newValue }),
        });

        if (!response.ok) throw new Error('Failed to update');

        toast.success(newValue ? dict.enabledToast : dict.disabledToast);
      } catch {
        setWantsToBeFirst(previousValue);
        toast.error(dict.errorToast);
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, wantsToBeFirst, dict]
  );

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-100/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-200',
        className
      )}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Icon */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
        wantsToBeFirst
          ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-md shadow-teal-400/25'
          : 'bg-gray-100 text-gray-400'
      )}>
        {wantsToBeFirst ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      </div>

      {/* Label + Info */}
      <div className="flex-1 min-w-0 relative" ref={infoRef}>
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-700">
            {dict.label}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowInfo(!showInfo);
              if (!hasSeenInfo) markInfoSeen();
            }}
            className={cn(
              'transition-colors duration-200 flex-shrink-0 relative',
              showInfo ? 'text-violet-500' : 'text-gray-300 hover:text-violet-500'
            )}
            aria-label={dict.infoAriaLabel}
          >
            <Info className="w-3.5 h-3.5" />
            {/* Pulse hint for new users */}
            {!hasSeenInfo && !showInfo && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-500 animate-ping" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 leading-tight">
          {wantsToBeFirst ? dict.enabledDesc : dict.disabledDesc}
        </p>

        {/* Encourage text when disabled */}
        {!wantsToBeFirst && (
          <p className="text-[11px] text-violet-500/80 leading-tight mt-0.5">
            {dict.encourageEnable}
          </p>
        )}

        {/* Info popover */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'absolute top-full mt-2 z-50 w-72 max-w-[calc(100vw-3rem)] p-3.5 rounded-xl bg-white border border-violet-100 shadow-lg shadow-violet-500/10 text-xs leading-relaxed',
                isHe ? 'right-0 text-right' : 'left-0 text-left'
              )}
            >
              <p className="font-semibold text-violet-700 mb-1.5">
                {dict.infoTitle}
              </p>
              <div className="space-y-1 text-gray-600">
                {dict.infoItems.map((text, i) => (
                  <p key={i} className="flex items-start gap-1.5">
                    <span className="text-violet-400 font-bold mt-px flex-shrink-0">•</span>
                    <span>{text}</span>
                  </p>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 border-t border-gray-100 pt-2">
                {dict.infoFooter}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle switch */}
      <button
        onClick={() => handleToggle(!wantsToBeFirst)}
        disabled={isSaving}
        className={cn(
          'relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2',
          wantsToBeFirst
            ? 'bg-gradient-to-r from-teal-400 to-emerald-500 focus:ring-teal-400 shadow-inner'
            : 'bg-gray-300 focus:ring-gray-300',
          isSaving && 'opacity-60'
        )}
        aria-label={dict.label}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center',
            wantsToBeFirst && 'translate-x-5',
          )}
        >
          {isSaving && <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />}
        </span>
      </button>
    </div>
  );
};

export default FirstPartyPreferenceToggle;
