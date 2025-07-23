'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Icons
import {
  Camera,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  X,
  CheckCircle2, // New Icon
  MinusSquare, // New Icon
} from 'lucide-react';

// Types
import type { UserImage } from '@/types/next-auth';

interface PhotosSectionProps {
  images: UserImage[];
  isUploading: boolean;
  disabled?: boolean;
  maxImages?: number;
  onUpload: (files: File[]) => Promise<void>;
  onSetMain: (imageId: string) => Promise<void>;
  onDelete: (imageIds: string[]) => Promise<void>; // Changed to array
}

const PhotosSection: React.FC<PhotosSectionProps> = ({
  images,
  isUploading: isExternallyUploading,
  disabled = false,
  maxImages = 5,
  onUpload,
  onSetMain,
  onDelete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedViewerIndex, setSelectedViewerIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  
  // --- NEW --- State for selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());

  const isLoading = isExternallyUploading || isProcessing || uploadingFiles.length > 0;

  // --- File Handling and Upload ---

  const validateFiles = (files: FileList | File[]): { validFiles: File[]; errors: string[] } => {
    // (Implementation remains the same)
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles: File[] = [];
    const errors: string[] = [];
    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) { errors.push(`קובץ ${file.name}: סוג קובץ לא חוקי.`); return; }
      if (file.size > maxSize) { errors.push(`קובץ ${file.name}: הקובץ גדול מדי (מקסימום 5MB).`); return; }
      validFiles.push(file);
    });
    return { validFiles, errors };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // (Implementation remains the same)
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) { toast.error('הגעת למספר המקסימלי של תמונות.'); return; }
    if (files.length > remainingSlots) { toast.error(`ניתן להעלות עוד ${remainingSlots} תמונות בלבד.`); return; }
    if (isLoading) return;
    const { validFiles, errors } = validateFiles(files);
    if (errors.length > 0) { errors.forEach(error => toast.error(error)); }
    if (validFiles.length === 0) return;
    setUploadingFiles(validFiles.map(f => f.name));
    try {
      await onUpload(validFiles);
      toast.success(`${validFiles.length} תמונות הועלו בהצלחה!`);
    } catch (error) {
      console.error('Error during upload process:', error);
      toast.error('שגיאה בהעלאת התמונות.');
    } finally {
      setUploadingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (!isLoading && !disabled && images.length < maxImages) {
      fileInputRef.current?.click();
    }
  };

  // --- NEW --- Handlers for Selection Mode ---

  const handleToggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    setSelectedImageIds(new Set()); // Clear selection when toggling mode
  };

  const handleSelectAll = () => {
    if (selectedImageIds.size === images.length) {
      setSelectedImageIds(new Set()); // Deselect all
    } else {
      setSelectedImageIds(new Set(images.map(img => img.id))); // Select all
    }
  };
  
  const toggleImageSelection = (imageId: string) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  // --- UPDATED --- Image Click and Deletion Handlers ---

  const handleImageClick = (index: number) => {
    if (selectionMode) {
      toggleImageSelection(images[index].id);
    } else {
      setSelectedViewerIndex(index);
      setShowImageViewer(true);
    }
  };

  // Handles bulk deletion
  const handleBulkDelete = async () => {
    if (selectedImageIds.size === 0) {
      toast.info('יש לבחור לפחות תמונה אחת למחיקה.');
      return;
    }

    if (!window.confirm(`האם למחוק ${selectedImageIds.size} תמונות נבחרות? הפעולה אינה הפיכה.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await onDelete(Array.from(selectedImageIds));
      toast.success(`${selectedImageIds.size} תמונות נמחקו בהצלחה.`);
      setSelectionMode(false);
      setSelectedImageIds(new Set());
    } catch (error) {
      console.error('Error during bulk delete:', error);
      toast.error('שגיאה במחיקת התמונות.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Requests single image deletion
  const requestDelete = (imageId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (isLoading) return;
    setImageToDelete(imageId);
    setDeleteConfirmOpen(true);
  };
  
  // Confirms single image deletion from dialog
  const confirmDelete = async () => {
    if (!imageToDelete || isProcessing) return;
    setIsProcessing(true);
    try {
      await onDelete([imageToDelete]); // Pass as an array
      toast.success('התמונה נמחקה בהצלחה.');
      closeImageViewer();
      setDeleteConfirmOpen(false);
      setImageToDelete(null);
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('שגיאה במחיקת התמונה.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Viewer and Other Handlers ---

  const closeImageViewer = useCallback(() => {
    setShowImageViewer(false);
    setSelectedViewerIndex(null);
  }, []);

  const handleNextImage = useCallback(() => setSelectedViewerIndex(prev => (prev === null || prev >= images.length - 1) ? prev : prev + 1), [images.length]);
  const handlePreviousImage = useCallback(() => setSelectedViewerIndex(prev => (prev === null || prev <= 0) ? prev : prev - 1), []);

  const handleSetMainImage = async (imageId: string, showToast = true, event?: React.MouseEvent) => {
    // (Implementation remains the same)
    event?.stopPropagation();
    if (isLoading) return;
    const currentImage = images.find(img => img.id === imageId);
    if (!currentImage || currentImage.isMain) return;
    setIsProcessing(true);
    try {
      await onSetMain(imageId);
      if (showToast) toast.success('התמונה הראשית עודכנה.');
    } catch (error) {
      console.error('Error setting main image:', error);
      toast.error('שגיאה בעדכון התמונה הראשית.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleControlClick = (e: React.MouseEvent) => e.stopPropagation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showImageViewer) return;
      if (e.key === 'ArrowRight') handlePreviousImage();
      if (e.key === 'ArrowLeft') handleNextImage();
      if (e.key === 'Escape') closeImageViewer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImageViewer, handlePreviousImage, handleNextImage, closeImageViewer]);

  const getRemainingSlots = () => maxImages - images.length;

  return (
    <div dir="rtl" className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-gray-200/80">
        {!selectionMode ? (
          <>
            <div className="mb-3 sm:mb-0 text-right">
              <h2 className="text-xl font-semibold text-gray-800">תמונות פרופיל</h2>
              <p className="mt-1 text-sm text-gray-600">העלה עד {maxImages} תמונות. התמונה הראשית תוצג בכרטיס.</p>
              {uploadingFiles.length > 0 && <p className="mt-2 text-sm text-cyan-600 font-medium">מעלה {uploadingFiles.length} תמונות...</p>}
            </div>
            <div className="flex gap-2 self-end sm:self-center">
              {images.length > 0 && !disabled && (
                <Button variant="outline" onClick={handleToggleSelectionMode} className="rounded-full px-4 text-sm">
                  בחר למחיקה
                </Button>
              )}
              {!disabled && (
                <Button variant="outline" onClick={triggerFileInput} disabled={isLoading || images.length >= maxImages} className="rounded-full border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50/50 hover:border-cyan-400 transition-all duration-300 px-5 py-2.5 text-sm font-medium flex items-center gap-2">
                  {isExternallyUploading || uploadingFiles.length > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>העלאת תמונות</span>
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleToggleSelectionMode} className="rounded-full text-gray-600 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </Button>
              <span className="font-semibold text-gray-700">{selectedImageIds.size} תמונות נבחרו</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSelectAll} className="rounded-full px-4 text-sm">
                {selectedImageIds.size === images.length ? 'בטל הכל' : 'בחר הכל'}
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isProcessing || selectedImageIds.size === 0} className="rounded-full px-4 text-sm flex items-center gap-2">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                מחק נבחרים
              </Button>
            </div>
          </div>
        )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleFileSelect} disabled={isLoading || disabled || images.length >= maxImages} multiple />

      {/* Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={cn(
              'relative group aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-md transition-all duration-300 ease-in-out',
              selectionMode ? 'cursor-pointer' : 'cursor-pointer hover:shadow-lg',
              selectedImageIds.has(image.id) && 'ring-4 ring-offset-2 ring-cyan-500'
            )}
            onClick={() => handleImageClick(index)}
          >
            <Image
              src={getRelativeCloudinaryPath(image.url)}
              alt={`תמונת פרופיל ${index + 1}`}
              fill
              className={cn('object-cover transition-transform duration-300', !selectionMode && 'group-hover:scale-105')}
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              priority={index < 2}
            />

            {/* Selection Overlay */}
            {selectionMode && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
                  {selectedImageIds.has(image.id) 
                      ? <CheckCircle2 className="w-10 h-10 text-white drop-shadow-lg" />
                      : <MinusSquare className="w-10 h-10 text-white/70 drop-shadow-lg" />
                  }
              </div>
            )}

            {/* Controls Overlay (not in selection mode) */}
            {!disabled && !selectionMode && (
              <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity duration-200" onClick={handleControlClick}>
                <Button variant="secondary" size="icon" className={cn('w-8 h-8 rounded-full shadow-md border border-white/30 bg-black/40 text-white hover:bg-black/60 transition-colors', image.isMain ? 'cursor-default' : 'hover:text-yellow-300')} onClick={(e) => handleSetMainImage(image.id, true, e)} disabled={image.isMain || isLoading} title={image.isMain ? 'תמונה ראשית' : 'הפוך לתמונה ראשית'}>
                  <Star className={cn('w-4 h-4 transition-colors', image.isMain ? 'text-yellow-400 fill-yellow-400' : 'text-white')} />
                </Button>
                <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full shadow-md border border-white/30 bg-black/40 text-white hover:bg-red-600 hover:border-red-700 transition-colors" onClick={(e) => requestDelete(image.id, e)} disabled={isLoading} title="מחק תמונה">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Main Image Badge */}
            {image.isMain && !selectionMode && (
              <Badge className="absolute bottom-2 left-2 rounded-full px-2.5 py-0.5 text-xs font-medium shadow-md text-white bg-gradient-to-r from-cyan-500 to-pink-500 border-none">
                ראשי
              </Badge>
            )}
          </div>
        ))}

        {/* Upload Placeholder */}
        {!disabled && !selectionMode && images.length < maxImages && (
          <div onClick={triggerFileInput} className="flex flex-col items-center justify-center text-center p-4 aspect-square rounded-xl border-2 border-dashed border-cyan-300/70 bg-cyan-50/30 hover:bg-cyan-50/60 hover:border-cyan-400 transition-colors duration-300 cursor-pointer group">
            <Upload className="w-8 h-8 text-cyan-500 mb-2 transition-transform group-hover:scale-110" />
            <span className="text-sm font-medium text-cyan-700">העלאת תמונות</span>
            <span className="text-xs text-cyan-600/90 mt-1">עד {getRemainingSlots()} תמונות נוספות</span>
            <span className="text-xs text-cyan-500/80 mt-1">(בחר מספר קבצים)</span>
          </div>
        )}

        {/* Uploading Files Placeholders */}
        {uploadingFiles.map((_, index) => (
          <div key={`uploading-${index}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 shadow-md">
            <div className="absolute inset-0 flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-2" /><span className="text-xs text-gray-600 text-center px-2">מעלה...</span></div>
            <div className="absolute bottom-0 left-0 right-0 bg-cyan-500 h-1 animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Empty States */}
      {images.length === 0 && uploadingFiles.length === 0 && !disabled && !selectionMode && (
        <div className="text-center py-16 mt-6 bg-gradient-to-br from-cyan-50/20 to-pink-50/20 rounded-xl border border-dashed border-gray-300">
          <Camera className="w-12 h-12 mx-auto text-gray-400/80" />
          <p className="mt-4 text-gray-600 font-medium">אין עדיין תמונות בפרופיל</p>
          <p className="text-sm text-gray-500 mt-1 px-4">תמונות טובות הן הרושם הראשוני שלכם. כדאי להעלות תמונות.</p>
        </div>
      )}
      {images.length === 0 && disabled && (
         <div className="text-center py-16 mt-6 bg-gray-50/50 rounded-xl border border-gray-200">
           <Camera className="w-12 h-12 mx-auto text-gray-400" />
           <p className="mt-4 text-gray-500 font-medium">לא הועלו תמונות לפרופיל זה.</p>
         </div>
      )}

      {/* Delete Confirmation Dialog (for single delete) */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-none p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">אישור מחיקת תמונה</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">האם למחוק את התמונה לצמיתות? לא ניתן לשחזר פעולה זו.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:space-x-reverse gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isLoading} className="rounded-full px-5">ביטול</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isLoading} className="rounded-full px-5">
              {isProcessing ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Trash2 className="w-4 h-4 ml-2" />}
              <span>מחק</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      {/* (Viewer implementation remains the same) */}
      <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent className="p-0 m-0 w-screen h-screen max-w-none sm:max-w-full sm:h-full bg-black/90 backdrop-blur-sm border-none rounded-none flex items-center justify-center outline-none" aria-describedby={undefined}>
            <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-colors" onClick={closeImageViewer} aria-label="סגור תצוגת תמונה"><X className="w-6 h-6" /></Button>
            {selectedViewerIndex !== null && images[selectedViewerIndex] && (
                <div className="relative w-full h-full flex items-center justify-center">
                    <div className="relative w-[95%] h-[85%] sm:w-[90%] sm:h-[90%]"><Image src={getRelativeCloudinaryPath(images[selectedViewerIndex].url)} alt={`תצוגה מוגדלת של תמונה ${selectedViewerIndex + 1}`} fill className="object-contain select-none" sizes="90vw" priority /></div>
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {images.length > 1 && (<>
                            <Button variant="ghost" size="icon" className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-40 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-colors pointer-events-auto" onClick={(e) => { e.stopPropagation(); handlePreviousImage(); }} disabled={selectedViewerIndex === 0} aria-label="התמונה הקודמת"><ChevronRight className="w-7 h-7" /></Button>
                            <Button variant="ghost" size="icon" className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-40 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-colors pointer-events-auto" onClick={(e) => { e.stopPropagation(); handleNextImage(); }} disabled={selectedViewerIndex === images.length - 1} aria-label="התמונה הבאה"><ChevronLeft className="w-7 h-7" /></Button>
                        </>)}
                        {!disabled && (
                            <div className="absolute top-4 right-4 z-50 flex flex-col sm:flex-row gap-2 pointer-events-auto">
                                {!images[selectedViewerIndex].isMain && <Button variant="secondary" className="rounded-full bg-white/70 backdrop-blur-sm shadow-md hover:bg-white/90 text-gray-800 px-3 py-1.5 text-xs sm:text-sm border border-white/20 flex items-center gap-1.5" onClick={(e) => handleSetMainImage(images[selectedViewerIndex].id, true, e)} size="sm" disabled={isLoading}><Star className="w-4 h-4" /><span>הפוך לראשי</span></Button>}
                                <Button variant="destructive" className="rounded-full bg-red-600/80 hover:bg-red-700 text-white px-3 py-1.5 text-xs sm:text-sm shadow-md border-none flex items-center gap-1.5" onClick={(e) => requestDelete(images[selectedViewerIndex].id, e)} size="sm" disabled={isLoading}><Trash2 className="w-4 h-4" /><span>מחק תמונה</span></Button>
                            </div>
                        )}
                        {images.length > 0 && <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium select-none">{selectedViewerIndex + 1} / {images.length}</div>}
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotosSection;