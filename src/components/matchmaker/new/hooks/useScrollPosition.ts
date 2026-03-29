import { useRef, useCallback } from 'react';

/**
 * Hook for saving and restoring scroll position across dialog open/close.
 * Looks for the nearest scrollable ancestor or falls back to window scroll.
 */
export function useScrollPosition(containerRef: React.RefObject<HTMLDivElement | null>) {
  const scrollPositionRef = useRef<number>(0);

  const saveScrollPosition = useCallback(() => {
    const scrollContainer = containerRef.current?.closest(
      '.overflow-y-auto, [data-radix-scroll-area-viewport]'
    );
    if (scrollContainer) {
      scrollPositionRef.current = scrollContainer.scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY;
    }
  }, [containerRef]);

  const restoreScrollPosition = useCallback(() => {
    requestAnimationFrame(() => {
      const scrollContainer = containerRef.current?.closest(
        '.overflow-y-auto, [data-radix-scroll-area-viewport]'
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollPositionRef.current;
      } else {
        window.scrollTo(0, scrollPositionRef.current);
      }
    });
  }, [containerRef]);

  return { saveScrollPosition, restoreScrollPosition };
}
