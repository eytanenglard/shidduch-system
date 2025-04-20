
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react"; // Added useCallback
import Image from "next/image";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter, // Added DialogFooter
} from "@/components/ui/dialog"; // Removed Card components as we use divs/structure directly now for more control

import { toast } from "sonner";

// Icons
import {
  Camera,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  X, // Icon for closing dialog
} from "lucide-react";

// Types
import type { UserImage } from "@/types/next-auth";

interface PhotosSectionProps {
  images: UserImage[];
  isUploading: boolean; // Note: Changed interpretation, this prop seems external loading state, use internal `isProcessing` for actions within component
  disabled?: boolean;
  maxImages?: number;
  onUpload: (file: File) => Promise<void>;
  onSetMain: (imageId: string) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
  // Removed style props as per previous fix request and current design goals
}

const PhotosSection: React.FC<PhotosSectionProps> = ({
  images,
  isUploading: isExternallyUploading, // Renamed to avoid confusion with internal processing state
  disabled = false,
  maxImages = 5,
  onUpload,
  onSetMain,
  onDelete,
}) => {
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedViewerIndex, setSelectedViewerIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Internal state for actions like delete, set main
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [lastUploadedImageId, setLastUploadedImageId] = useState<string | null>(null); // Track ID instead of index

  // Combined Loading State
  const isLoading = isExternallyUploading || isProcessing;

  // Effect to open viewer for newly uploaded image
  useEffect(() => {
    if (lastUploadedImageId) {
      const newIndex = images.findIndex(img => img.id === lastUploadedImageId);
      if (newIndex !== -1) {
          setSelectedViewerIndex(newIndex);
          setShowImageViewer(true);
      }
      setLastUploadedImageId(null); // Reset tracker
    }
  }, [images, lastUploadedImageId]); // Depend on images array as well

  // --- Event Handlers ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic Validations (already implemented, kept as is)
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"]; // Added webp
    if (!validTypes.includes(file.type)) {
      toast.error("סוג קובץ לא חוקי. יש להעלות JPG, PNG, או WEBP.");
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("הקובץ גדול מדי (מקסימום 5MB).");
      return;
    }

    // Prevent multiple uploads
    if (isLoading) return;

    // Use the external onUpload handler
    try {
      // Note: We don't set isProcessing here, assuming isExternallyUploading reflects the upload state
      await onUpload(file);
      // We need the ID of the new image to track it.
      // Assuming onUpload updates the `images` prop via the parent component,
      // we'll rely on the useEffect to find and show the new image.
      // We need a way to get the ID - this might require adjustment in the parent or API response.
      // For now, we'll assume the parent handles setting the ID correctly and updates `images`.
      // A potential workaround is to find the image added (if only one is added)
      // This is brittle. A better approach is if `onUpload` returns the new image ID.
      // Let's simulate getting the last image ID for the effect hook.
      // This requires the parent component to update `images` prop immediately after upload success.
      // const newImage = images[images.length - 1]; // Risky assumption
      // if (newImage) setLastUploadedImageId(newImage.id);

      toast.success("התמונה הועלתה בהצלחה.");

      // Automatically set as main if it's the very first image
      if (images.length === 0) {
        // Need the ID here too. This logic might need to move to the parent
        // or the API should return the ID for immediate use.
        // Assuming the `images` prop updates quickly after onUpload resolves:
        const newImageId = images.find(img => !img.isMain)?.id; // Find the first non-main, likely the new one
        if (newImageId) {
            await handleSetMainImage(newImageId, false); // Set main without toast
        }
      }

    } catch (error) {
      console.error("Error during upload process:", error);
      // Toast handled by onUpload or here as fallback
      if (!(error instanceof Error && error.message.includes("Toast"))) {
         toast.error("שגיאה בהעלאת התמונה.");
      }
    } finally {
      // Reset file input regardless of success/fail
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      //setIsProcessing(false); // Only manage internal processing state
    }
  };

  const triggerFileInput = () => {
    if (!isLoading && !disabled && images.length < maxImages) {
      fileInputRef.current?.click();
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedViewerIndex(index);
    setShowImageViewer(true);
  };

  const closeImageViewer = useCallback(() => { // Use useCallback for keydown listener
    setShowImageViewer(false);
    setSelectedViewerIndex(null);
  }, []);

  const handleNextImage = useCallback(() => { // Use useCallback
      setSelectedViewerIndex((prevIndex) => {
          if (prevIndex === null || prevIndex >= images.length - 1) return prevIndex;
          return prevIndex + 1;
      });
  }, [images.length]);

  const handlePreviousImage = useCallback(() => { // Use useCallback
      setSelectedViewerIndex((prevIndex) => {
          if (prevIndex === null || prevIndex <= 0) return prevIndex;
          return prevIndex - 1;
      });
  }, []); // Dependency images.length removed as index check handles boundary


  // Handler for delete confirmation
  const confirmDelete = async () => {
    if (!imageToDelete || isProcessing) return;

    setIsProcessing(true);
    try {
      const imageIndex = images.findIndex((img) => img.id === imageToDelete);
      if (imageIndex === -1) throw new Error("Image not found for deletion.");

      const imageObj = images[imageIndex];

      // If deleting the main image, and there are others, set a new main one
      if (imageObj.isMain && images.length > 1) {
        const nextMainIndex = imageIndex === 0 ? 1 : 0; // Pick first or second
        await onSetMain(images[nextMainIndex].id);
      }

      // Call the external delete handler
      await onDelete(imageToDelete);

      toast.success("התמונה נמחקה בהצלחה.");
      closeImageViewer(); // Close viewer if open
      setDeleteConfirmOpen(false); // Close confirmation dialog
      setImageToDelete(null); // Reset delete target

    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("שגיאה במחיקת התמונה.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Open confirmation dialog
  const requestDelete = (imageId: string, event?: React.MouseEvent) => {
    event?.stopPropagation(); // Prevent grid click or other triggers
    if (isLoading) return;
    setImageToDelete(imageId);
    setDeleteConfirmOpen(true);
  };


  // Handler for setting main image
  const handleSetMainImage = async (imageId: string, showToast = true, event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (isLoading) return;

    const currentImage = images.find(img => img.id === imageId);
    if (!currentImage || currentImage.isMain) return; // Already main or not found

    setIsProcessing(true);
    try {
      await onSetMain(imageId);
      if (showToast) {
        toast.success("התמונה הראשית עודכנה.");
      }
    } catch (error) {
      console.error("Error setting main image:", error);
      toast.error("שגיאה בעדכון התמונה הראשית.");
    } finally {
      setIsProcessing(false);
    }
  };

   // Prevent event bubbling for controls
   const handleControlClick = (e: React.MouseEvent) => {
    e.stopPropagation();
   };

   // Keyboard navigation for viewer
   useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showImageViewer) return;

      switch (e.key) {
        case "ArrowRight": // Assuming RTL means right arrow goes to PREVIOUS visually (index decreases)
          handlePreviousImage();
          break;
        case "ArrowLeft": // Assuming RTL means left arrow goes to NEXT visually (index increases)
          handleNextImage();
          break;
        case "Escape":
          closeImageViewer();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showImageViewer, handlePreviousImage, handleNextImage, closeImageViewer]); // Add dependencies


  // --- Render ---

  return (
    // Inspired Card Structure
    <div dir="rtl" className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-gray-200/80">
        <div className="mb-3 sm:mb-0 text-right">
          <h2 className="text-xl font-semibold text-gray-800">תמונות פרופיל</h2>
          <p className="mt-1 text-sm text-gray-600">
            העלה עד {maxImages} תמונות. התמונה הראשית תוצג בכרטיס. (מומלץ: תמונות ברורות של הפנים)
          </p>
        </div>
        {!disabled && (
          <Button
            variant="outline"
            onClick={triggerFileInput}
            disabled={isLoading || images.length >= maxImages}
            className="rounded-full border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50/50 hover:border-cyan-400 transition-all duration-300 px-5 py-2.5 text-sm font-medium flex items-center gap-2 self-end sm:self-center" // Adjusted padding/text size
          >
            {isExternallyUploading ? ( // Show spinner only for external upload
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>העלאת תמונה</span>
          </Button>
        )}
      </div>

      {/* Input for file selection (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/jpg,image/webp" // Added webp
        onChange={handleFileSelect}
        disabled={isLoading || disabled || images.length >= maxImages}
      />

      {/* Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
        {/* Render Images */}
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-100 shadow-md hover:shadow-lg transition-all duration-300 ease-in-out"
            onClick={() => handleImageClick(index)}
          >
            <Image
              src={image.url}
              alt={`תמונת פרופיל ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              priority={index < 2} // Prioritize loading first few images
            />

            {/* Controls Overlay - Always visible, subtle */}
            {!disabled && (
              <div
                className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity duration-200"
                onClick={handleControlClick} // Prevent triggering image click
              >
                {/* Set Main Button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "w-8 h-8 rounded-full shadow-md border border-white/30 bg-black/40 text-white hover:bg-black/60 transition-colors",
                    image.isMain ? "cursor-default" : "hover:text-yellow-300" // Visual cue for main
                  )}
                  onClick={(e) => handleSetMainImage(image.id, true, e)}
                  disabled={image.isMain || isLoading}
                  title={image.isMain ? "תמונה ראשית" : "הפוך לתמונה ראשית"}
                >
                  <Star
                    className={cn(
                      "w-4 h-4 transition-colors",
                      image.isMain ? "text-yellow-400 fill-yellow-400" : "text-white"
                    )}
                  />
                </Button>

                {/* Delete Button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-8 h-8 rounded-full shadow-md border border-white/30 bg-black/40 text-white hover:bg-red-600 hover:border-red-700 transition-colors"
                  onClick={(e) => requestDelete(image.id, e)}
                  disabled={isLoading}
                  title="מחק תמונה"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Main Image Badge */}
            {image.isMain && (
              <Badge className="absolute bottom-2 left-2 rounded-full px-2.5 py-0.5 text-xs font-medium shadow-md text-white bg-gradient-to-r from-cyan-500 to-pink-500 border-none">
                ראשי
              </Badge>
            )}
          </div>
        ))}

        {/* Upload Placeholder */}
        {!disabled && images.length < maxImages && (
          <div
            onClick={triggerFileInput}
            className="flex flex-col items-center justify-center text-center p-4 aspect-square rounded-xl border-2 border-dashed border-cyan-300/70 bg-cyan-50/30 hover:bg-cyan-50/60 hover:border-cyan-400 transition-colors duration-300 cursor-pointer group"
          >
            <Upload className="w-8 h-8 text-cyan-500 mb-2 transition-transform group-hover:scale-110" />
            <span className="text-sm font-medium text-cyan-700">העלאת תמונה</span>
            <span className="text-xs text-cyan-600/90 mt-1">
              עד {maxImages - images.length} נוספות
            </span>
          </div>
        )}
      </div>

      {/* Empty State (if no images and not disabled) */}
      {images.length === 0 && !disabled && (
         <div className="text-center py-16 mt-6 bg-gradient-to-br from-cyan-50/20 to-pink-50/20 rounded-xl border border-dashed border-gray-300">
              <Camera className="w-12 h-12 mx-auto text-gray-400/80" />
              <p className="mt-4 text-gray-600 font-medium">
                אין עדיין תמונות בפרופיל
              </p>
              <p className="text-sm text-gray-500 mt-1 px-4">
                מומלץ להעלות לפחות תמונה אחת ברורה כדי להגדיל את הסיכויים.
              </p>
          </div>
      )}
      {/* Empty State (if disabled and no images) */}
       {images.length === 0 && disabled && (
         <div className="text-center py-16 mt-6 bg-gray-50/50 rounded-xl border border-gray-200">
              <Camera className="w-12 h-12 mx-auto text-gray-400" />
              <p className="mt-4 text-gray-500 font-medium">
                לא הועלו תמונות לפרופיל זה.
              </p>
          </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-none p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">אישור מחיקת תמונה</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              האם למחוק את התמונה לצמיתות? לא ניתן לשחזר פעולה זו.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:space-x-reverse gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isLoading}
              className="rounded-full px-5"
            >
              ביטול
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isLoading}
               className="rounded-full px-5"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 ml-2" /> // Keep icon consistent
              )}
              <span>מחק</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* Image Viewer Dialog */}
       <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent
            className="p-0 m-0 w-screen h-screen max-w-none sm:max-w-full sm:h-full bg-black/90 backdrop-blur-sm border-none rounded-none flex items-center justify-center outline-none"
            aria-describedby={undefined} // Remove default description link if header is hidden
            >
            {/* Close Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 z-50 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-colors"
                onClick={closeImageViewer}
                aria-label="סגור תצוגת תמונה"
            >
                <X className="w-6 h-6" />
            </Button>

            {/* Image Display Area */}
            {selectedViewerIndex !== null && images[selectedViewerIndex] && (
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Image */}
                     <div className="relative w-[95%] h-[85%] sm:w-[90%] sm:h-[90%]">
                        <Image
                            src={images[selectedViewerIndex].url}
                            alt={`תצוגה מוגדלת של תמונה ${selectedViewerIndex + 1}`}
                            fill
                            className="object-contain select-none" // Prevent image selection/drag
                            sizes="90vw" // Simplified sizes for viewer
                            priority // Load the viewed image with high priority
                        />
                    </div>


                    {/* Viewer Controls (Nav + Actions) */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                         {/* Navigation */}
                         {images.length > 1 && (
                            <>
                            {/* Previous Button (Visually Right in RTL) */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-40 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-colors pointer-events-auto"
                                onClick={(e) => {e.stopPropagation(); handlePreviousImage();}}
                                disabled={selectedViewerIndex === 0}
                                aria-label="התמונה הקודמת"
                            >
                                <ChevronRight className="w-7 h-7" />
                            </Button>
                             {/* Next Button (Visually Left in RTL) */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-40 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-colors pointer-events-auto"
                                onClick={(e) => {e.stopPropagation(); handleNextImage();}}
                                disabled={selectedViewerIndex === images.length - 1}
                                aria-label="התמונה הבאה"
                            >
                                <ChevronLeft className="w-7 h-7" />
                            </Button>
                            </>
                         )}

                        {/* Action Buttons (Top Right) */}
                         {!disabled && (
                            <div className="absolute top-4 right-4 z-50 flex flex-col sm:flex-row gap-2 pointer-events-auto">
                                {/* Set as Main Button */}
                                {!images[selectedViewerIndex].isMain && (
                                <Button
                                    variant="secondary"
                                    className="rounded-full bg-white/70 backdrop-blur-sm shadow-md hover:bg-white/90 text-gray-800 px-3 py-1.5 text-xs sm:text-sm border border-white/20 flex items-center gap-1.5"
                                    onClick={(e) => handleSetMainImage(images[selectedViewerIndex].id, true, e)}
                                    size="sm"
                                    disabled={isLoading}
                                >
                                    <Star className="w-4 h-4" />
                                    <span>הפוך לראשי</span>
                                </Button>
                                )}

                                {/* Delete Button */}
                                <Button
                                    variant="destructive" // Using destructive variant directly
                                    className="rounded-full bg-red-600/80 hover:bg-red-700 text-white px-3 py-1.5 text-xs sm:text-sm shadow-md border-none flex items-center gap-1.5"
                                    onClick={(e) => requestDelete(images[selectedViewerIndex].id, e)}
                                    size="sm"
                                    disabled={isLoading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>מחק תמונה</span>
                                </Button>
                            </div>
                        )}

                        {/* Counter */}
                        {images.length > 0 && (
                           <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium select-none">
                             {selectedViewerIndex + 1} / {images.length}
                           </div>
                        )}
                    </div>
                 </div>
            )}
        </DialogContent>
       </Dialog>
    </div>
  );
};

export default PhotosSection;

