import { useState, useEffect } from "react";

/**
 * הוק המאפשר לנטר שינויים במדיה קוורי
 * 
 * @param query מחרוזת מדיה קוורי כגון "(max-width: 768px)"
 * @returns בוליאני המציין האם המדיה קוורי פעיל
 * 
 * דוגמאות לשימוש:
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
 * const isDesktop = useMediaQuery("(min-width: 1025px)");
 */
export function useMediaQuery(query: string): boolean {
  // מצב התאמת המדיה הנוכחית
  const [matches, setMatches] = useState<boolean>(false);

  // זיהוי האם אנו נמצאים בסביבת דפדפן
  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    // אם איננו בדפדפן, אין טעם להמשיך
    if (!isBrowser) {
      return undefined;
    }

    // בדיקה ראשונית של התאמת המדיה
    const media = window.matchMedia(query);
    setMatches(media.matches);

    // כשמתרחש שינוי בהתאמת המדיה, עדכן את המצב
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // רישום האזנה לשינויים
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      // תמיכה בדפדפנים ישנים יותר
      media.addListener(listener);
    }

    // ניקוי האזנה בעת עזיבת הקומפוננטה
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        // תמיכה בדפדפנים ישנים יותר
        media.removeListener(listener);
      }
    };
  }, [query, isBrowser]);

  return matches;
}

// מקצרים נפוצים לשימוש
export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet() {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)");
}

export function useIsDarkMode() {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export default useMediaQuery;