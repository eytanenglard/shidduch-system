"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

// Import all sections
import HeroSection from "./sections/HeroSection";
import ValuePropositionSection from "./sections/ValuePropositionSection";
import FeaturesSection from "./sections/FeaturesSection";
import AlgorithmSection from "./sections/AlgorithmSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import MatchmakerTeamSection from "./sections/MatchmakerTeamSection";
import SuccessStoriesSection from "./sections/SuccessStoriesSection";
import FAQSection from "./sections/FAQSection";
import PrivacyAssuranceSection from "./sections/PrivacyAssuranceSection";
import CTASection from "./sections/CTASection";
import FooterSection from "./sections/FooterSection";
import { MessageCircle } from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <HeroSection session={session} isVisible={isVisible} />
      <ValuePropositionSection />
      <FeaturesSection />
      <AlgorithmSection />
      <HowItWorksSection />
      <MatchmakerTeamSection />
      <SuccessStoriesSection />
      <FAQSection />
      <PrivacyAssuranceSection />
      <CTASection />
      <FooterSection />

      {/* Floating Contact Button - Enhanced with animation */}
      <div className="fixed bottom-8 left-8 z-50 animate-bounce-slow">
        <Button
          size="lg"
          className="rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 group"
        >
          <MessageCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
          <span className="group-hover:mr-1 transition-all">דברו איתנו</span>
        </Button>
      </div>
    </div>
  );
}