// src/components/profile/constants/theme.ts

export type ThemeType = {
  accent: 'rose' | 'blue';
  accentBg: string;
  accentBgHover: string;
  accentBgLight: string;
  accentText: string;
  accentTextDark: string;
  accentBorder: string;
  accentBorderStrong: string;
  accentRing: string;
};

const ROSE_THEME: ThemeType = {
  accent: 'rose',
  accentBg: 'bg-rose-500',
  accentBgHover: 'hover:bg-rose-600',
  accentBgLight: 'bg-rose-50',
  accentText: 'text-rose-500',
  accentTextDark: 'text-rose-700',
  accentBorder: 'border-rose-200',
  accentBorderStrong: 'border-rose-500',
  accentRing: 'ring-rose-200/50',
};

const BLUE_THEME: ThemeType = {
  accent: 'blue',
  accentBg: 'bg-blue-500',
  accentBgHover: 'hover:bg-blue-600',
  accentBgLight: 'bg-blue-50',
  accentText: 'text-blue-500',
  accentTextDark: 'text-blue-700',
  accentBorder: 'border-blue-200',
  accentBorderStrong: 'border-blue-500',
  accentRing: 'ring-blue-200/50',
};

export function getProfileTheme(
  gender: string | null | undefined
): ThemeType {
  return gender === 'MALE' ? BLUE_THEME : ROSE_THEME;
}

export const WORLD_COLORS: Record<
  string,
  { bg: string; text: string; border: string; borderSide: string }
> = {
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    borderSide: 'border-purple-400',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    borderSide: 'border-blue-400',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-200',
    borderSide: 'border-rose-400',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    borderSide: 'border-amber-400',
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
    borderSide: 'border-gray-400',
  },
};
