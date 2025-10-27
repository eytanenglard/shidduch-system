// src/components/questionnaire/hooks/useIdleTimeout.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseIdleTimeoutProps {
  onIdle: () => void;
  idleTimeSeconds?: number;
}

export function useIdleTimeout({ onIdle, idleTimeSeconds = 7200 }: UseIdleTimeoutProps) { // ברירת מחדל: שעתיים
  const [isIdle, setIsIdle] = useState(false);
  // --- This is the corrected line ---
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    // Clear any existing timer before starting a new one
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    
    timeoutId.current = setTimeout(() => {
      setIsIdle(true);
      onIdle();
    }, idleTimeSeconds * 1000);
  }, [idleTimeSeconds, onIdle]);

  const resetTimer = useCallback(() => {
    // The previous implementation was already correct, it just needed the right type
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    setIsIdle(false);
    startTimer();
  }, [startTimer]);

  const handleEvent = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // אירועים שיאפסו את הטיימר
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    
    // התחלת הטיימר הראשוני
    startTimer();

    // הוספת מאזינים
    events.forEach(event => window.addEventListener(event, handleEvent));

    // ניקוי
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach(event => window.removeEventListener(event, handleEvent));
    };
  }, [handleEvent, startTimer]);

  return { isIdle, resetTimer };
}