// src/components/questionnaire/hooks/useIdleTimeout.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseIdleTimeoutProps {
  onIdle: () => void;
  idleTimeSeconds?: number;
}

export function useIdleTimeout({ onIdle, idleTimeSeconds = 7200 }: UseIdleTimeoutProps) { // ברירת מחדל: שעתיים
  const [isIdle, setIsIdle] = useState(false);
  const timeoutId = useRef<NodeJS.Timeout>();

  const startTimer = useCallback(() => {
    timeoutId.current = setTimeout(() => {
      setIsIdle(true);
      onIdle();
    }, idleTimeSeconds * 1000);
  }, [idleTimeSeconds, onIdle]);

  const resetTimer = useCallback(() => {
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