// src/app/(authenticated)/profile/components/advisor/AIProfileAdvisorDialog.tsx
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
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// נייבא את הקומפוננטה שתציג את התוצאות (ניצור אותה בשלב הבא)
import AnalysisResultDisplay from './AnalysisResultDisplay'; 
import type { AiProfileAnalysisResult } from '@/lib/services/aiService';

interface AIProfileAdvisorDialogProps {
  userId: string;
}

export const AIProfileAdvisorDialog: React.FC<AIProfileAdvisorDialogProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AiProfileAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // פונקציה שתופעל כשהמשתמש ילחץ על הכפתור ותתחיל את התהליך
  const handleGetAnalysis = async () => {
    // אם כבר יש ניתוח, פשוט נפתח את הדיאלוג בלי לקרוא שוב ל-API
    if (analysis) {
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-my-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // אין צורך לשלוח userId, ה-API יקח אותו מהסשן
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'שגיאה בקבלת ניתוח הפרופיל.');
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
    // איפוס המצב כאשר הדיאלוג נסגר
    if (!open) {
      // לא מאפסים את ה-analysis כדי לשמור אותו בזיכרון לפתיחה הבאה
      setError(null);
      // setIsLoading(false); // הטעינה כבר אמורה להסתיים
    }
  };
  
  // כאשר הדיאלוג נפתח לראשונה (אין עדיין ניתוח) - נפעיל את הפונקציה
  const handleTriggerClick = () => {
    if (!analysis && !isLoading) {
      handleGetAnalysis();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={handleTriggerClick}
          variant="outline"
          size="lg"
          className="rounded-full border-2 border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-all duration-300 shadow-sm hover:shadow-lg group w-full max-w-sm"
        >
          <Sparkles className="w-5 h-5 ml-2 text-purple-500 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          <span>קבל ניתוח וטיפים לשיפור הפרופיל</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0"
        dir="rtl"
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span>יועץ הפרופיל החכם שלך</span>
          </DialogTitle>
          <DialogDescription>
            ניתוח מבוסס AI שיעזור לך להציג את עצמך בצורה הטובה ביותר ולמצוא התאמות מדויקות יותר.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-slate-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <p className="text-lg font-semibold text-gray-700">ה-AI שלנו מנתח את הפרופיל שלך...</p>
              <p className="text-sm text-gray-500 mt-2">זה עשוי לקחת מספר שניות. תודה על סבלנותך.</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>אופס, משהו השתבש</AlertTitle>
                <AlertDescription>
                  <p>לא הצלחנו להשלים את ניתוח הפרופיל כרגע.</p>
                  <p className="text-xs mt-2">{error}</p>
                </AlertDescription>
              </Alert>
              <Button onClick={handleGetAnalysis} variant="outline" className="mt-4">
                נסה שוב
              </Button>
            </div>
          ) : analysis ? (
            // כאן נרנדר את קומפוננטת התצוגה כשיהיו לנו תוצאות
            <AnalysisResultDisplay analysis={analysis} />
          ) : (
             // מצב התחלתי, לפני שהטעינה החלה (למקרה שהדיאלוג נפתח בדרך אחרת)
             <div className="flex items-center justify-center h-full">
                <p>לחץ על הכפתור כדי להתחיל את הניתוח.</p>
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIProfileAdvisorDialog;