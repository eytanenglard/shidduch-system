// FILENAME: src/types/inbox.ts
// Types for the matchmaker unified inbox

export type InboxThreadType = 'direct' | 'suggestion';

export type InboxFilter = 'all' | 'unread' | 'todo' | 'archived';

export type InboxTodoStatus = 'NONE' | 'TODO' | 'DONE';

export interface InboxPartyInfo {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export interface InboxItem {
  id: string; // threadId: "direct:{userId}" or "suggestion:{suggestionId}"
  threadType: InboxThreadType;
  // For direct: the candidate info. For suggestion: both parties
  candidate?: InboxPartyInfo;
  firstParty?: InboxPartyInfo;
  secondParty?: InboxPartyInfo;
  // Suggestion-specific
  suggestionId?: string;
  suggestionStatus?: string;
  // Message info
  lastMessage: string;
  lastMessageTime: string;
  lastMessageIsFromUser: boolean; // true = user sent it (needs matchmaker response)
  unreadCount: number;
  todoStatus: InboxTodoStatus;
  isArchived: boolean;
}

export interface InboxResponse {
  success: boolean;
  items: InboxItem[];
  totalUnread: number;
  totalTodo: number;
  totalCount: number;
  page: number;
  pageSize: number;
}
