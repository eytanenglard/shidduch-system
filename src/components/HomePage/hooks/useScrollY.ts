// src/components/HomePage/hooks/useScrollY.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Single shared scroll listener for the homepage.
 * Returns the current scrollY value, updated on scroll.
 */
export function useScrollY(): number {
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return scrollY;
}
