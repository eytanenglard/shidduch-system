// components/ui/virtual-grid.tsx
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  className?: string;
  itemHeight?: number;
  itemWidth?: number;
  overscan?: number;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  className,
  itemHeight = 300,
  itemWidth = 250,
  overscan = 5,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateVisibleItems = () => {
      const rect = container.getBoundingClientRect();
      setContainerWidth(rect.width);
      
      const itemsPerRow = Math.max(1, Math.floor(rect.width / itemWidth));
      const rowHeight = itemHeight;
      const totalRows = Math.ceil(items.length / itemsPerRow);
      
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;
      
      const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
      const endRow = Math.min(
        totalRows,
        Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan
      );
      
      const start = startRow * itemsPerRow;
      const end = Math.min(items.length, (endRow + 1) * itemsPerRow);
      
      setVisibleRange({ start, end });
    };

    // Set up ResizeObserver
    const observer = new ResizeObserver(calculateVisibleItems);
    observer.observe(container);

    // Set up scroll listener
    container.addEventListener('scroll', calculateVisibleItems);
    calculateVisibleItems();

    // Cleanup
    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', calculateVisibleItems);
    };
  }, [items.length, itemHeight, itemWidth, overscan]);

  const itemsPerRow = Math.max(1, Math.floor(containerWidth / itemWidth));
  const totalHeight = Math.ceil(items.length / itemsPerRow) * itemHeight;

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const paddingTop = Math.floor(visibleRange.start / itemsPerRow) * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto h-full relative", className)}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: paddingTop,
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${itemWidth}px, 1fr))`,
            gap: '1rem',
            width: '100%',
          }}
        >
          {visibleItems.map(renderItem)}
        </div>
      </div>
    </div>
  );
}