// src/components/HomePage/HomePage.tsx
// Improvements: #8 removed isVisible state, #9 removed isScrolled state, #4 shared global styles, #50 prefers-reduced-motion

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MotionConfig } from 'framer-motion';

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
import HeartMapCTASection from './sections/HeartMapCTASection';
import SocialProofBar from './components/SocialProofBar';

type DemoData = Awaited<ReturnType<typeof generateDemoData>>;

interface HomePageProps {
  dict: Dictionary;
  demoData: DemoData;
  locale: 'he' | 'en';
}

export default function HomePage({ dict, demoData, locale }: HomePageProps) {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 100);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const navLinks: NavLink[] = [
    { id: 'how-it-works', label: dict.stickyNav.navLinks.howItWorks },
    { id: 'suggestion-demo', label: dict.stickyNav.navLinks.suggestionDemo },
    { id: 'success-stories', label: dict.stickyNav.navLinks.successStories },
    { id: 'our-team', label: dict.stickyNav.navLinks.ourTeam },
    { id: 'faq', label: dict.stickyNav.navLinks.faq },
  ];

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* #4: Shared global keyframe animations used across multiple sections */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes soft-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(0.5deg); }
          75% { transform: translateY(3px) rotate(-0.5deg); }
        }
        .animate-soft-float {
          animation: soft-float 6s ease-in-out infinite;
          will-change: transform;
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
          0%, 100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.3); }
          50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        /* Smooth scrollbar for message containers */
        .messages-container {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          touch-action: pan-y;
          scrollbar-width: thin;
          scrollbar-color: #14b8a6 rgba(243, 244, 246, 0.5);
        }
        .messages-container::-webkit-scrollbar { width: 8px; }
        .messages-container::-webkit-scrollbar-track { background: rgba(243, 244, 246, 0.5); border-radius: 10px; margin: 4px 0; }
        .messages-container::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #14b8a6, #f97316); border-radius: 10px; border: 2px solid rgba(243, 244, 246, 0.5); }
        .messages-container::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #0d9488, #ea580c); }

        /* Respect reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .animate-float-slow,
          .animate-soft-float,
          .animate-gentle-pulse,
          .animate-gradient,
          .animate-pulse-glow,
          .animate-shimmer,
          .animate-pulse-slow {
            animation: none !important;
          }
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
      <SocialProofBar dict={dict.socialProof} />
      <ValuePropositionSection dict={dict.valueProposition} />

      <HeartMapCTASection dict={dict.heartMapCTA} locale={locale} />

      <NeshmaInsightSectionB locale={locale} dict={dict.neshmaInsight} session={session} />

      <OurMethodSection dict={dict.ourMethod} />

      <HowItWorksSection
        dict={dict.howItWorks}
        suggestionsDict={dict.suggestions}
        profileCardDict={dict.profilePage.profileCard}
        demoData={demoData}
        locale={locale}
      />

      <PrivacyAssuranceSection dict={dict.privacyAssurance} locale={locale} />

      <MatchmakerTeamSection dict={dict.matchmakerTeam} />
      <SuccessStoriesSection dict={dict.successStories} locale={locale} />
      <FAQSection dict={dict.faq} locale={locale} />
      <CTASection dict={dict.cta} locale={locale} session={session} />
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
    </MotionConfig>
  );
}
