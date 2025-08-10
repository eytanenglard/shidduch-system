// src/components/HomePage/HomePage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

// Import all sections
import HeroSection from './sections/HeroSection';
import ValuePropositionSection from './sections/ValuePropositionSection';
import OurMethodSection from './sections/OurMethodSection';
import HowItWorksSection from './sections/HowItWorksSection';
import MatchmakerTeamSection from './sections/MatchmakerTeamSection';
import SuccessStoriesSection from './sections/SuccessStoriesSection';
import FAQSection from './sections/FAQSection';
import PrivacyAssuranceSection from './sections/PrivacyAssuranceSection';
import CTASection from './sections/CTASection';
import FooterSection from './sections/FooterSection';

// 1. ייבוא רכיבים נחוצים
import Navbar from '../layout/Navbar'; // ייבוא של ה-Navbar הראשי
import ChatWidget from '../ChatWidget/ChatWidget';
import StickyNav, { NavLink } from './components/StickyNav';

const navLinks: NavLink[] = [
  { id: 'how-it-works', label: 'המסע שלכם' },
  { id: 'suggestion-demo', label: 'כך נראית הצעה' },
  { id: 'success-stories', label: 'סיפורי הצלחה' },
  { id: 'our-team', label: 'הצוות שלנו' },
  { id: 'faq', label: 'שאלות נפוצות' },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  // 2. הוספת state למעקב אחר מצב הגלילה
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // פונקציה שמעדכנת את ה-state בהתאם למיקום הגלילה
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // הוספת מאזין לאירוע הגלילה
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // קריאה ראשונית למקרה שהדף נטען באמצע גלילה

    // ניקוי המאזין בסיום
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // ריצה פעם אחת בלבד כשהרכיב נטען

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* 3. הוספת רכיבי הניווט עם לוגיקת הנראות */}

      {/* ה-Navbar הראשי: נראה בראש הדף, נעלם בגלילה */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          isScrolled
            ? 'opacity-0 -translate-y-full pointer-events-none'
            : 'opacity-100'
        }`}
      >
        <Navbar />
      </div>

      {/* ה-StickyNav: הלוגיקה שלו גורמת לו להופיע רק בגלילה */}
      {/* אנו מעבירים לו את פרטי ה-session כדי שיוכל להציג אייקון פרופיל */}
      <StickyNav navLinks={navLinks} session={session} />

      {/* --- Page Sections in the FINAL, correct strategic order --- */}
      <HeroSection session={session} isVisible={isVisible} />
      <ValuePropositionSection />
      <OurMethodSection />
      <HowItWorksSection />
      <MatchmakerTeamSection />
      <SuccessStoriesSection />
      <FAQSection />
      <PrivacyAssuranceSection />
      <CTASection />
      <FooterSection />

      {/* Floating components (unchanged) */}
      <ChatWidget />
    </div>
  );
}
