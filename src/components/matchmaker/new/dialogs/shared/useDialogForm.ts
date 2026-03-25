'use client';

import { useState, useCallback, useRef } from 'react';

interface UseDialogFormReturn<T> {
  values: T;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  isSubmitting: boolean;
  error: string | null;
  handleSubmit: () => Promise<void>;
  isDirty: boolean;
  reset: (newInitial?: T) => void;
}

export function useDialogForm<T extends Record<string, unknown>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
): UseDialogFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialRef = useRef<T>(initialValues);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialRef.current);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit]);

  const reset = useCallback((newInitial?: T) => {
    const resetTo = newInitial ?? initialRef.current;
    if (newInitial) {
      initialRef.current = newInitial;
    }
    setValues(resetTo);
    setError(null);
    setIsSubmitting(false);
  }, []);

  return {
    values,
    setValues,
    updateField,
    isSubmitting,
    error,
    handleSubmit,
    isDirty,
    reset,
  };
}
