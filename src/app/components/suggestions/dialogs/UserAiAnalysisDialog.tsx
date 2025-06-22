// src/app/components/suggestions/dialogs/UserAiAnalysisDialog.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertTriangle, Bot } from 'lucide-react';
import { toast } from 'sonner';

// נייבא את הקומפוננטה שתציג את התוצאות
import UserAiAnalysisDisplay from '../compatibility/UserAiAnalysisDisplay'; 
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';

interface UserAiAnalysisDialogProps {
  suggestedUserId: string;
}

export const UserAiAnalysisDialog: React.FC<UserAiAnalysisDialogProps> = ({ suggestedUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AiSuggestionAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // פונקציה שתופעל כשהמשתמש ילחץ על הכפתור ותתחיל את התהליך
  const handleGetAnalysis = async () => {
    // אם כבר יש ניתוח, פשוט נפתח את הדיאלוג בלי לקרוא שוב ל-API
    if (analysis) {
      setIsOpen(true);
      return;
    }
    
    // נפתח את הדיאלוג כדי להציג את מצב הטעינה
    setIsOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestedUserId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'שגיאה בקבלת ניתוח ההצעה.');
      }

      setAnalysis(result.data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'אירעה שגיאה לא צפויה.';
      setError(errorMessage);
      toast.error('שגיאה בתהליך הניתוח', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // לא מאפסים את ה-analysis כדי לשמור אותו בזיכרון לפתיחה הבאה
      setError(null); 
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={handleGetAnalysis}
          variant="outline"
          className="rounded-full border-2 border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-all duration-300 shadow-sm hover:shadow-lg group"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 ml-2 text-purple-500 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          )}
          <span>ייעוץ AI על ההצעה</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0"
        dir="rtl"
      >
        <DialogHeader className="p-4 border-b bg-slate-50">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="w-6 h-6 text-purple-500" />
            <span>ניתוח התאמה מבוסס AI</span>
          </DialogTitle>
          <DialogDescription>
            סקירה חכמה של נקודות החיבור והאתגרים הפוטנציאליים בהצעה זו.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-slate-100/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <p className="text-lg font-semibold text-gray-700">ה-AI שלנו בוחן את ההתאמה...</p>
              <p className="text-sm text-gray-500 mt-2">זה עשוי לקחת מספר שניות. תודה על סבלנותך.</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>אופס, משהו השתבש</AlertTitle>
                <AlertDescription>
                  <p>לא הצלחנו להשלים את ניתוח ההתאמה כרגע.</p>
                  <p className="text-xs mt-2">{error}</p>
                </AlertDescription>
              </Alert>
              <Button onClick={handleGetAnalysis} variant="outline" className="mt-4">
                נסה שוב
              </Button>
            </div>
          ) : analysis ? (
            <UserAiAnalysisDisplay analysis={analysis} />
          ) : (
            // מצב זה לא אמור לקרות כי הדיאלוג נפתח רק אחרי לחיצה
             <div className="flex items-center justify-center h-full">
                <p>טוען נתונים...</p>
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};