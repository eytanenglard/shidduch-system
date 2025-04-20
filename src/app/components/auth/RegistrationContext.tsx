"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Gender } from '@prisma/client';

// Define the structure of the registration data
export interface RegistrationData {
  // Basic info
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  
  // Personal details
  phone: string;
  gender: Gender | '';
  birthDate: string;
  maritalStatus: string;
  
  // Optional info
  height?: number;
  occupation?: string;
  education?: string;
  
  // Additional state
  step: number;
  isGoogleSignup: boolean;
}

// Default initial state
const initialRegistrationData: RegistrationData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  gender: '',
  birthDate: '',
  maritalStatus: '',
  height: undefined,
  occupation: '',
  education: '',
  step: 0,
  isGoogleSignup: false
};

// Define context type
interface RegistrationContextType {
  data: RegistrationData;
  setData: React.Dispatch<React.SetStateAction<RegistrationData>>;
  updateField: <K extends keyof RegistrationData>(
    field: K,
    value: RegistrationData[K]
  ) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  isLastStep: () => boolean;
  resetForm: () => void;
  setGoogleSignup: (data: Partial<RegistrationData>) => void;
}

// Create context with default values
const RegistrationContext = createContext<RegistrationContextType>({
  data: initialRegistrationData,
  setData: () => {},
  updateField: () => {},
  nextStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
  isLastStep: () => false,
  resetForm: () => {},
  setGoogleSignup: () => {}
});

// Provider component
export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<RegistrationData>({ ...initialRegistrationData });

  // Total number of steps in registration flow
  const TOTAL_STEPS = 4; // 0=welcome, 1=basic info, 2=personal details, 3=optional info, 4=complete

  // Update a single field
  const updateField = <K extends keyof RegistrationData>(
    field: K,
    value: RegistrationData[K]
  ) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Navigation functions
  const nextStep = () => {
    if (data.step < TOTAL_STEPS) {
      setData(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const prevStep = () => {
    if (data.step > 0) {
      setData(prev => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step <= TOTAL_STEPS) {
      setData(prev => ({ ...prev, step }));
    }
  };

  const isLastStep = () => {
    return data.step === TOTAL_STEPS;
  };

  // Reset the form
  const resetForm = () => {
    setData({ ...initialRegistrationData });
  };

  // Set up data for Google signup
  const setGoogleSignup = (googleData: Partial<RegistrationData>) => {
    setData(prev => ({
      ...prev,
      ...googleData,
      isGoogleSignup: true,
      // Skip to personal details if we have basic info
      step: googleData.email && googleData.firstName && googleData.lastName ? 2 : 1
    }));
  };

  const value = {
    data,
    setData,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    isLastStep,
    resetForm,
    setGoogleSignup
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};

// Custom hook for using the registration context
export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};