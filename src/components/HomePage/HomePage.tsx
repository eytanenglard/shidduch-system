// src/components/HomePage/HomePage.tsx (מעודכן עם CookieBanner)
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

// ייבוא רכיבי חיצוניים
import Navbar from '../layout/Navbar';
import ChatWidget from '../ChatWidget/ChatWidget';
import StickyNav, { NavLink } from './components/StickyNav';
import CookieBanner from '../ui/CookieBanner'; // הוספת CookieBanner

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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* הNavbar הראשי */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          isScrolled
            ? 'opacity-0 -translate-y-full pointer-events-none'
            : 'opacity-100'
        }`}
      >
        <Navbar />
      </div>

      {/* הStickyNav */}
      <StickyNav navLinks={navLinks} session={session} />

      {/* Page Sections */}
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

      {/* Floating components */}
      <ChatWidget />

      {/* CookieBanner - רק בדף הבית */}
      <CookieBanner />
    </div>
  );
}
