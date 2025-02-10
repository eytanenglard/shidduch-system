// src/types/profile.ts
import { AvailabilityStatus, Profile } from "@prisma/client";

export interface UpdateAvailabilityRequest {
 availabilityStatus: AvailabilityStatus;
 availabilityNote?: string | null;
}

export interface ApiResponse<T = Profile> {
 success: boolean;
 profile?: T;
 error?: string;
}