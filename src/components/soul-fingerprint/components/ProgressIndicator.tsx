'use client';

import type { SectionId } from '../types';

interface SectionProgressItem {
  sectionId: SectionId;
  total: number;
  answered: number;
  isComplete: boolean;
}

interface Props {
  sections: SectionProgressItem[];
  currentIndex: number;
  onSectionClick: (index: number) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const SECTION_ICONS = ['🌟', '🪞', '🌳', '✨', '💼', '🎯', '🏡', '💞'];

export default function ProgressIndicator({
  sections,
  currentIndex,
  onSectionClick,
  t,
  isRTL,
}: Props) {
  return (
    <div className="w-full mb-6">
      {/* Section dots */}
      <div className={`flex justify-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {sections.map((section, i) => {
          const isCurrent = i === currentIndex;
          const isCompleted = section.isComplete;
          return (
            <button
              key={section.sectionId}
              onClick={() => onSectionClick(i)}
              className={`
                relative w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-300
                ${
                  isCurrent
                    ? 'bg-teal-100 ring-2 ring-teal-500 ring-offset-2 scale-110'
                    : isCompleted
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }
              `}
              title={t(`progress.${section.sectionId}`)}
            >
              {isCompleted && !isCurrent ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span>{SECTION_ICONS[i]}</span>
              )}
              {isCurrent && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Current section info */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          {t('progress.sectionOf')
            .replace('{{current}}', String(currentIndex + 1))
            .replace('{{total}}', String(sections.length))}
        </p>
        {sections[currentIndex] && (
          <div className="mt-1 flex justify-center">
            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    sections[currentIndex].total > 0
                      ? (sections[currentIndex].answered / sections[currentIndex].total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
