// src/components/messages/MediaPicker.tsx

'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Paperclip, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ==========================================
// Types
// ==========================================

interface MediaPickerProps {
  /** Callback when upload completes — returns the Cloudinary URL and content type */
  onUploadComplete: (result: { url: string; type: 'IMAGE' | 'VOICE' }) => void;
  /** RTL mode */
  isHe?: boolean;
  /** Disable the picker */
  disabled?: boolean;
  /** Additional class */
  className?: string;
}

// ==========================================
// i18n
// ==========================================

const dict = {
  he: {
    attachFile: 'צרף קובץ',
    uploading: 'מעלה...',
    uploadError: 'שגיאה בהעלאת הקובץ',
    fileTooLarge: 'הקובץ גדול מ-10MB',
    invalidFileType: 'סוג קובץ לא נתמך',
    cancel: 'ביטול',
  },
  en: {
    attachFile: 'Attach file',
    uploading: 'Uploading...',
    uploadError: 'File upload failed',
    fileTooLarge: 'File is larger than 10MB',
    invalidFileType: 'Unsupported file type',
    cancel: 'Cancel',
  },
};

// ==========================================
// Component
// ==========================================

export default function MediaPicker({
  onUploadComplete,
  isHe = false,
  disabled = false,
  className,
}: MediaPickerProps) {
  const t = isHe ? dict.he : dict.en;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];

  const handleClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = '';

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t.fileTooLarge);
      return;
    }

    // Validate file type
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      toast.error(t.invalidFileType);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contentType', 'IMAGE');

      // Simulate progress since fetch doesn't support upload progress natively
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 10;
        });
      }, 300);

      const res = await fetch('/api/messages/media', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t.uploadError);
      }

      setUploadProgress(100);

      const data = await res.json();
      onUploadComplete({ url: data.url, type: data.type });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Upload was cancelled by user
        return;
      }
      console.error('[MediaPicker] Upload error:', error);
      toast.error(t.uploadError);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {isUploading ? (
        <div className="flex items-center gap-2">
          <div className="w-24">
            <Progress value={uploadProgress} className="h-1.5" />
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleCancel}
            className="h-7 w-7 p-0"
            aria-label={t.cancel}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          disabled={disabled}
          className="h-8 w-8"
          aria-label={t.attachFile}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      )}
    </div>
  );
}
