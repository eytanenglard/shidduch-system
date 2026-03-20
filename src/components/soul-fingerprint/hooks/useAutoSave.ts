import { useRef, useEffect, useCallback } from 'react';

export function useAutoSave(
  data: unknown,
  saveFn: () => Promise<void>,
  debounceMs = 2000
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const triggerSave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        await saveFn();
      } catch (err) {
        console.error('[AutoSave] Failed:', err);
      } finally {
        isSavingRef.current = false;
      }
    }, debounceMs);
  }, [saveFn, debounceMs]);

  // Trigger save whenever data changes
  useEffect(() => {
    triggerSave();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, triggerSave]);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      await saveFn();
    } catch (err) {
      console.error('[AutoSave] saveNow failed:', err);
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFn]);

  return { saveNow };
}
