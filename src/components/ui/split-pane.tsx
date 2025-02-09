// components/ui/split-pane.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SplitPaneProps {
  children: [React.ReactNode, React.ReactNode];
  split?: "vertical" | "horizontal";
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  onChange?: (size: number) => void;
  className?: string;
}

export function SplitPane({
  children,
  split = "vertical",
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  onChange,
  className,
}: SplitPaneProps) {
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const splitPaneRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !splitPaneRef.current) return;

      const rect = splitPaneRef.current.getBoundingClientRect();
      let newSize;

      if (split === "vertical") {
        newSize = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        newSize = ((e.clientY - rect.top) / rect.height) * 100;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
      onChange?.(newSize);
    },
    [isDragging, split, minSize, maxSize, onChange]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={splitPaneRef}
      className={cn(
        "flex",
        split === "vertical" ? "flex-row" : "flex-col",
        className
      )}
    >
      <div
        className={cn("overflow-auto", split === "vertical" ? "h-full" : "")}
        style={{
          [split === "vertical" ? "width" : "height"]: `${size}%`,
        }}
      >
        {children[0]}
      </div>

      <div
        ref={resizerRef}
        className={cn(
          "bg-gray-200 hover:bg-blue-500 transition-colors duration-150",
          "cursor-col-resize",
          split === "vertical" ? "w-1 my-1 hover:w-1" : "h-1 mx-1 hover:h-1",
          isDragging && "bg-blue-500"
        )}
        onMouseDown={handleMouseDown}
      />

      <div
        className={cn("overflow-auto", split === "vertical" ? "h-full" : "")}
        style={{
          [split === "vertical" ? "width" : "height"]: `${100 - size}%`,
        }}
      >
        {children[1]}
      </div>
    </div>
  );
}
