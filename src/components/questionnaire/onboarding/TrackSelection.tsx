import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Scroll,
  Book,
  Heart,
  Sun,
  ArrowLeft,
  ArrowRight,
  Info,
  Star,
} from "lucide-react";
import type { UserTrack } from "../types/worlds";

interface TrackSelectionProps {
  onSelect: (track: UserTrack) => void;
  onBack: () => void;
  selectedTrack?: UserTrack;
}

interface TrackOption {
  id: UserTrack;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  characteristics: string[];
  details: {
    traditions: string;
    lifestyle: string;
    community: string;
  };
}

const trackOptions: TrackOption[] = [
  {
    id: "SECULAR",
    title: "חילוני",
    description: "אורח חיים חופשי עם זיקה למסורת",
    icon: <Sun className="w-6 h-6" />,
    color: "bg-blue-500",
    characteristics: [
      "גמישות בשמירת מסורת",
      "פתיחות לאורח חיים מודרני",
      "חיבור לערכים יהודיים תרבותיים",
    ],
    details: {
      traditions: "שמירה על מסורות משפחתיות וחגים",
      lifestyle: "אורח חיים מודרני ופתוח",
      community: "חיבור לקהילה היהודית הרחבה",
    },
  },
  {
    id: "TRADITIONAL",
    title: "מסורתי",
    description: "שילוב בין מסורת למודרנה",
    icon: <Heart className="w-6 h-6" />,
    color: "bg-purple-500",
    characteristics: [
      "שמירת מסורת מתוך בחירה",
      "איזון בין דת לחיים מודרניים",
      "כבוד למנהגים ולמורשת",
    ],
    details: {
      traditions: "שמירת שבת וחגים באופן גמיש",
      lifestyle: "שילוב בין מסורת למודרניות",
      community: "קשר עם קהילות מגוונות",
    },
  },
  {
    id: "RELIGIOUS",
    title: "דתי",
    description: "אורח חיים על פי ההלכה",
    icon: <Book className="w-6 h-6" />,
    color: "bg-green-500",
    characteristics: [
      "מחויבות להלכה ולמצוות",
      "השקפת עולם תורנית",
      "שילוב תורה עם דרך ארץ",
    ],
    details: {
      traditions: "הקפדה על הלכה ומצוות",
      lifestyle: "חיים דתיים עם השתלבות בחברה",
      community: "חיבור לקהילה דתית",
    },
  },
  {
    id: "ORTHODOX",
    title: "חרדי",
    description: "הקפדה מלאה על קלה כבחמורה",
    icon: <Scroll className="w-6 h-6" />,
    color: "bg-red-500",
    characteristics: [
      "מחויבות מלאה לאורח חיים תורני",
      "הקפדה על קוצו של יו״ד",
      "לימוד תורה כדרך חיים",
    ],
    details: {
      traditions: "הקפדה מלאה על כל פרטי ההלכה",
      lifestyle: "אורח חיים תורני מובהק",
      community: "השתייכות לקהילה חרדית",
    },
  },
];

export default function TrackSelection({
  onSelect,
  onBack,
  selectedTrack,
}: TrackSelectionProps) {
  const [hoveredTrack, setHoveredTrack] = useState<UserTrack | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  const confirmSelection = () => {
    if (selectedTrack) {
      onSelect(selectedTrack);
    }
  };

  return (
    <motion.div
      className="min-h-screen p-6 bg-gradient-to-b from-gray-50 to-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div variants={cardVariants}>
            <h1 className="text-3xl font-bold">בחירת מסלול מותאם אישית</h1>
            <p className="text-gray-600">
              בחר/י את המסלול שמשקף בצורה הטובה ביותר את אורח חייך ואמונתך
            </p>
          </motion.div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="w-4 h-4 text-blue-500" />
            <AlertDescription className="text-blue-700">
              בחירת המסלול תעזור לנו להתאים את השאלות והשידוכים המוצעים באופן
              מיטבי עבורך
            </AlertDescription>
          </Alert>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center px-4">
          <div className="flex-1">
            <Progress value={currentStep === 1 ? 50 : 100} className="h-2" />
          </div>
          <div className="px-4 text-sm text-gray-500">
            שלב {currentStep} מתוך 2
          </div>
        </div>

        {currentStep === 1 ? (
          /* Track Selection Grid */
          <motion.div
            variants={cardVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {trackOptions.map((track) => (
              <Card
                key={track.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedTrack === track.id
                    ? "ring-2 ring-blue-500"
                    : "hover:border-blue-200"
                }`}
                onClick={() => {
                  setCurrentStep(2);
                  onSelect(track.id);
                }}
                onMouseEnter={() => setHoveredTrack(track.id)}
                onMouseLeave={() => setHoveredTrack(null)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 rtl:space-x-reverse">
                    <div
                      className={`p-3 rounded-lg ${track.color} bg-opacity-10`}
                    >
                      {track.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-2">
                        {track.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{track.description}</p>
                      <ul className="space-y-2">
                        {track.characteristics.map((char, index) => (
                          <li
                            key={index}
                            className="flex items-center text-sm text-gray-600"
                          >
                            <Star className="w-4 h-4 ml-2 text-gray-400" />
                            {char}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : (
          /* Confirmation Step */
          <motion.div variants={cardVariants} className="space-y-6">
            {selectedTrack && (
              <Card className="p-6">
                <h3 className="text-xl font-medium mb-4">
                  אישור בחירת מסלול{" "}
                  {trackOptions.find((t) => t.id === selectedTrack)?.title}
                </h3>
                <div className="space-y-4">
                  {Object.entries(
                    trackOptions.find((t) => t.id === selectedTrack)?.details ||
                      {}
                  ).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <h4 className="font-medium">
                        {key === "traditions"
                          ? "מסורת"
                          : key === "lifestyle"
                          ? "אורח חיים"
                          : "קהילה"}
                      </h4>
                      <p className="text-gray-600">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <motion.div
          variants={cardVariants}
          className="flex justify-between pt-6"
        >
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === 2) {
                setCurrentStep(1);
              } else {
                onBack();
              }
            }}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            {currentStep === 1 ? "חזרה" : "בחירה מחדש"}
          </Button>

          {currentStep === 2 && (
            <Button onClick={confirmSelection} disabled={!selectedTrack}>
              אישור והמשך
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
