// src/components/HomePage/HomePage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

// Import all sections
import HeroSection from './sections/HeroSection';
import ValuePropositionSection from './sections/ValuePropositionSection';
import OurMethodSection from './sections/OurMethodSection'; // Correct name
import HowItWorksSection from './sections/HowItWorksSection';
import MatchmakerTeamSection from './sections/MatchmakerTeamSection';
import SuccessStoriesSection from './sections/SuccessStoriesSection';
import FAQSection from './sections/FAQSection';
import PrivacyAssuranceSection from './sections/PrivacyAssuranceSection';
import CTASection from './sections/CTASection';
import FooterSection from './sections/FooterSection';

// 1. Import new components (unchanged)
import ChatWidget from '../ChatWidget/ChatWidget';
import StickyNav, { NavLink } from './components/StickyNav';

// 2. Define navigation links with updated labels and strategic order.
//    The 'id' must match the 'id' attribute within the sections.
//    (e.g., HowItWorksSection should contain <... id="suggestion-demo">)
const navLinks: NavLink[] = [
  { id: 'how-it-works', label: 'המסע שלכם' },
  { id: 'suggestion-demo', label: 'כך נראית הצעה' }, // This ID is inside HowItWorksSection
  { id: 'our-method', label: 'הגישה שלנו' },
  { id: 'our-team', label: 'הצוות שלנו' },
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
      {/* 3. Add the StickyNav component */}
      <StickyNav navLinks={navLinks} />

      {/* --- Page Sections in the FINAL, correct strategic order --- */}
      <HeroSection session={session} isVisible={isVisible} />
      <ValuePropositionSection />

      {/* The "Why" - deep philosophy */}
      <OurMethodSection />

      {/* The comprehensive "How" & "What" - process and demo in one section */}
      <HowItWorksSection />

      {/* The "Who" - building personal trust */}
      <MatchmakerTeamSection />

      {/* Social proof and summary of benefits */}
      <SuccessStoriesSection />

      {/* Closing arguments and final info */}
      <FAQSection />
      <PrivacyAssuranceSection />
      <CTASection />
      <FooterSection />

      {/* Floating components (unchanged) */}
      <ChatWidget />
    </div>
  );
}
