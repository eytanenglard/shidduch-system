// src/types/shidduchCard.ts
// Type definitions for the AI-generated Shidduch Card (כרטיס שידוכים)

export interface ShidduchCard {
  headline: string;
  aboutMe: string;
  lookingFor: string;
  strengthTags: string[];
  coreTags: string[];
  lifestyleSummary: string;
  closingLine: string;
}

export interface ShidduchCardMeta {
  firstName: string;
  age: number;
  city: string;
  religiousLevel: string;
  gender: 'MALE' | 'FEMALE';
  height?: number;
  occupation?: string;
  education?: string;
  maritalStatus?: string;
}

export interface ShidduchCardFull {
  card: ShidduchCard;
  meta: ShidduchCardMeta;
}

export function isValidShidduchCard(data: unknown): data is ShidduchCard {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  const requiredStrings = ['headline', 'aboutMe', 'lookingFor', 'lifestyleSummary', 'closingLine'];
  for (const key of requiredStrings) {
    if (typeof obj[key] !== 'string') return false;
  }

  if (!Array.isArray(obj.strengthTags)) return false;
  if (!Array.isArray(obj.coreTags)) return false;

  return true;
}
