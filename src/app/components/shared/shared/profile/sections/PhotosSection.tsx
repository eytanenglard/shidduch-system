"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
} from "lucide-react";

// Types
import type { UserImage } from "@/types/next-auth";

interface PhotosSectionProps {
  images: UserImage[];
  isUploading: boolean;
  disabled?: boolean;
  maxImages?: number;
  onUpload: (file: File) => Promise<void>;
  onSetMain: (imageId: string) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
}

const PhotosSection: React.FC<PhotosSectionProps> = ({
  images,
  isUploading,
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
  const [selectedViewerIndex, setSelectedViewerIndex] = useState<number | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [lastUploadedIndex, setLastUploadedIndex] = useState<number | null>(
    null
  );

  // Effect to show newly uploaded image
  useEffect(() => {
    if (lastUploadedIndex !== null) {
      setSelectedViewerIndex(lastUploadedIndex);
      setShowImageViewer(true);
      setLastUploadedIndex(null);
    }
  }, [lastUploadedIndex, images]);
  // File handling functions
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("סוג קובץ לא חוקי. ניתן להעלות רק תמונות מסוג JPG או PNG");
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error("גודל הקובץ חייב להיות קטן מ-5MB");
      return;
    }

    try {
      setIsProcessing(true);
      await onUpload(file);

      // Set index to show the newly uploaded image
      const newIndex = images.length;
      setLastUploadedIndex(newIndex);

      // Set as main if it's the first image
      if (images.length === 0) {
        const uploadedImage = images[0];
        if (uploadedImage) {
          await onSetMain(uploadedImage.id);
        }
      }

      toast.success("התמונה הועלתה בהצלחה");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Image viewer functions
  const handleImageClick = (index: number) => {
    setSelectedViewerIndex(index);
    setShowImageViewer(true);
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    setSelectedViewerIndex(null);
  };

  const handleNextImage = () => {
    if (
      selectedViewerIndex !== null &&
      selectedViewerIndex < images.length - 1
    ) {
      setSelectedViewerIndex(selectedViewerIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedViewerIndex !== null && selectedViewerIndex > 0) {
      setSelectedViewerIndex(selectedViewerIndex - 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (selectedViewerIndex === null) return;

    switch (e.key) {
      case "ArrowRight":
        handlePreviousImage(); // RTL navigation
        break;
      case "ArrowLeft":
        handleNextImage(); // RTL navigation
        break;
      case "Escape":
        closeImageViewer();
        break;
    }
  };

  // Image actions
  const handleDeleteClick = async (imageId: string) => {
    try {
      // Check if this is the main image and there are other images
      const imageToDelete = images.find((img) => img.id === imageId);
      if (imageToDelete?.isMain && images.length > 1) {
        // Find another image to set as main
        const nextImage = images.find((img) => img.id !== imageId);
        if (nextImage) {
          await onSetMain(nextImage.id);
        }
      }

      await onDelete(imageId);
      setImageToDelete(null);
      closeImageViewer();
      toast.success("התמונה נמחקה בהצלחה");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("שגיאה במחיקת התמונה");
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    try {
      await onSetMain(imageId);
      toast.success("התמונה הראשית עודכנה בהצלחה");
    } catch (error) {
      console.error("Error setting main image:", error);
      toast.error("שגיאה בעדכון התמונה הראשית");
    }
  };

  // Delete confirmation dialog
  const openDeleteConfirm = (imageId: string) => {
    setImageToDelete(imageId);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setImageToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const confirmDelete = async () => {
    if (imageToDelete) {
      await handleDeleteClick(imageToDelete);
      closeDeleteConfirm();
    }
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">תמונות פרופיל</CardTitle>
            <CardDescription>
              העלה עד {maxImages} תמונות. תמונה ראשית תוצג בכרטיס הפרופיל.
            </CardDescription>
          </div>
          {!disabled && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={
                disabled ||
                isUploading ||
                isProcessing ||
                images.length >= maxImages
              }
            >
              {isUploading || isProcessing ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 ml-2" />
              )}
              העלאת תמונה
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Current Images */}
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100"
              onClick={() => handleImageClick(index)}
            >
              <Image
                src={image.url}
                alt={`תמונת פרופיל ${index + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />

              {/* Overlay Controls */}
              {!disabled && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "hover:bg-white/20",
                        image.isMain ? "text-yellow-500" : "text-white"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        !image.isMain && handleSetMainImage(image.id);
                      }}
                      disabled={image.isMain}
                      title={image.isMain ? "תמונה ראשית" : "הפוך לתמונה ראשית"}
                    >
                      <Star
                        className={cn(
                          "w-5 h-5",
                          image.isMain && "fill-yellow-500"
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteConfirm(image.id);
                      }}
                      title="מחק תמונה"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Main Image Badge */}
              {image.isMain && (
                <Badge className="absolute top-2 left-2">ראשי</Badge>
              )}
            </div>
          ))}

          {/* Upload Placeholder */}
          {!disabled && images.length < maxImages && (
            <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileSelect}
                disabled={disabled || isUploading || isProcessing}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  העלאת תמונה
                </span>
              </div>
            </label>
          )}

          {/* Empty State */}
          {images.length === 0 && (
            <div className="col-span-full text-center py-12 bg-muted/50 rounded-lg">
              <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                לא הועלו תמונות עדיין
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>מחיקת תמונה</AlertDialogTitle>
              <AlertDialogDescription>
                האם את/ה בטוח/ה שברצונך למחוק את התמונה? פעולה זו לא ניתנת
                לביטול.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDeleteConfirm}>
                ביטול
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmDelete}
              >
                מחיקה
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Image Viewer Dialog */}
        <Dialog open={showImageViewer} onOpenChange={closeImageViewer}>
          <DialogContent
            className="max-w-7xl h-[90vh] flex items-center justify-center p-0"
            onKeyDown={handleKeyPress}
          >
            <DialogHeader>
              <DialogTitle className="sr-only">תצוגת תמונה</DialogTitle>
              <DialogDescription className="sr-only">
                גלריית תמונות פרופיל
              </DialogDescription>
            </DialogHeader>

            {selectedViewerIndex !== null && images[selectedViewerIndex] && (
              <div className="relative w-full h-full">
                {/* Navigation Buttons */}
                {selectedViewerIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviousImage();
                    }}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                )}
                {selectedViewerIndex < images.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                )}

                {/* Main Image */}
                <div className="relative w-full h-full">
                  <Image
                    src={images[selectedViewerIndex].url}
                    alt={`תמונת פרופיל ${selectedViewerIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 2048px) 90vw, 85vw"
                    priority
                  />
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full">
                  {selectedViewerIndex + 1} / {images.length}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PhotosSection;
