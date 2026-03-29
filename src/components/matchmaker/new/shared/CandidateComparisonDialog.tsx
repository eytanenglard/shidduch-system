// CandidateComparisonDialog.tsx — Side-by-side candidate comparison
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import type { Candidate } from '../types/candidates';
import {
  MapPin,
  Calendar,
  Ruler,
  Briefcase,
  GraduationCap,
  Heart,
  BookOpen,
  Globe,
  Star,
} from 'lucide-react';

interface CandidateComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: Candidate[];
}

function calculateAge(birthDate: string | Date): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface CompareRowProps {
  icon: React.ReactNode;
  label: string;
  values: (string | number | null | undefined)[];
  highlight?: boolean;
}

const CompareRow: React.FC<CompareRowProps> = ({ icon, label, values, highlight }) => (
  <div className={cn('grid gap-3 py-2 px-3 rounded-lg', highlight && 'bg-indigo-50/50')}>
    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1">
      {icon}
      {label}
    </div>
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${values.length}, 1fr)` }}>
      {values.map((val, i) => (
        <div key={i} className="text-sm font-medium text-gray-800 text-center">
          {val || <span className="text-gray-300">—</span>}
        </div>
      ))}
    </div>
  </div>
);

const CandidateComparisonDialog: React.FC<CandidateComparisonDialogProps> = ({
  open,
  onOpenChange,
  candidates,
}) => {
  if (candidates.length < 2) return null;

  const pair = candidates.slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">השוואת מועמדים</DialogTitle>
        </DialogHeader>

        {/* Candidate headers */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {pair.map((c) => {
            const mainImage = c.images?.find((img) => img.isMain);
            return (
              <div key={c.id} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 border">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-lg">
                  {mainImage ? (
                    <Image
                      src={getRelativeCloudinaryPath(mainImage.url)}
                      alt={c.firstName}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                      {c.firstName?.[0]}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-800">{c.firstName} {c.lastName}</div>
                  <div className="text-xs text-gray-500">
                    {c.profile?.birthDate && `${calculateAge(c.profile.birthDate)} שנים`}
                  </div>
                </div>
                {c.profile?.availabilityStatus === 'AVAILABLE' && (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px]">פנוי/ה</Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison rows */}
        <div className="space-y-1 divide-y divide-gray-100">
          <CompareRow
            icon={<MapPin className="w-3.5 h-3.5" />}
            label="עיר"
            values={pair.map((c) => c.profile?.city)}
          />
          <CompareRow
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="גיל"
            values={pair.map((c) => c.profile?.birthDate ? calculateAge(c.profile.birthDate) : null)}
            highlight
          />
          <CompareRow
            icon={<Ruler className="w-3.5 h-3.5" />}
            label="גובה"
            values={pair.map((c) => c.profile?.height ? `${c.profile.height} ס"מ` : null)}
          />
          <CompareRow
            icon={<BookOpen className="w-3.5 h-3.5" />}
            label="רמת דתיות"
            values={pair.map((c) => c.profile?.religiousLevel)}
            highlight
          />
          <CompareRow
            icon={<Briefcase className="w-3.5 h-3.5" />}
            label="תחום עיסוק"
            values={pair.map((c) => c.profile?.occupation)}
          />
          <CompareRow
            icon={<GraduationCap className="w-3.5 h-3.5" />}
            label="השכלה"
            values={pair.map((c) => c.profile?.educationLevel)}
          />
          <CompareRow
            icon={<Heart className="w-3.5 h-3.5" />}
            label="מצב משפחתי"
            values={pair.map((c) => c.profile?.maritalStatus)}
          />
          <CompareRow
            icon={<Globe className="w-3.5 h-3.5" />}
            label="שפות"
            values={pair.map((c) => {
              const langs = [c.profile?.nativeLanguage, ...(c.profile?.additionalLanguages || [])].filter(Boolean);
              return langs.length > 0 ? langs.join(', ') : null;
            })}
          />
          <CompareRow
            icon={<Star className="w-3.5 h-3.5" />}
            label="שלמות פרופיל"
            values={pair.map((c) => c.profile?.profileCompletenessScore != null ? `${Math.round(c.profile.profileCompletenessScore)}%` : null)}
            highlight
          />
        </div>

        {/* About sections */}
        {pair.some((c) => c.profile?.about) && (
          <div className="mt-4">
            <div className="text-xs font-bold text-gray-500 mb-2">על עצמי</div>
            <div className="grid grid-cols-2 gap-3">
              {pair.map((c) => (
                <div key={c.id} className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl leading-relaxed max-h-32 overflow-y-auto">
                  {c.profile?.about || <span className="text-gray-300">לא צוין</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CandidateComparisonDialog;
