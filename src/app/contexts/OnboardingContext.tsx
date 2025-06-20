"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingContextType {
  isTourActive: boolean;
  startTour: () => void;
  endTour: () => void;
  currentStep: number;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // כאן תוסיף לוגיקה לבדוק אם המשתמש כבר עשה את הסיור (למשל מ-localStorage)
  
  const startTour = () => { setIsTourActive(true); setCurrentStep(1); };
  const endTour = () => { setIsTourActive(false); setCurrentStep(0); /* שמור ב-localStorage שהסיור הושלם */ };
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => Math.max(0, prev - 1));
const goToStep = (step: number) => setCurrentStep(step); // <--- הוסף שורה זו

  return (
    <OnboardingContext.Provider value={{ isTourActive, startTour, endTour, currentStep, nextStep, prevStep, goToStep  }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};