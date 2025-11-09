// בקובץ: src/components/profile/sections/CvUploadSection.tsx

'use client';

import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, UploadCloud, Loader2, Trash2, CheckCircle } from 'lucide-react';
import type { CvSectionDict } from '@/types/dictionary'; // ייבוא הטיפוס החדש

interface CvUploadSectionProps {
  cvUrl: string | null | undefined;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  disabled?: boolean;
  dict: CvSectionDict; // שימוש בטיפוס המדויק
}

const CvUploadSection: React.FC<CvUploadSectionProps> = ({
  cvUrl,
  isUploading,
  onUpload,
  onDelete,
  disabled = false,
  dict,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const validateFile = (file: File): string | null => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return dict.toasts.invalidFileType;
    }
    if (file.size > maxSize) {
      return dict.toasts.fileTooLarge;
    }
    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      await onUpload(file);
      toast.success(dict.toasts.uploadSuccess);
    } catch (err) {
      console.error('CV Upload failed:', err);
      toast.error(dict.toasts.uploadError);
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (!isUploading && !isDeleting && !disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleDelete = async () => {
    if (isDeleting || disabled) return;
    setIsDeleting(true);
    try {
      await onDelete();
      toast.success(dict.toasts.deleteSuccess);
    } catch (err) {
        console.error('CV Deletion failed:', err);
        toast.error(dict.toasts.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  // ✨ פונקציה חכמה לחילוץ שם הקובץ מה-URL
  const getFileNameFromUrl = (url: string) => {
    try {
        // מפענח תווים מיוחדים ב-URL (כמו רווחים %20)
        const decodedUrl = decodeURIComponent(url);
        // לוקח את החלק האחרון של ה-URL אחרי ה-'/'
        const fileNameWithExtension = decodedUrl.split('/').pop()?.split('?')[0];
        // מסיר את התאריך והתווים הייחודיים שהוספנו
        const originalName = fileNameWithExtension?.replace(/-\d{13}$/, '');
        return originalName || 'cv-document';
    } catch {
        return 'cv-document'; // Fallback
    }
  }

  return (
    <div className="p-4 md:p-6 border-t border-gray-200/70">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelect}
        disabled={isUploading || isDeleting || disabled}
      />
      <h3 className="text-sm font-medium text-gray-700 mb-1">{dict.title}</h3>
      <p className="text-xs text-gray-500 mb-4">{dict.subtitle}</p>
      
      {isUploading ? (
        // --- מצב טעינה ---
        <div className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Loader2 className="w-5 h-5 text-cyan-600 animate-spin me-2" />
          <span className="text-sm font-medium text-cyan-700">{dict.uploading}</span>
        </div>
      ) : cvUrl ? (
        // --- ✨ מצב חדש: קובץ קיים ---
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-teal-50/60 border border-teal-200/80 rounded-lg">
          <div className="flex items-center mb-2 sm:mb-0">
            <CheckCircle className="w-5 h-5 text-teal-600 me-2 flex-shrink-0" />
            <div className='flex flex-col'>
                <a 
                  href={cvUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm font-medium text-gray-800 break-all hover:underline"
                  title="לחץ לצפייה בקובץ"
                >
                  {getFileNameFromUrl(cvUrl)}
                </a>
                <Badge variant="secondary" className="mt-1 w-fit bg-teal-100 text-teal-800 text-xs">
                  {dict.successBadge}
                </Badge>
            </div>
          </div>
          {!disabled && (
            <div className="flex gap-2 self-end sm:self-center">
              <Button size="sm" variant="outline" onClick={triggerFileInput} className="text-xs">
                {dict.replaceButton}
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              </Button>
            </div>
          )}
        </div>
      ) : (
        // --- מצב התחלתי: אין קובץ ---
        <div
          onClick={triggerFileInput}
          className={cn(
            'flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-300 rounded-lg transition-colors duration-200',
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-cyan-400 hover:bg-cyan-50/50 cursor-pointer'
          )}
        >
          <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm font-semibold text-cyan-700">{dict.uploadButton}</span>
          <span className="text-xs text-gray-500 mt-1">{dict.fileTypes}</span>
        </div>
      )}
    </div>
  );
};

export default CvUploadSection;