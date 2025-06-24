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
import { Loader2, Sparkles, AlertTriangle, Bot, Brain, Heart } from 'lucide-react';
import { toast } from 'sonner';

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

  const handleGetAnalysis = async () => {
    if (analysis) {
      setIsOpen(true);
      return;
    }
    
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
      setError(null); 
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={handleGetAnalysis}
          variant="outline"
          size="lg"
          className="relative overflow-hidden group bg-gradient-to-r from-cyan-50 to-emerald-50 border-2 border-cyan-200 text-cyan-700 hover:from-cyan-100 hover:to-emerald-100 hover:border-cyan-300 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl px-8 py-4 font-semibold"
          disabled={isLoading}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:animate-shimmer"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
            ) : (
              <div className="relative">
                <Brain className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 text-cyan-600" />
                <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            )}
            <span>{isLoading ? 'מכין ניתוח...' : 'ייעוץ AI על ההתאמה'}</span>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white via-cyan-50/20 to-emerald-50/20"
        dir="rtl"
      >
        <DialogHeader className="p-8 border-b border-cyan-100 bg-white/80 backdrop-blur-sm rounded-t-3xl">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="p-3 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg">
              <Bot className="w-6 h-6" />
            </div>
            <span>ניתוח התאמה מבוסס AI</span>
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600 mt-2">
            סקירה חכמה של נקודות החיבור והאתגרים הפוטנציאליים בהצעה זו
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-6 md:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-200 to-emerald-200 animate-pulse"></div>
                <Loader2 className="w-12 h-12 text-cyan-600 animate-spin absolute inset-0 m-auto" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-gray-700">ה-AI שלנו בוחן את ההתאמה...</p>
                <p className="text-gray-500 max-w-md">זה עשוי לקחת מספר שניות. אנו מנתחים עשרות פרמטרים להבנה מעמיקה של ההתאמה.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-8">
                {[
                  { icon: Brain, label: 'ניתוח אישיות', delay: '0ms', color: 'text-cyan-600' },
                  { icon: Heart, label: 'התאמת ערכים', delay: '200ms', color: 'text-emerald-600' },
                  { icon: Sparkles, label: 'פוטנציאל יחד', delay: '400ms', color: 'text-blue-600' }
                ].map((item, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col items-center gap-2 opacity-50 animate-pulse"
                    style={{ animationDelay: item.delay }}
                  >
                    <div className="p-3 rounded-full bg-white shadow-md">
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="p-4 rounded-full bg-red-100">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <Alert variant="destructive" className="max-w-md border-red-200 bg-red-50">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="text-red-800">אופס, משהו השתבש</AlertTitle>
                <AlertDescription className="text-red-700">
                  <p>לא הצלחנו להשלים את ניתוח ההתאמה כרגע.</p>
                  <p className="text-sm mt-2 opacity-90">{error}</p>
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleGetAnalysis} 
                variant="outline" 
                className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Brain className="w-4 h-4 ml-2" />
                נסה שוב
              </Button>
            </div>
          ) : analysis ? (
            <UserAiAnalysisDisplay analysis={analysis} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-emerald-100 flex items-center justify-center mx-auto">
                  <Brain className="w-8 h-8 text-cyan-600" />
                </div>
                <p className="text-gray-600 font-medium">מכין את הניתוח...</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};