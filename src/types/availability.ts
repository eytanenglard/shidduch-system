import { AvailabilityStatus } from "@prisma/client";

export interface AvailabilityInquiryResponse {
  isAvailable: boolean;
  note?: string;
}

export interface AvailabilityStats {
  available: number;
  unavailable: number;
  dating: number;
  pending: number;
}

export interface AvailabilityNotification {
  id: string;
  type: 'INQUIRY_RESPONSE' | 'INQUIRY_RECEIVED';
  status: 'UNREAD' | 'READ';
  createdAt: Date;
}

export interface AvailabilityFilter {
  status: AvailabilityStatus | "all";
  includeNoResponse: boolean;
  timeframe?: 'today' | 'week' | 'month' | 'all';
}