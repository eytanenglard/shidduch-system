// NameOverlay.tsx — Name + age + gender at bottom of photo

import React from 'react';
import type { MinimalCardDict } from '../MinimalCard.types';

interface NameOverlayProps {
  name: React.ReactNode;
  age: number;
  gender: string | null | undefined;
  isMale: boolean;
  genderAccent: string;
  dict: MinimalCardDict;
}

const NameOverlay: React.FC<NameOverlayProps> = ({
  name,
  age,
  gender,
  isMale,
  genderAccent,
  dict,
}) => (
  <div className="absolute bottom-0 right-0 left-0 p-4 z-10">
    <div className="text-right">
      <h3 className="font-bold text-white text-lg leading-tight drop-shadow-lg tracking-wide">
        {name}
      </h3>
      <div className="flex items-center justify-end gap-2 mt-1">
        <span className="text-white/90 text-xs font-medium bg-black/25 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {age} {dict.yearsSuffix}
        </span>
        {gender && (
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: `${genderAccent}CC`, color: 'white' }}
          >
            {isMale ? '♂' : '♀'}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default React.memo(NameOverlay);
