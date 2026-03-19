// src/components/profile/constants/theme.ts

export const COLOR_PALETTES = {
  professional: {
    name: 'כחול-אפור',
    colors: {
      primary: {
        main: 'from-gray-700 via-gray-800 to-gray-900',
        mainSm: 'from-gray-600 via-gray-700 to-gray-800',
        accent: 'from-blue-600 via-blue-700 to-blue-800',
        accentSm: 'from-blue-500 via-blue-600 to-blue-700',
        light: 'from-gray-100 via-gray-200 to-gray-300',
        lightSm: 'from-gray-50 via-gray-100 to-gray-200',
        romantic: 'from-blue-600 via-blue-700 to-blue-800',
        romanticSm: 'from-blue-500 via-blue-600 to-blue-700',
        rose: 'from-blue-500 via-blue-600 to-blue-700',
        roseSm: 'from-blue-400 via-blue-500 to-blue-600',
        gold: 'from-gray-400 via-gray-500 to-gray-600',
        goldSm: 'from-gray-300 via-gray-400 to-gray-500',
        elegant: 'from-gray-700 via-gray-800 to-gray-900',
        elegantSm: 'from-gray-600 via-gray-700 to-gray-800',
      },
      secondary: {
        sage: 'from-gray-300 via-gray-400 to-gray-500',
        sageSm: 'from-gray-200 via-gray-300 to-gray-400',
        sky: 'from-blue-100 via-blue-200 to-blue-300',
        skySm: 'from-blue-50 via-blue-100 to-blue-200',
        lavender: 'from-gray-200 via-gray-300 to-gray-400',
        lavenderSm: 'from-gray-100 via-gray-200 to-gray-300',
        peach: 'from-orange-100 via-amber-100 to-yellow-200',
        peachSm: 'from-orange-50 via-amber-50 to-yellow-100',
      },
      neutral: {
        warm: 'from-gray-50 via-white to-gray-100',
        warmSm: 'from-gray-25 via-white to-gray-50',
        cool: 'from-slate-50 via-gray-50 to-zinc-50',
        coolSm: 'from-slate-25 via-gray-25 to-zinc-25',
        elegant: 'from-white via-gray-50 to-neutral-100',
        elegantSm: 'from-white via-gray-25 to-neutral-50',
      },
    },
    shadows: {
      elegant: 'shadow-lg sm:shadow-xl shadow-gray-200/25',
      elegantSm: 'shadow-md shadow-gray-200/20',
      warm: 'shadow-md sm:shadow-lg shadow-gray-200/30',
      warmSm: 'shadow-sm shadow-gray-200/25',
      soft: 'shadow-sm sm:shadow-md shadow-gray-100/40',
      softSm: 'shadow-xs shadow-gray-100/30',
    },
  },
  feminine: {
    name: 'ורוד-אדום',
    colors: {
      primary: {
        main: 'from-rose-400 via-pink-400 to-rose-500',
        mainSm: 'from-rose-300 via-pink-300 to-rose-400',
        accent: 'from-pink-500 via-rose-500 to-red-400',
        accentSm: 'from-pink-400 via-rose-400 to-red-300',
        light: 'from-pink-100 via-rose-100 to-red-100',
        lightSm: 'from-pink-50 via-rose-50 to-red-50',
        romantic: 'from-rose-400 via-pink-400 to-rose-500',
        romanticSm: 'from-rose-300 via-pink-300 to-rose-400',
        rose: 'from-rose-400 via-pink-400 to-rose-500',
        roseSm: 'from-rose-300 via-pink-300 to-rose-400',
        gold: 'from-amber-200 via-yellow-200 to-orange-300',
        goldSm: 'from-amber-100 via-yellow-100 to-orange-200',
        elegant: 'from-pink-500 via-rose-500 to-red-400',
        elegantSm: 'from-pink-400 via-rose-400 to-red-300',
      },
      secondary: {
        sage: 'from-pink-200 via-rose-200 to-red-200',
        sageSm: 'from-pink-100 via-rose-100 to-red-100',
        sky: 'from-purple-200 via-pink-200 to-rose-300',
        skySm: 'from-purple-100 via-pink-100 to-rose-200',
        lavender: 'from-purple-200 via-violet-200 to-purple-300',
        lavenderSm: 'from-purple-100 via-violet-100 to-purple-200',
        peach: 'from-pink-200 via-rose-200 to-orange-300',
        peachSm: 'from-pink-100 via-rose-100 to-orange-200',
      },
      neutral: {
        warm: 'from-rose-50 via-pink-50 to-orange-50',
        warmSm: 'from-rose-25 via-pink-25 to-orange-25',
        cool: 'from-purple-50 via-pink-50 to-rose-50',
        coolSm: 'from-purple-25 via-pink-25 to-rose-25',
        elegant: 'from-pink-50 via-rose-50 to-neutral-100',
        elegantSm: 'from-pink-25 via-rose-25 to-neutral-50',
      },
    },
    shadows: {
      elegant: 'shadow-lg sm:shadow-xl shadow-pink-200/25',
      elegantSm: 'shadow-md shadow-pink-200/20',
      warm: 'shadow-md sm:shadow-lg shadow-rose-200/30',
      warmSm: 'shadow-sm shadow-rose-200/25',
      soft: 'shadow-sm sm:shadow-md shadow-pink-100/40',
      softSm: 'shadow-xs shadow-pink-100/30',
    },
  },
  masculine: {
    name: 'כחול-ירוק',
    colors: {
      primary: {
        main: 'from-blue-600 via-indigo-600 to-blue-700',
        mainSm: 'from-blue-500 via-indigo-500 to-blue-600',
        accent: 'from-cyan-500 via-blue-500 to-indigo-600',
        accentSm: 'from-cyan-400 via-blue-400 to-indigo-500',
        light: 'from-blue-100 via-indigo-100 to-cyan-100',
        lightSm: 'from-blue-50 via-indigo-50 to-cyan-50',
        romantic: 'from-cyan-500 via-blue-500 to-indigo-600',
        romanticSm: 'from-cyan-400 via-blue-400 to-indigo-500',
        rose: 'from-cyan-500 via-blue-500 to-indigo-600',
        roseSm: 'from-cyan-400 via-blue-400 to-indigo-500',
        gold: 'from-blue-200 via-cyan-200 to-teal-300',
        goldSm: 'from-blue-100 via-cyan-100 to-teal-200',
        elegant: 'from-blue-600 via-indigo-600 to-blue-700',
        elegantSm: 'from-blue-500 via-indigo-500 to-blue-600',
      },
      secondary: {
        sage: 'from-emerald-300 via-teal-300 to-cyan-400',
        sageSm: 'from-emerald-200 via-teal-200 to-cyan-300',
        sky: 'from-blue-200 via-sky-200 to-indigo-300',
        skySm: 'from-blue-100 via-sky-100 to-indigo-200',
        lavender: 'from-indigo-200 via-blue-200 to-cyan-300',
        lavenderSm: 'from-indigo-100 via-blue-100 to-cyan-200',
        peach: 'from-blue-200 via-cyan-200 to-teal-300',
        peachSm: 'from-blue-100 via-cyan-100 to-teal-200',
      },
      neutral: {
        warm: 'from-blue-50 via-indigo-50 to-cyan-50',
        warmSm: 'from-blue-25 via-indigo-25 to-cyan-25',
        cool: 'from-slate-50 via-blue-50 to-indigo-50',
        coolSm: 'from-slate-25 via-blue-25 to-indigo-25',
        elegant: 'from-gray-50 via-blue-50 to-neutral-100',
        elegantSm: 'from-gray-25 via-blue-25 to-neutral-50',
      },
    },
    shadows: {
      elegant: 'shadow-lg sm:shadow-xl shadow-blue-200/25',
      elegantSm: 'shadow-md shadow-blue-200/20',
      warm: 'shadow-md sm:shadow-lg shadow-indigo-200/30',
      warmSm: 'shadow-sm shadow-indigo-200/25',
      soft: 'shadow-sm sm:shadow-md shadow-blue-100/40',
      softSm: 'shadow-xs shadow-blue-100/30',
    },
  },
  luxury: {
    name: 'זהב-סגול',
    colors: {
      primary: {
        main: 'from-amber-500 via-yellow-500 to-amber-600',
        mainSm: 'from-amber-400 via-yellow-400 to-amber-500',
        accent: 'from-purple-600 via-indigo-600 to-purple-700',
        accentSm: 'from-purple-500 via-indigo-500 to-purple-600',
        light: 'from-amber-100 via-yellow-100 to-gold-100',
        lightSm: 'from-amber-50 via-yellow-50 to-gold-50',
        romantic: 'from-purple-600 via-indigo-600 to-purple-700',
        romanticSm: 'from-purple-500 via-indigo-500 to-purple-600',
        rose: 'from-purple-600 via-indigo-600 to-purple-700',
        roseSm: 'from-purple-500 via-indigo-500 to-purple-600',
        gold: 'from-amber-500 via-yellow-500 to-amber-600',
        goldSm: 'from-amber-400 via-yellow-400 to-amber-500',
        elegant: 'from-amber-500 via-yellow-500 to-amber-600',
        elegantSm: 'from-amber-400 via-yellow-400 to-amber-500',
      },
      secondary: {
        sage: 'from-emerald-400 via-teal-400 to-cyan-500',
        sageSm: 'from-emerald-300 via-teal-300 to-cyan-400',
        sky: 'from-indigo-300 via-purple-300 to-violet-400',
        skySm: 'from-indigo-200 via-purple-200 to-violet-300',
        lavender: 'from-purple-300 via-violet-300 to-indigo-400',
        lavenderSm: 'from-purple-200 via-violet-200 to-indigo-300',
        peach: 'from-amber-300 via-yellow-300 to-orange-400',
        peachSm: 'from-amber-200 via-yellow-200 to-orange-300',
      },
      neutral: {
        warm: 'from-amber-50 via-yellow-50 to-orange-50',
        warmSm: 'from-amber-25 via-yellow-25 to-orange-25',
        cool: 'from-purple-50 via-indigo-50 to-violet-50',
        coolSm: 'from-purple-25 via-indigo-25 to-violet-25',
        elegant: 'from-gray-50 via-amber-50 to-neutral-100',
        elegantSm: 'from-gray-25 via-amber-25 to-neutral-50',
      },
    },
    shadows: {
      elegant: 'shadow-lg sm:shadow-xl shadow-amber-200/25',
      elegantSm: 'shadow-md shadow-amber-200/20',
      warm: 'shadow-md sm:shadow-lg shadow-yellow-200/30',
      warmSm: 'shadow-sm shadow-yellow-200/25',
      soft: 'shadow-sm sm:shadow-md shadow-amber-100/40',
      softSm: 'shadow-xs shadow-amber-100/30',
    },
  },
} as const;

export type ColorPaletteName = keyof typeof COLOR_PALETTES;

export type ThemeType = {
  colors: {
    primary: {
      main: string;
      mainSm: string;
      accent: string;
      accentSm: string;
      light: string;
      lightSm: string;
      romantic: string;
      romanticSm: string;
      rose: string;
      roseSm: string;
      gold: string;
      goldSm: string;
      elegant: string;
      elegantSm: string;
    };
    secondary: {
      sage: string;
      sageSm: string;
      sky: string;
      skySm: string;
      lavender: string;
      lavenderSm: string;
      peach: string;
      peachSm: string;
    };
    neutral: {
      warm: string;
      warmSm: string;
      cool: string;
      coolSm: string;
      elegant: string;
      elegantSm: string;
    };
  };
  shadows: {
    elegant: string;
    elegantSm: string;
    warm: string;
    warmSm: string;
    soft: string;
    softSm: string;
  };
};
