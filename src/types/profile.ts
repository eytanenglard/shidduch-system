// src/types/profile.ts
import { AvailabilityStatus } from "@prisma/client";

export interface UpdateAvailabilityRequest {
  availabilityStatus: AvailabilityStatus;
  availabilityNote?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  profile?: T;
  error?: string;
}