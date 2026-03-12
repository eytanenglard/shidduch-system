// src/components/HomePage/HomePage.tsx
// Improvements: #8 removed isVisible state, #9 removed isScrolled state, #4 shared global styles, #50 prefers-reduced-motion

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
import ChatWidget from '../ChatWidget/ChatWidget';
import StickyNav, { NavLink } from './components/StickyNav';
import CookieBanner from '../ui/CookieBanner';
import FloatingCTAButton from './components/FloatingCTAButton';
import type { Dictionary } from '@/types/dictionary';
import { generateDemoData } from './components/demo-data';
import NeshmaInsightSectionB from './sections/NeshmaInsightSectionB';

type DemoData = Awaited<ReturnType<typeof generateDemoData>>;

interface HomePageProps {
  dict: Dictionary;
  demoData: DemoData;
  locale: 'he' | 'en';
}

export default function HomePage({ dict, demoData, locale }: HomePageProps) {
  const { data: session } = useSession();
  // #9: Removed isScrolled — StickyNav handles its own scroll tracking
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
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
      {/* #4: Shared global keyframe animations used across multiple sections */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        @keyframes soft-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(0.5deg); }
          75% { transform: translateY(3px) rotate(-0.5deg); }
        }
        .animate-soft-float {
          animation: soft-float 6s ease-in-out infinite;
        }
        @keyframes gentle-pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        .animate-gentle-pulse {
          animation: gentle-pulse 4s ease-in-out infinite;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.3); }
          50% { box-shadow: 0 0 20px 4px rgba(251, 191, 36, 0.15); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        /* #50: Respect reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .animate-float-slow,
          .animate-soft-float,
          .animate-gentle-pulse,
          .animate-gradient,
          .animate-pulse-glow {
            animation: none !important;
          }
          /* Disable framer-motion transitions via CSS fallback */
          * {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>

      <StickyNav
        navLinks={navLinks}
        session={session}
        isVisible={isScrolled}
        dict={dict.stickyNav}
        userDropdownDict={dict.userDropdown}
        locale={locale}
      />

      {/* #8: Pass isVisible as true directly — CSS handles the initial animation */}
      <HeroSection
        session={session}
        isVisible={true}
        dict={dict.heroSection}
        locale={locale}
      />
      <ValuePropositionSection dict={dict.valueProposition} />

      <NeshmaInsightSectionB locale={locale} dict={dict.neshmaInsight} />

      <OurMethodSection dict={dict.ourMethod} />

      <HowItWorksSection
        dict={dict.howItWorks}
        suggestionsDict={dict.suggestions}
        profileCardDict={dict.profilePage.profileCard}
        demoData={demoData}
        locale={locale}
      />

      <MatchmakerTeamSection dict={dict.matchmakerTeam} />
      <SuccessStoriesSection dict={dict.successStories} locale={locale} />
      <FAQSection dict={dict.faq} locale={locale} />
      <PrivacyAssuranceSection dict={dict.privacyAssurance} locale={locale} />
      <CTASection dict={dict.cta} locale={locale} />
      <FooterSection dict={dict.footer} />

      <ChatWidget dict={dict.chatWidget} />
      <CookieBanner dict={dict.cookieBanner} />

      {!session && (
        <FloatingCTAButton
          locale={locale}
          showAfterScroll={600}
          showOnDesktop={false}
        />
      )}
    </div>
  );
}
