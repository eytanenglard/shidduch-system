// src/components/suggestions/presentation/CompatibilityHighlights.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, BookOpen, Scroll, MapPin, Heart } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility is available or just use template literals

interface ProfileData {
  religiousLevel?: string | null;
  education?: string | null;
  city?: string | null;
  occupation?: string | null;
}

interface CompatibilityHighlightsProps {
  firstPartyProfile: ProfileData;
  secondPartyProfile: ProfileData;
  matchingReason?: string | null;
}

interface Highlight {
  icon: React.ElementType;
  title: string;
  description: string;
  color: 'teal' | 'orange' | 'rose' | 'emerald' | 'amber'; // Constrained to palette
}

// Helper to get classes based on color name
const getColorClasses = (color: string) => {
  const map: Record<string, string> = {
    teal: 'border-teal-200 bg-teal-50 text-teal-800 icon-bg-teal-500',
    orange: 'border-orange-200 bg-orange-50 text-orange-800 icon-bg-orange-500',
    rose: 'border-rose-200 bg-rose-50 text-rose-800 icon-bg-rose-500',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 icon-bg-emerald-500',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 icon-bg-amber-500',
  };
  return map[color] || map.teal;
};

const CompatibilityHighlights: React.FC<CompatibilityHighlightsProps> = ({ firstPartyProfile, secondPartyProfile, matchingReason }) => {
  const highlights: Highlight[] = [];

  // 1. Religious Level -> Teal (Faith/Knowledge)
  if (firstPartyProfile.religiousLevel && firstPartyProfile.religiousLevel === secondPartyProfile.religiousLevel) {
    highlights.push({ icon: Scroll, title: "השקפת עולם דומה", description: `שניכם הגדרתם את עצמכם כ: ${firstPartyProfile.religiousLevel}`, color: 'teal' });
  }

  // 2. Location -> Orange (Physical/Place)
  if (firstPartyProfile.city && firstPartyProfile.city === secondPartyProfile.city) {
    highlights.push({ icon: MapPin, title: "קירבה גיאוגרפית", description: `שניכם גרים ב${firstPartyProfile.city}`, color: 'orange' });
  }

  // 3. Education -> Amber (Achievement)
  if (firstPartyProfile.education && secondPartyProfile.education) {
     highlights.push({ icon: BookOpen, title: "רקע והשכלה", description: `רקע לימודי ותעסוקתי שמשתלב היטב`, color: 'amber' });
  }
  
  // 4. From matching reason text -> Rose (Heart/Personality)
  const reasonText = matchingReason?.toLowerCase() || '';
  if (reasonText.includes('אופי') || reasonText.includes('אישיות')) {
     highlights.push({ icon: Heart, title: "התאמה אישיותית", description: 'השדכן/ית זיהו פוטנציאל לחיבור עמוק ברמה האישית.', color: 'rose' });
  }

  if (highlights.length === 0) {
      // Default -> Emerald (Positive)
      highlights.push({ icon: Check, title: "פוטנציאל להתאמה", description: 'השדכן/ית זיהו כאן הזדמנות שכדאי לבדוק!', color: 'emerald' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-center">נקודות החיבור המרכזיות</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {highlights.slice(0, 3).map((item, index) => {
             const classes = getColorClasses(item.color);
             // Extracting the bg color for the icon from the string (simplified approach)
             const iconBgClass = `bg-${item.color}-500`; 

             return (
              <div key={index} className={cn("p-4 rounded-lg border-2 text-center transition-transform hover:scale-105", classes)}>
                <div className={cn("mx-auto w-12 h-12 rounded-full text-white flex items-center justify-center mb-3 shadow-lg", iconBgClass)}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-lg">{item.title}</h4>
                <p className="text-sm opacity-80 mt-1">{item.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompatibilityHighlights;