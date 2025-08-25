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

// Import external components
import Navbar from '../layout/Navbar';
import ChatWidget from '../ChatWidget/ChatWidget';
import StickyNav, { NavLink } from './components/StickyNav';
import CookieBanner from '../ui/CookieBanner';
import type { Dictionary } from '@/types/dictionary';
import { generateDemoData } from './components/demo-data';

// ✅ 1. הגדרת הטיפוס עבור נתוני הדמו
type DemoData = Awaited<ReturnType<typeof generateDemoData>>;

// ✅ 2. עדכון הממשק של ה-props כך שיכלול גם את demoData
interface HomePageProps {
  dict: Dictionary;
  demoData: DemoData;
}

export default function HomePage({ dict, demoData }: HomePageProps) {
  // ✅ 3. קבלת demoData כ-prop
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

  const navLinks: NavLink[] = [
    { id: 'how-it-works', label: dict.stickyNav.navLinks.howItWorks },
    { id: 'suggestion-demo', label: dict.stickyNav.navLinks.suggestionDemo },
    { id: 'success-stories', label: dict.stickyNav.navLinks.successStories },
    { id: 'our-team', label: dict.stickyNav.navLinks.ourTeam },
    { id: 'faq', label: dict.stickyNav.navLinks.faq },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <StickyNav
        navLinks={navLinks}
        session={session}
        isVisible={isScrolled}
        dict={dict.stickyNav} // ✨ הוסף את ה-prop הזה
      />

      <HeroSection
        session={session}
        isVisible={isVisible}
        dict={dict.heroSection}
      />
      <ValuePropositionSection dict={dict.valueProposition} />

      <OurMethodSection dict={dict.ourMethod} />

      {/* ✅ 4. העברת demoData לרכיב HowItWorksSection פותרת את שגיאת 'Cannot find name' */}
      <HowItWorksSection
        dict={dict.howItWorks}
        suggestionsDict={dict.suggestions}
        profileCardDict={dict.profilePage.profileCard}
        demoData={demoData}
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
