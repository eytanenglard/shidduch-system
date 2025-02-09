import { AvailabilityInquiry, User, Profile } from '@prisma/client';

export interface ExtendedInquiry extends AvailabilityInquiry {
    matchmaker: {
      firstName: string;
      lastName: string;
    };
    firstParty: {
      firstName: string;
      lastName: string;
      email: string;
      profile: Profile | null;
    };
  }

export interface NotificationCount {
  availabilityRequests: number;
  messages: number;
  total: number;
}

export interface MessageFilters {
  status?: 'pending' | 'completed' | 'expired';
  timeframe?: 'today' | 'week' | 'month' | 'all';
}