'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '@/types/next-auth';

interface UseProfileFormOptions {
  /** Profile data from server */
  profile: UserProfile | null;
  /** Transform profile data into initial form state */
  initializeData: (profile: UserProfile) => Partial<UserProfile>;
  /** Called on save with the form data */
  onSave: (data: Partial<UserProfile>) => void;
  /** Control editing state externally */
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  /** Locale for direction derivation */
  locale: string;
  /** Optional validation before save — return error message to block, or null to proceed */
  validate?: (data: Partial<UserProfile>) => string | null;
  /** Optional transform applied to data before calling onSave */
  beforeSave?: (data: Partial<UserProfile>) => Partial<UserProfile>;
  /**
   * Enable auto-save drafts to localStorage.
   * Pass a unique key like 'profile' or 'preferences'.
   * The user ID is appended automatically.
   */
  draftKey?: string;
  /** Debounce delay for draft saves in ms (default: 2000) */
  draftDebounceMs?: number;
}

const DRAFT_PREFIX = 'neshamatech_draft_';

function getDraftStorageKey(draftKey: string, userId?: string): string {
  return `${DRAFT_PREFIX}${draftKey}_${userId || 'unknown'}`;
}

function saveDraft(key: string, data: Partial<UserProfile>): void {
  try {
    const payload = {
      data,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // localStorage might be full or unavailable — ignore silently
  }
}

function loadDraft(key: string): { data: Partial<UserProfile>; savedAt: string } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data && parsed.savedAt) {
      return parsed;
    }
  } catch {
    // Corrupted data — clear it
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
  return null;
}

function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch { /* ignore */ }
}

export function useProfileForm({
  profile,
  initializeData,
  onSave,
  isEditing,
  setIsEditing,
  locale,
  validate,
  beforeSave,
  draftKey,
  draftDebounceMs = 2000,
}: UseProfileFormOptions) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [initialData, setInitialData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);

  // UI state for floating button + portal
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const direction: 'rtl' | 'ltr' = locale === 'he' ? 'rtl' : 'ltr';

  // Draft storage key (includes user ID for multi-user safety)
  const storageKey = draftKey
    ? getDraftStorageKey(draftKey, profile?.userId)
    : null;

  // Scroll listener for floating button
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setShowFloatingBtn(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Warn before navigating away with unsaved changes
  useEffect(() => {
    if (!isEditing) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(formData) !== JSON.stringify(initialData)) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, formData, initialData]);

  // Stable reference to initializeData to avoid re-runs
  const initializeDataRef = useRef(initializeData);
  initializeDataRef.current = initializeData;

  // Initialize form data from profile
  useEffect(() => {
    setLoading(true);
    if (profile) {
      const data = initializeDataRef.current(profile);
      setFormData(data);
      setInitialData(data);
      setLoading(false);

      // Check for existing draft
      if (storageKey) {
        const draft = loadDraft(storageKey);
        if (draft) {
          setHasDraft(true);
        }
      }
    }
  }, [profile, storageKey]);

  // Auto-save draft when form data changes during editing
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  useEffect(() => {
    if (!storageKey || !isEditing) return;

    // Clear previous timer
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }

    // Debounced save
    draftTimerRef.current = setTimeout(() => {
      const current = formDataRef.current;
      // Only save if different from initial data
      if (JSON.stringify(current) !== JSON.stringify(initialData)) {
        saveDraft(storageKey, current);
      }
    }, draftDebounceMs);

    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
    };
  }, [formData, isEditing, storageKey, initialData, draftDebounceMs]);

  /** Restore draft data into the form */
  const restoreDraft = useCallback(() => {
    if (!storageKey) return;
    const draft = loadDraft(storageKey);
    if (draft) {
      setFormData(draft.data);
      setHasDraft(false);
      setIsEditing(true);
    }
  }, [storageKey, setIsEditing]);

  /** Dismiss draft without restoring */
  const dismissDraft = useCallback(() => {
    if (storageKey) {
      clearDraft(storageKey);
    }
    setHasDraft(false);
  }, [storageKey]);

  const handleCancel = useCallback(() => {
    setFormData(initialData);
    setIsEditing(false);
    // Clear draft on cancel
    if (storageKey) {
      clearDraft(storageKey);
    }
  }, [initialData, setIsEditing, storageKey]);

  const handleSave = useCallback(() => {
    // Run validation if provided
    if (validate) {
      const error = validate(formData);
      if (error) return error;
    }

    // Apply pre-save transform
    const dataToSave = beforeSave ? beforeSave({ ...formData }) : { ...formData };

    onSave(dataToSave);
    setIsEditing(false);
    setInitialData(dataToSave);

    // Clear draft on successful save
    if (storageKey) {
      clearDraft(storageKey);
    }

    return null;
  }, [formData, validate, beforeSave, onSave, setIsEditing, storageKey]);

  // Check if there are unsaved changes
  const hasChanges = useCallback(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  return {
    formData,
    setFormData,
    initialData,
    loading,
    direction,
    showFloatingBtn,
    mounted,
    handleSave,
    handleCancel,
    hasChanges,
    // Draft management
    hasDraft,
    restoreDraft,
    dismissDraft,
  };
}
