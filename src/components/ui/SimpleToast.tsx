import React from 'react';
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  isVisible: boolean;
}

export function SimpleToast({ message, type = 'info', onClose, isVisible }: ToastProps) {
  if (!isVisible) return null;

  const baseClasses = "fixed bottom-4 left-4 p-4 rounded-md shadow-lg z-50 transition-all duration-300";
  const typeClasses = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white"
  };

  return (
    <div className={cn(baseClasses, typeClasses[type])}>
      <div className="flex items-center justify-between">
        <p>{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-white hover:text-gray-200"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}