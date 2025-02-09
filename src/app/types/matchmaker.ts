import type { Suggestion, CreateSuggestionData, SuggestionCommunication } from './suggestions';
import { Profile, AvailabilityStatus, Gender, UserStatus, User } from "@prisma/client";
export type { Gender, UserStatus };

// Status Types
export type ClientStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'INACTIVE';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

// Base Information Interfaces
export interface PersonalInfo {
  height?: number;
  maritalStatus?: string;
  occupation?: string;
  education?: string;
  religiousLevel?: string;
  origin?: string;
  city?: string;
  address?: string;
}

export interface FamilyInfo {
  parentStatus?: string;
  siblings?: number;
  position?: number;
}

export interface PrivacyPreferences {
  contactPreference?: string;
  isProfileVisible?: boolean;
  allowDirectMessages?: boolean;
  preferredMatchmakerGender?: Gender;
}

export interface References {
  referenceName1?: string;
  referencePhone1?: string;
  referenceName2?: string;
  referencePhone2?: string;
}

export interface ContactInfo {
  method: 'EMAIL' | 'PHONE' | 'WHATSAPP';
  value: string;
}

// Core Client Interfaces

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender: Gender;
  birthDate: string;
  status: UserStatus;
  personalInfo?: {
    height?: number;
    maritalStatus?: string;
    occupation?: string;
    education?: string;
    religiousLevel?: string;
    city?: string;
  };
  profile?: Profile | null; 
  contactPreferences: ContactInfo[];
  location: string;
  lastActive: string;
}
export interface ExtendedClient extends Client {
  invitation?: {
    status: InvitationStatus;
    email?: string;
    expiresAt?: string;
  };
  latestInquiry?: {
    firstPartyResponse: boolean | null;
    secondPartyResponse: boolean | null;
    updatedAt: string;
    expiresAt: string;
  };
}
export interface Invitation {
  id: string;
  userId: string;
  matchmakerId: string;
  token: string;
  email: string;
  expires: Date;
  status: InvitationStatus;
  createdAt: Date;
  updatedAt: Date;
}

// נוסיף טיפוס חדש עבור תצוגת הזמנה מקוצרת
export interface InvitationDisplay {
  status: InvitationStatus;
  email?: string;
  expiresAt?: string;
}


// Form Data Interfaces
export interface CreateCandidateData {
  // Basic Information
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender: Gender;
  birthDate: string;
  status: UserStatus;
  sendInvitation: boolean;

  // Personal Information
  personalInfo: PersonalInfo;
  familyInfo: FamilyInfo;
  privacyPreferences: PrivacyPreferences;
  references: References;
  
  // Additional Information
  about?: string;
  matchingNotes?: string;
}

export interface FilterOptions {
  gender: 'all' | Gender;
  religiousLevel: string;
  status: 'all' | ClientStatus;
  hasInvitation: 'all' | 'sent' | 'pending' | 'accepted';
  ageRange: {
    min: number;
    max: number;
  };
}

export interface AvailabilityInquiry {
  id: string;
  matchmakerId: string;
  firstPartyId: string;
  secondPartyId: string;
  firstPartyResponse: boolean | null;
  secondPartyResponse: boolean | null;
  note: string | null;
  createdAt: Date;
  expiresAt: Date;
  matchmaker: User;
  firstParty: User;
  secondParty: User;
}
// Component Props Types
export interface ClientCardProps {
  client: ExtendedClient;
  onSuggest: (client: ExtendedClient) => void;
  onSendInvite: () => void;
  onCheckAvailability?: (client: ExtendedClient) => Promise<void>;
}

export interface NewSuggestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: ExtendedClient | null;
  onSubmit: (data: any) => Promise<void>;
}

export interface SuggestionCardProps {
  suggestion: Suggestion;
  onSend: (suggestion: Suggestion, partyType: 'first' | 'second') => Promise<void>;
}