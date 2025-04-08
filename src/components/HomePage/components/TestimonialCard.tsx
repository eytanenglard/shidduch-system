import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

export interface TestimonialCardProps {
  text: string;
  author: string;
  result?: string;
  color: "cyan" | "green" | "orange" | "pink";
}

// Modernized Testimonial Card with enhanced aesthetics
const TestimonialCard: React.FC<TestimonialCardProps> = ({
  text,
  author,
  result,
  color,
}) => {
  const colorClasses = {
    cyan: {
      gradient1: "from-cyan-100 to-cyan-50",
      gradient2: "from-cyan-50 to-cyan-100",
      avatar: "from-cyan-500 to-cyan-600",
      result: "text-cyan-600",
    },
    green: {
      gradient1: "from-green-100 to-green-50",
      gradient2: "from-green-50 to-green-100",
      avatar: "from-green-500 to-green-600",
      result: "text-green-600",
    },
    orange: {
      gradient1: "from-orange-100 to-orange-50",
      gradient2: "from-orange-50 to-orange-100",
      avatar: "from-orange-500 to-orange-600",
      result: "text-orange-600",
    },
    pink: {
      gradient1: "from-pink-100 to-pink-50",
      gradient2: "from-pink-50 to-pink-100",
      avatar: "from-pink-500 to-pink-600",
      result: "text-pink-600",
    },
  };

  return (
    <Card className="group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 h-full">
      {/* Improved decorative elements */}
      <div
        className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${colorClasses[color].gradient1} opacity-50 rounded-full`}
      />
      <div
        className={`absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br ${colorClasses[color].gradient2} opacity-30 rounded-full`}
      />

      {/* Content with enhanced styling */}
      <CardContent className="relative p-8 h-full flex flex-col backdrop-blur-sm">
        <div className="mb-4 text-4xl text-gray-300 font-serif opacity-80 group-hover:opacity-100 transition-opacity duration-300">
          ❝
        </div>
        <p className="text-gray-700 leading-relaxed text-lg mb-6 flex-grow">
          {text}
        </p>
        <div className="flex flex-col mt-auto">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClasses[color].avatar} flex items-center justify-center text-white font-bold shadow-md transform group-hover:scale-110 transition-transform duration-300`}
            >
              {author[0]}
            </div>
            <p className="mr-4 font-semibold text-gray-800">{author}</p>
          </div>
          {result && (
            <div
              className={`mt-3 pt-3 border-t border-gray-100 ${colorClasses[color].result} font-medium text-sm flex items-center`}
            >
              <Heart className="w-4 h-4 ml-1" fill="currentColor" /> {result}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;
