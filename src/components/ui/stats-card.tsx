import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
}

const StatsCard = ({ icon: Icon, title, value }: StatsCardProps) => {
  // Special styling for availability status
  const isAvailabilityCard = title === "סטטוס פניות";
  const isAvailable = value?.toLowerCase() === "available";
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-2 bg-primary/10 rounded-full">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              {isAvailabilityCard ? (
                <div className="mt-1">
                  <span className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
                    ${isAvailable ? 
                      'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'
                    }
                  `}>
                    {value || "לא צוין"}
                  </span>
                </div>
              ) : (
                <p className="text-2xl font-semibold mt-1">
                  {value || "לא צוין"}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;