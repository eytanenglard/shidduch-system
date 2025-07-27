'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

// Import all sections
import HeroSection from './sections/HeroSection';
import ValuePropositionSection from './sections/ValuePropositionSection';
import FeaturesSection from './sections/FeaturesSection';
import AlgorithmSection from './sections/AlgorithmSection';
import HowItWorksSection from './sections/HowItWorksSection';
import MatchmakerTeamSection from './sections/MatchmakerTeamSection';
import SuccessStoriesSection from './sections/SuccessStoriesSection';
import FAQSection from './sections/FAQSection';
import PrivacyAssuranceSection from './sections/PrivacyAssuranceSection';
import CTASection from './sections/CTASection';
import FooterSection from './sections/FooterSection';

// 1. Import our new components
import ChatWidget from '../ChatWidget/ChatWidget';
import StickyNav, { NavLink } from './components/StickyNav';

// 2. Define the navigation links in a single, manageable constant.
//    The 'id' must match the 'id' attribute of the corresponding section component.
const navLinks: NavLink[] = [
  { id: 'how-it-works', label: 'איך זה עובד?' },
  { id: 'our-method', label: 'השיטה שלנו' },
  { id: 'our-team', label: 'הצוות שלנו' },
  { id: 'success-stories', label: 'סיפורי הצלחה' },
  { id: 'faq', label: 'שאלות נפוצות' },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    // The main div allows the chat widget and sticky nav to be fixed relative to the viewport
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* 3. Add the StickyNav component at the top of the page */}
      <StickyNav navLinks={navLinks} />

      {/* Page Sections */}
      <HeroSection session={session} isVisible={isVisible} />
      <ValuePropositionSection />
      <HowItWorksSection />
      <MatchmakerTeamSection />
      <FeaturesSection />
      <AlgorithmSection />
      <SuccessStoriesSection />
      <FAQSection />
      <PrivacyAssuranceSection />
      <CTASection />
      <FooterSection />

      {/* 4. The old floating button is now removed/commented out */}
      {/*
      <div className="fixed bottom-8 left-8 z-50 animate-bounce-slow">
        <Button
          size="lg"
          className="rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 group"
        >
          <MessageCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
          <span className="group-hover:mr-1 transition-all">דברו איתנו</span>
        </Button>
      </div>
      */}

      {/* 5. The ChatWidget remains */}
      <ChatWidget />
    </div>
  );
}
