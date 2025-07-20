import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn, getInitials } from '@/lib/utils';
import type { FeedItem } from '@/types/messages';
import { Heart, MessageCircle, ArrowLeft, Zap, CheckCircle, Info } from 'lucide-react';

const NotificationCard: React.FC<{ item: FeedItem }> = ({ item }) => {
  const iconMap: Record<FeedItem['type'], { icon: React.ElementType, color: string }> = {
    NEW_SUGGESTION: { icon: Heart, color: 'text-pink-500' },
    ACTION_REQUIRED: { icon: Zap, color: 'text-orange-500' },
    STATUS_UPDATE: { icon: CheckCircle, color: 'text-green-500' },
    MATCHMAKER_MESSAGE: { icon: MessageCircle, color: 'text-blue-500' },
    INQUIRY_RESPONSE: { icon: Info, color: 'text-cyan-500' },
    AVAILABILITY_INQUIRY: { icon: MessageCircle, color: 'text-blue-500' },
  };

  const { icon: Icon, color } = iconMap[item.type] || { icon: Info, color: 'text-gray-500' };
  const suggestion = item.payload.suggestion;
  const matchmaker = suggestion?.matchmaker;

  return (
    <Card className="shadow-lg border-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardContent className="p-5 flex items-start gap-4">
        {/* Icon */}
        <div className="flex flex-col items-center gap-2">
           <div className={cn("w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br shadow-md", 
             item.type === 'ACTION_REQUIRED' ? 'from-orange-400 to-amber-500' : 'from-cyan-400 to-blue-500'
           )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {matchmaker && (
             <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-bold">
                    {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
                </AvatarFallback>
             </Avatar>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: he })}
            </span>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <Link href={item.link} passHref>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300">
                צפה בפרטים
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;