'use client';

import Link from 'next/link';

interface Props {
  isCompleted: boolean;
  locale: string;
  t: (key: string) => string;
  isRTL: boolean;
}

export default function SoulFingerprintCTA({ isCompleted, locale, t, isRTL }: Props) {
  return (
    <Link href={`/${locale}/soul-fingerprint`}>
      <div
        className={`
          relative overflow-hidden rounded-2xl p-5 cursor-pointer
          transition-all duration-300 hover:shadow-lg hover:scale-[1.01]
          ${
            isCompleted
              ? 'bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200'
              : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
          }
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {!isCompleted && (
          <div className="absolute top-2 right-2">
            <span className="inline-block bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {t('welcome.badge')}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
            {isCompleted ? '✅' : '✨'}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={`text-base font-semibold ${isCompleted ? 'text-teal-700' : 'text-white'}`}
            >
              {isCompleted ? t('completion.edit') : t('welcome.title')}
            </h3>
            <p
              className={`text-sm mt-0.5 ${isCompleted ? 'text-teal-600' : 'text-white/80'}`}
            >
              {isCompleted
                ? t('completion.subtitle')
                : `${t('welcome.subtitle')} - ${t('welcome.time')}`}
            </p>
          </div>
          <svg
            className={`w-5 h-5 flex-shrink-0 ${isCompleted ? 'text-teal-500' : 'text-white/60'} ${
              isRTL ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
