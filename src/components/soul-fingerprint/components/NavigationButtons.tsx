'use client';

interface Props {
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLastSection: boolean;
  isPartnerTab: boolean;
  hasPartnerQuestions: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  hasUnansweredRequired: boolean;
  unansweredCount: number;
  onScrollToUnanswered: () => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export default function NavigationButtons({
  onNext,
  onBack,
  canGoBack,
  isLastSection,
  isPartnerTab,
  hasPartnerQuestions,
  saveStatus,
  hasUnansweredRequired,
  unansweredCount,
  onScrollToUnanswered,
  t,
  isRTL,
}: Props) {
  const nextLabel =
    isLastSection && (isPartnerTab || !hasPartnerQuestions)
      ? t('completion.cta')
      : isPartnerTab || !hasPartnerQuestions
      ? t('labels.next')
      : t('labels.partnerSectionIntro');

  const handleClick = () => {
    if (hasUnansweredRequired) {
      onScrollToUnanswered();
    } else {
      onNext();
    }
  };

  return (
    <div className="mt-8">
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        {canGoBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('labels.back')}
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-400 animate-pulse">{t('labels.saving')}</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-500">{t('labels.saved')}</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-500">{t('labels.saveError')}</span>
          )}
          <button
            onClick={handleClick}
            className={`
              px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm
              ${
                hasUnansweredRequired
                  ? 'bg-gray-300 text-gray-500 hover:bg-gray-400 hover:text-gray-600'
                  : 'bg-teal-500 text-white hover:bg-teal-600 hover:shadow-md'
              }
            `}
          >
            {nextLabel}
            <svg
              className={`w-4 h-4 inline-block ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {hasUnansweredRequired && (
        <div className={`mt-3 ${isRTL ? 'text-right' : 'text-left'}`}>
          <button
            onClick={onScrollToUnanswered}
            className="text-xs text-red-400 hover:text-red-500 transition-colors"
          >
            {t('labels.unansweredHint').replace('{{count}}', String(unansweredCount))}
            {' '}
            <span className="underline">{t('labels.showUnanswered')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
