"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
// import { Button } from "@/components/ui/button"; // כבר לא צריך את Button ישירות כאן
// import { MessageCircle } from "lucide-react"; // גם את האייקון הישן לא צריך

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

// 1. Import our new ChatWidget
//    הנתיב היחסי מ-HomePage ל-ChatWidget
import ChatWidget from "../ChatWidget/ChatWidget";

export default function HomePage() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    // The main div should allow the chat widget to be fixed relative to the viewport
    <div className="min-h-screen w-full overflow-x-hidden">
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

      {/* 2. Remove the old floating button */}
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
      
      {/* 3. Add our new, shiny Chat Widget */}
      <ChatWidget />
    </div>
  );
}