'use client';

import Link from 'next/link';

interface Props {
  isCompleted: boolean;
  locale: string;
  t: (key: string) => string;
  isRTL: boolean;
  completionPercentage?: number; // 0-100
}

export default function SoulFingerprintCTA({ isCompleted, locale, t, isRTL, completionPercentage = 0 }: Props) {
  const showProgress = !isCompleted && completionPercentage > 0;

  return (
    <Link href={`/${locale}/soul-fingerprint`}>
      <div
        className={`
          relative overflow-hidden rounded-2xl p-5 cursor-pointer
          transition-all duration-300 hover:shadow-lg hover:scale-[1.01]
          ${
            isCompleted
              ? 'bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200'
              : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-200'
          }
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {!isCompleted && !showProgress && (
          <div className="absolute top-2 right-2">
            <span className="inline-block bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {t('welcome.badge')}
            </span>
          </div>
        )}

        {showProgress && (
          <div className="absolute top-2 right-2">
            <span className="inline-block bg-white/25 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {completionPercentage}%
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 flex-shrink-0">
            {showProgress ? (
              <>
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(completionPercentage / 100) * 125.66} 125.66`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                  ✨
                </span>
              </>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                {isCompleted ? '✅' : '✨'}
              </div>
            )}
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
                : showProgress
                  ? (isRTL ? `מילאת ${completionPercentage}% מהשאלון — בוא/י נמשיך!` : `${completionPercentage}% completed — let's continue!`)
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

        {showProgress && (
          <div className="mt-3">
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
