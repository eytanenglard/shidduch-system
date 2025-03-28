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
  }, [lastUploadedIndex]);

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

  // פתרון חדש למחיקת תמונה - מחיקה ישירה ללא שימוש בדיאלוג מורכב
  const handleDirectDelete = async (imageId: string) => {
    try {
      setIsProcessing(true);

      // מציאת התמונה לפי מזהה
      const imageIndex = images.findIndex((img) => img.id === imageId);
      if (imageIndex === -1) return;

      const imageObj = images[imageIndex];

      // אם זו תמונה ראשית וקיימות תמונות נוספות
      if (imageObj.isMain && images.length > 1) {
        // בחירת תמונה אחרת להיות ראשית
        const nextIndex = imageIndex === 0 ? 1 : 0;
        await onSetMain(images[nextIndex].id);
      }

      // מחיקת התמונה
      await onDelete(imageId);

      // סגירת התצוגה המורחבת אם היא פתוחה
      closeImageViewer();
      toast.success("התמונה נמחקה בהצלחה");
    } catch (error) {
      console.error("שגיאה במחיקת תמונה:", error);
      toast.error("שגיאה במחיקת התמונה");
    } finally {
      setIsProcessing(false);
      setImageToDelete(null);
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

  // פונקציה למניעת בועת האירוע והעבירה לתצוגת התמונה
  const handleControlClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gray-50 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">תמונות פרופיל</CardTitle>
            <CardDescription className="mt-1">
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
              className="transition-all hover:shadow-md"
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
      <CardContent className="p-6">
        {/* Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Current Images */}
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* תמונה עם אירוע לחיצה לפתיחת הגלריה */}
              <div
                className="w-full h-full"
                onClick={() => handleImageClick(index)}
              >
                <Image
                  src={image.url}
                  alt={`תמונת פרופיל ${index + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>

              {/* Controls Layer - כפתורים שלא נפתחים בהובר אלא תמיד מוצגים עם שקיפות */}
              {!disabled && (
                <div
                  className="absolute top-0 right-0 p-2 z-10"
                  onClick={handleControlClick} // מניעת בועת האירוע
                >
                  <div className="flex gap-1.5">
                    {/* Set Main Button */}
                    <Button
                      variant="secondary"
                      size="icon"
                      className={cn(
                        "w-8 h-8 rounded-full shadow-md border border-white/30 bg-black/40 hover:bg-black/60 transition-colors",
                        image.isMain ? "text-yellow-400" : "text-white"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!image.isMain) handleSetMainImage(image.id);
                      }}
                      disabled={image.isMain || isProcessing}
                      title={image.isMain ? "תמונה ראשית" : "הפוך לתמונה ראשית"}
                    >
                      <Star
                        className={cn(
                          "w-4 h-4",
                          image.isMain && "fill-yellow-400"
                        )}
                      />
                    </Button>

                    {/* Delete Button - שימוש במחיקה ישירה ללא דיאלוג */}
                    <Dialog>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="w-8 h-8 rounded-full shadow-md border border-white/30 bg-black/40 hover:bg-red-500 transition-colors text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          // פתיחת דיאלוג מחיקה פשוט מבוסס Dialog במקום AlertDialog
                          setImageToDelete(image.id);
                          setDeleteConfirmOpen(true);
                        }}
                        title="מחק תמונה"
                        disabled={isProcessing}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Dialog>
                  </div>
                </div>
              )}

              {/* Main Image Badge */}
              {image.isMain && (
                <Badge className="absolute bottom-2 left-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 shadow-md text-white border-none">
                  ראשי
                </Badge>
              )}
            </div>
          ))}

          {/* Upload Placeholder */}
          {!disabled && images.length < maxImages && (
            <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileSelect}
                disabled={disabled || isUploading || isProcessing}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-muted-foreground">
                  העלאת תמונה
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  JPG, PNG עד 5MB
                </span>
              </div>
            </label>
          )}

          {/* Empty State */}
          {images.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Camera className="w-14 h-14 mx-auto text-muted-foreground opacity-70" />
              <p className="mt-4 text-muted-foreground font-medium">
                לא הועלו תמונות עדיין
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                העלה תמונה כדי להציג את הפרופיל שלך
              </p>
            </div>
          )}
        </div>

        {/* Delete Dialog - פתרון חלופי עם Dialog במקום AlertDialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">מחיקת תמונה</DialogTitle>
              <DialogDescription className="text-md">
                האם את/ה בטוח/ה שברצונך למחוק את התמונה? פעולה זו לא ניתנת
                לביטול.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setImageToDelete(null);
                }}
                disabled={isProcessing}
              >
                ביטול
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (imageToDelete) {
                    handleDirectDelete(imageToDelete);
                    setDeleteConfirmOpen(false);
                  }
                }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מוחק...
                  </>
                ) : (
                  "מחיקה"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Viewer Dialog */}
        <Dialog open={showImageViewer} onOpenChange={closeImageViewer}>
          <DialogContent
            className="max-w-7xl h-[90vh] flex items-center justify-center p-0 bg-gray-900/95 border-gray-800"
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
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 transition-colors"
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
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                )}

                {/* Actions in Image Viewer */}
                {!disabled && (
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    {/* Set as Main Button */}
                    {!images[selectedViewerIndex].isMain && (
                      <Button
                        variant="secondary"
                        className="bg-black/50 hover:bg-black/70 text-white border border-white/20"
                        onClick={() =>
                          handleSetMainImage(images[selectedViewerIndex].id)
                        }
                        size="sm"
                        disabled={isProcessing}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        הפוך לתמונה ראשית
                      </Button>
                    )}

                    {/* Delete Button */}
                    <Button
                      variant="secondary"
                      className="bg-red-500/80 hover:bg-red-600 text-white border-none"
                      onClick={() => {
                        if (selectedViewerIndex !== null) {
                          setImageToDelete(images[selectedViewerIndex].id);
                          setDeleteConfirmOpen(true);
                        }
                      }}
                      size="sm"
                      disabled={isProcessing}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      מחק תמונה
                    </Button>
                  </div>
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
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-1.5 rounded-full text-sm font-medium">
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
