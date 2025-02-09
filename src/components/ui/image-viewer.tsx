// src/components/ui/image-viewer.tsx
"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";

interface ImageViewerProps {
  images: { id: string; url: string; isMain?: boolean }[];
  selectedIndex: number | null;
  onClose: () => void;
  title?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  selectedIndex,
  onClose,
  title = "תצוגת תמונה",
}) => {
  const handlePreviousImage = () => {
    if (selectedIndex !== null) {
      const newIndex =
        selectedIndex === 0 ? images.length - 1 : selectedIndex - 1;
      setCurrentIndex(newIndex);
    }
  };

  const handleNextImage = () => {
    if (selectedIndex !== null) {
      const newIndex =
        selectedIndex === images.length - 1 ? 0 : selectedIndex + 1;
      setCurrentIndex(newIndex);
    }
  };

  const [currentIndex, setCurrentIndex] = React.useState(selectedIndex);

  React.useEffect(() => {
    setCurrentIndex(selectedIndex);
  }, [selectedIndex]);

  if (selectedIndex === null || currentIndex === null) return null;

  return (
    <Dialog open={selectedIndex !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-lg h-screen flex items-center justify-center">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 transform -translate-y-1/2"
          onClick={handlePreviousImage}
          aria-label="תמונה קודמת"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>

        <div className="relative w-full h-[80vh]">
          <Image
            src={images[currentIndex].url}
            alt={`תמונה ${currentIndex + 1} מתוך ${images.length}`}
            fill
            className="object-contain"
            priority
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2"
          onClick={handleNextImage}
          aria-label="תמונה הבאה"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={onClose}
          aria-label="סגור תצוגת תמונה"
        >
          <X className="h-6 w-6" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;
