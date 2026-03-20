'use client';

interface Props {
  onStart: () => void;
  onSkip: () => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export default function SoulFingerprintWelcome({ onStart, onSkip, t, isRTL }: Props) {
  return (
    <div className="max-w-lg mx-auto text-center py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Badge */}
      <span className="inline-block bg-teal-100 text-teal-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
        {t('welcome.badge')}
      </span>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('welcome.title')}</h1>
      <p className="text-lg text-teal-600 font-medium mb-4">{t('welcome.subtitle')}</p>
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-8">
        {t('welcome.description')}
      </p>

      {/* Why it matters */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-start">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('welcome.whyMatters.title')}</h3>
        <ul className="space-y-2">
          {['point1', 'point2', 'point3'].map((key) => (
            <li key={key} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-teal-500 mt-0.5 flex-shrink-0">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              {t(`welcome.whyMatters.${key}`)}
            </li>
          ))}
        </ul>
      </div>

      {/* Time estimate + privacy */}
      <p className="text-xs text-gray-400 mb-6">{t('welcome.time')} | {t('welcome.privacy')}</p>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-base font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg mb-3"
      >
        {t('welcome.cta')}
      </button>
      <button
        onClick={onSkip}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        {t('welcome.skip')}
      </button>
    </div>
  );
}
