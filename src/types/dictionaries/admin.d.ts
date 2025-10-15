// src/types/dictionaries/admin.d.ts

export type EngagementDictionary = {
  title: string;
  subtitle: string;
  loading: string;
  stats: {
    todayEmails: string;
    weeklyEmails: string;
    activeUsers: string;
    inProgress: string;
  };
  campaign: {
    nextRun: string;
    tomorrow: string;
    runNow: string;
  };
  charts: {
    emailTypesTitle: string;
    recentActivityTitle: string;
  };
  emailTypes: {
    onboarding: string;
    nudge: string;
    celebration: string;
    insight: string;
    value: string;
    eveningFeedback: string;
    aiSummary: string;
  };
  activity: {
    sent: string;
    failed: string;
  };
  manualEmail: {
    title: string;
    selectUser: string;
    userPlaceholder: string;
    emailType: string;
    emailTypePlaceholder: string;
    send: string;
    sending: string;
    tip: string;
    alerts: {
      selectUser: string;
      success: string;
      error: string;
    };
  };
  cronJobs: {
    title: string;
    morning: {
      title: string;
      schedule: string;
      lastRun: string;
    };
    evening: {
      title: string;
      schedule: string;
      nextRun: string;
    };
    status: {
      active: string;
    };
  };
};

export type AdminDictionary = {
  engagement: EngagementDictionary;
};