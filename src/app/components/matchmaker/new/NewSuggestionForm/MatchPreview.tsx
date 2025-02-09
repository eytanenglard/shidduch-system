import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { calculateMatchScore } from "../utils/matchingAlgorithm";
import type { Candidate } from "../types/candidates";
import type { MatchScore } from "../utils/matchingAlgorithm";

interface MatchPreviewProps {
  firstParty: Candidate;
  secondParty: Candidate;
  className?: string;
}

const MatchPreview: React.FC<MatchPreviewProps> = ({
  firstParty,
  secondParty,
  className,
}) => {
  // Calculate match score using the existing algorithm
  const matchScore: MatchScore | null = calculateMatchScore(
    firstParty.profile,
    secondParty.profile
  );

  if (!matchScore) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="w-5 h-5" />
          <span>לא ניתן לחשב התאמה - חסרים נתונים חיוניים</span>
        </div>
      </Card>
    );
  }

  // Determine match quality indicators
  const getMatchQuality = (score: number) => {
    if (score >= 85)
      return {
        icon: CheckCircle,
        color: "text-green-600",
        text: "התאמה גבוהה",
      };
    if (score >= 70)
      return { icon: CheckCircle, color: "text-blue-600", text: "התאמה טובה" };
    if (score >= 50)
      return {
        icon: AlertCircle,
        color: "text-yellow-600",
        text: "התאמה בינונית",
      };
    return { icon: XCircle, color: "text-red-600", text: "התאמה נמוכה" };
  };

  const quality = getMatchQuality(matchScore.score);
  const Icon = quality.icon;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Match Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${quality.color}`} />
            <span className="font-medium">{quality.text}</span>
          </div>
          <Badge variant="outline" className="text-lg">
            {Math.round(matchScore.score)}%
          </Badge>
        </div>

        {/* Score Bar */}
        <Progress value={matchScore.score} className="h-2" />

        {/* Match Criteria */}
        <div className="space-y-4">
          <h4 className="font-medium">קריטריונים מרכזיים:</h4>
          <div className="grid gap-3">
            {matchScore.criteria.map((criterion) => (
              <div
                key={criterion.name}
                className="flex items-center justify-between"
              >
                <span className="text-gray-600">
                  {criterion.name === "age" && "גיל"}
                  {criterion.name === "location" && "מיקום"}
                  {criterion.name === "religious" && "רמה דתית"}
                </span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={criterion.score * 100}
                    className="w-24 h-1.5"
                  />
                  <span className="text-sm font-medium w-8 text-center">
                    {Math.round(criterion.score * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Match Reasons */}
        {matchScore.reasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">סיבות להתאמה:</h4>
            <ul className="space-y-1 text-gray-600">
              {matchScore.reasons.map((reason, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span>•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MatchPreview;
