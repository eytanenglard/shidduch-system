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

// ייבוא רכיבי חיצוניים
import Navbar from '../layout/Navbar';
import ChatWidget from '../ChatWidget/ChatWidget';
import StickyNav, { NavLink } from './components/StickyNav';
import CookieBanner from '../ui/CookieBanner';
import type { HomePageDictionary } from '@/types/dictionary';

interface HomePageProps {
  dict: HomePageDictionary;
}

export default function HomePage({ dict }: HomePageProps) {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // המצב isScrolled ישמש אך ורק עבור ה-StickyNav
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

  const navLinks: NavLink[] = [
    { id: 'how-it-works', label: 'המסע שלכם' },
    { id: 'suggestion-demo', label: 'כך נראית הצעה' },
    { id: 'success-stories', label: 'סיפורי הצלחה' },
    { id: 'our-team', label: 'הצוות שלנו' },
    { id: 'faq', label: 'שאלות נפוצות' },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* ✨ 1. הסרנו את ה-div הריק והמיותר שהתנגש עם ה-Navbar הראשי */}

      {/* ✨ 2. העברנו את מצב הגלילה כ-prop לקומפוננטת ה-StickyNav */}
      {/* (יתכן שתצטרך לעדכן את StickyNav כך שישתמש ב-prop זה כדי לשלוט בנראות שלו) */}
      <StickyNav navLinks={navLinks} session={session} isVisible={isScrolled} />

      <HeroSection
        session={session}
        isVisible={isVisible}
        dict={dict.heroSection}
      />
      <ValuePropositionSection dict={dict.valueProposition} />

      <OurMethodSection dict={dict.ourMethod} />
<HowItWorksSection 
        dict={dict.howItWorks} 
        suggestionsDict={dict.suggestions} // הוספנו prop חדש
      />
      <MatchmakerTeamSection dict={dict.matchmakerTeam} />
      <SuccessStoriesSection dict={dict.successStories} />
      <FAQSection dict={dict.faq} />
      <PrivacyAssuranceSection dict={dict.privacyAssurance} />
      <CTASection dict={dict.cta} />
      <FooterSection dict={dict.footer} />

      <ChatWidget dict={dict.chatWidget} />
      <CookieBanner dict={dict.cookieBanner} />
    </div>
  );
}
