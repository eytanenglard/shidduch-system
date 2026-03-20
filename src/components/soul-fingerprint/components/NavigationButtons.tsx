'use client';

interface Props {
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLastSection: boolean;
  isPartnerTab: boolean;
  hasPartnerQuestions: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
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
  t,
  isRTL,
}: Props) {
  const nextLabel =
    isLastSection && (isPartnerTab || !hasPartnerQuestions)
      ? t('completion.cta')
      : isPartnerTab || !hasPartnerQuestions
      ? t('labels.next')
      : t('labels.partnerSectionIntro');

  return (
    <div className={`flex items-center justify-between mt-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-colors shadow-sm hover:shadow-md"
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
  );
}
