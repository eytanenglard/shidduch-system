// src/types/invitation.ts
import { Gender } from "@prisma/client";

export interface InvitationPersonalInfo {
  height?: number;
  maritalStatus?: string;
  occupation?: string;
  education?: string;
  religiousLevel?: string;
  city?: string;
}

export interface InvitationMetadata {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  personalInfo?: InvitationPersonalInfo;
  matchingNotes?: string;
}

export interface InvitationResponse {
  email: string;
  firstName: string;
  lastName: string;
  matchmaker: {
    name: string;
  };
  metadata: InvitationMetadata;
}