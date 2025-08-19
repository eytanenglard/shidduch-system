// src/app/components/suggestions/presentation/CompatibilityHighlights.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Check, BookOpen, Scroll, MapPin, Briefcase, Heart } from 'lucide-react';

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
  color: 'green' | 'blue' | 'indigo' | 'rose' | 'teal' | 'amber';
}

const CompatibilityHighlights: React.FC<CompatibilityHighlightsProps> = ({ firstPartyProfile, secondPartyProfile, matchingReason }) => {
  const highlights: Highlight[] = [];

  // 1. Religious Level
  if (firstPartyProfile.religiousLevel && firstPartyProfile.religiousLevel === secondPartyProfile.religiousLevel) {
    highlights.push({ icon: Scroll, title: "השקפת עולם דומה", description: `שניכם הגדרתם את עצמכם כ: ${firstPartyProfile.religiousLevel}`, color: 'indigo' });
  }

  // 2. Location (proximity logic would be better, but for now we'll check same city)
  if (firstPartyProfile.city && firstPartyProfile.city === secondPartyProfile.city) {
    highlights.push({ icon: MapPin, title: "קירבה גיאוגרפית", description: `שניכם גרים ב${firstPartyProfile.city}`, color: 'teal' });
  }

  // 3. Education - simple check for existence
  if (firstPartyProfile.education && secondPartyProfile.education) {
     highlights.push({ icon: BookOpen, title: "רקע והשכלה", description: `רקע לימודי ותעסוקתי שמשתלב היטב`, color: 'blue' });
  }
  
  // 4. From matching reason text
  const reasonText = matchingReason?.toLowerCase() || '';
  if (reasonText.includes('אופי') || reasonText.includes('אישיות')) {
     highlights.push({ icon: Heart, title: "התאמה אישיותית", description: 'השדכן/ית זיהו פוטנציאל לחיבור עמוק ברמה האישית.', color: 'rose' });
  }

  if (highlights.length === 0) {
      // Add a default highlight if none were found
      highlights.push({ icon: Check, title: "פוטנציאל להתאמה", description: 'השדכן/ית זיהו כאן הזדמנות שכדאי לבדוק!', color: 'green' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-center">נקודות החיבור המרכזיות</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {highlights.slice(0, 3).map((item, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 border-${item.color}-200 bg-${item.color}-50 text-center transition-transform hover:scale-105`}>
              <div className={`mx-auto w-12 h-12 rounded-full bg-${item.color}-500 text-white flex items-center justify-center mb-3 shadow-lg`}>
                <item.icon className="w-6 h-6" />
              </div>
              <h4 className={`font-bold text-lg text-${item.color}-800`}>{item.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompatibilityHighlights;