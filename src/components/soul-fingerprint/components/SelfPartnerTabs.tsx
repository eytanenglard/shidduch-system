'use client';

interface Props {
  activeTab: 'self' | 'partner';
  onTabChange: (tab: 'self' | 'partner') => void;
  hasPartnerQuestions: boolean;
  selfCount: number;
  partnerCount: number;
  t: (key: string) => string;
  isRTL: boolean;
}

export default function SelfPartnerTabs({
  activeTab,
  onTabChange,
  hasPartnerQuestions,
  selfCount,
  partnerCount,
  t,
  isRTL,
}: Props) {
  if (!hasPartnerQuestions) return null;

  return (
    <div
      className={`flex bg-gray-100 rounded-xl p-1 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}
    >
      <button
        onClick={() => onTabChange('self')}
        className={`
          flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
          ${
            activeTab === 'self'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }
        `}
      >
        {t('labels.selfLabel')}
        <span className="text-xs text-gray-400 mx-1">({selfCount})</span>
      </button>
      <button
        onClick={() => onTabChange('partner')}
        className={`
          flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
          ${
            activeTab === 'partner'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }
        `}
      >
        {t('labels.partnerLabel')}
        <span className="text-xs text-gray-400 mx-1">({partnerCount})</span>
      </button>
    </div>
  );
}
