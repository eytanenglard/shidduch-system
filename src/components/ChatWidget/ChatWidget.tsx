'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Mail,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- Types ---
interface ActionButton {
  type: 'email';
  label: string;
}

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  actions?: ActionButton[];
  timestamp: Date;
  isFallback?: boolean;
}

type ChatMode = 'question' | 'gatheringEmail' | 'composingEmail';

// --- START: Updated prompt questions ---
const promptQuestions = [
  'מה העלות של השירות?',
  'במה אתם שונים מאפליקציות?',
  'איך שומרים על הפרטיות שלי?',
  'איך עובד תהליך ההתאמה?',
];
// --- END: Updated prompt questions ---

const EMAIL_REGEX = /\S+@\S+\.\S+/;

// --- START: Updated brand texts ---
const TEXTS = {
  welcome:
    'שלום, אנחנו NeshamaTech. אנו יודעים שהדרך לזוגיות משמעותית יכולה להיות מאתגרת. לכן יצרנו תהליך המשלב טכנולוגיה מתקדמת עם ליווי אישי וחם, כדי להעניק לכם חוויה דיסקרטית, מכבדת ויעילה. במה נוכל לעזור?',
  limitReached:
    'הגעת למגבלת 10 השאלות בשיחה זו. כדי שנוכל להעניק לך מענה אישי ומעמיק, נשמח להמשיך את השיחה במייל. השאר/י פנייה והצוות שלנו יחזור אליך.',
  switchToEmailPrompt:
    'בשמחה. כדי שנוכל לחזור אליך עם תשובה אישית מהצוות, אנא רשום/י את כתובת המייל שלך. הפרטים יישמרו בדיסקרטיות מלאה.',
  composeEmailPrompt:
    'מעולה. כעת, כתוב/י את פנייתך ואחד מאנשי הצוות שלנו יחזור אליך באופן אישי.',
  emailError: 'נראה שכתובת המייל אינה תקינה. אנא בדקו ונסו שוב.',
  genericError:
    'אנו מתנצלים, אירעה שגיאה טכנית קלה. אנא נסו לרענן או לחזור בעוד מספר רגעים. תמיד אפשר גם לפנות אלינו ישירות במייל.',
  sendEmailError:
    'אנו מתנצלים, אירעה שגיאה בשליחת המייל. אנא נסו שוב, או פנו אלינו ישירות לכתובת jewish.matchpoint@gmail.com.',
  placeholderDefault: 'שאלו אותנו על הגישה שלנו...',
  placeholderGatheringEmail: 'הכניסו את כתובת המייל שלכם...',
  placeholderComposingEmail: 'כתבו את הודעתכם כאן...',
  placeholderLimitReached: 'מגבלת השאלות הושגה. המשיכו במייל.',
};
// --- END: Updated brand texts ---

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('question');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => scrollToBottom(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, viewportHeight]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsLoading(true);
      setTimeout(() => {
        const welcomeMessage: ChatMessage = {
          sender: 'bot',
          text: TEXTS.welcome,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        setIsLoading(false);
      }, 800);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (
      !isOpen &&
      messages.length > 0 &&
      messages[messages.length - 1].sender === 'bot'
    ) {
      setHasUnreadMessage(true);
    } else if (isOpen) {
      setHasUnreadMessage(false);
    }
  }, [isOpen, messages]);

  const clearError = () => setError(null);

  const switchToEmailMode = () => {
    setChatMode('gatheringEmail');
    const emailModeMessage: ChatMessage = {
      sender: 'bot',
      text: TEXTS.switchToEmailPrompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, emailModeMessage]);
    setInputValue('');
    clearError();
  };

  const submitQuestion = async (questionText: string) => {
    const userMessageCount = messages.filter(
      (msg) => msg.sender === 'user'
    ).length;

    if (userMessageCount >= 10 && !isLimitReached) {
      const limitMessage: ChatMessage = {
        sender: 'bot',
        text: TEXTS.limitReached,
        actions: [{ type: 'email', label: 'שלחו פנייה במייל לצוות' }],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, limitMessage]);
      setIsLimitReached(true);
      return;
    }

    if (!questionText.trim() || isLoading || isLimitReached) return;

    clearError();
    const userMessage: ChatMessage = {
      sender: 'user',
      text: questionText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: questionText }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      const botMessage: ChatMessage = {
        sender: 'bot',
        text: data.reply,
        actions: data.actions,
        isFallback: data.isFallback,
        timestamp: new Date(),
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, botMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Chat error:', error);
      setError(TEXTS.genericError);
      setIsLoading(false);
    }
  };

  const handleEmailFlow = async () => {
    if (!inputValue.trim()) return;
    clearError();

    if (chatMode === 'gatheringEmail') {
      if (!EMAIL_REGEX.test(inputValue)) {
        setError(TEXTS.emailError);
        return;
      }

      setUserEmail(inputValue);
      const userEmailMessage: ChatMessage = {
        sender: 'user',
        text: inputValue,
        timestamp: new Date(),
      };
      const confirmEmailMessage: ChatMessage = {
        sender: 'bot',
        text: TEXTS.composeEmailPrompt,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userEmailMessage, confirmEmailMessage]);
      setChatMode('composingEmail');
      setInputValue('');
      return;
    }

    if (chatMode === 'composingEmail' && userEmail) {
      const emailText = inputValue;
      const userMessageText: ChatMessage = {
        sender: 'user',
        text: emailText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessageText]);
      setIsLoading(true);
      setInputValue('');

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: emailText,
            type: 'email',
            userEmail,
          }),
        });

        if (!response.ok) throw new Error('Failed to send email');

        const data = await response.json();
        const successMessage: ChatMessage = {
          sender: 'bot',
          text: data.reply,
          timestamp: new Date(),
        };

        setTimeout(() => {
          setMessages((prev) => [...prev, successMessage]);
          setIsLoading(false);
          setChatMode('question');
          setUserEmail(null);
        }, 1000);
      } catch (error) {
        console.error('Email error:', error);
        setError(TEXTS.sendEmailError);
        setIsLoading(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMode === 'question') {
      submitQuestion(inputValue);
      setInputValue('');
    } else {
      handleEmailFlow();
    }
  };

  const getPlaceholderText = () => {
    if (isLimitReached) return TEXTS.placeholderLimitReached;
    switch (chatMode) {
      case 'gatheringEmail':
        return TEXTS.placeholderGatheringEmail;
      case 'composingEmail':
        return TEXTS.placeholderComposingEmail;
      default:
        return TEXTS.placeholderDefault;
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  const shouldShowPromptQuestions = () => {
    if (isLoading || isLimitReached || chatMode !== 'question') return false;
    if (messages.length === 1 && messages[0].sender === 'bot') return true;
    const lastMessage = messages[messages.length - 1];
    return (
      lastMessage?.sender === 'bot' &&
      !lastMessage.actions &&
      !lastMessage.isFallback
    );
  };

  return (
    <>
      <div className="fixed bottom-6 left-6 md:bottom-6 md:left-6 z-[100]">
        <div className="relative">
          {hasUnreadMessage && !isOpen && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-pulse border-2 border-white z-10 flex items-center justify-center">
              <span className="text-white text-xs font-bold">1</span>
            </div>
          )}
          {!isOpen && (
            <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-20 animate-ping" />
          )}
          <Button
            id="onboarding-target-chat-widget"
            aria-label={isOpen ? "סגור צ'אט" : "פתח צ'אט"}
            // --- התחל תיקון נגישות ---
            aria-expanded={isOpen}
            aria-controls="chat-panel"
            // --- סיים תיקון נגישות ---
            size="icon"
            className="..."
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="w-7 h-7 text-white transition-all duration-300 group-hover:rotate-90" />
            ) : (
              <div className="flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-white transition-all duration-300 group-hover:scale-110" />
                <Heart className="w-3 h-3 text-white absolute top-2 right-2 opacity-60" />
              </div>
            )}
          </Button>
        </div>
      </div>

      <div
        id="chat-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-panel-title"
        className={cn(
          'fixed z-[99] bg-white rounded-3xl shadow-2xl flex flex-col transition-all duration-500 ease-in-out border border-gray-100',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none',
          'top-16 bottom-16 left-4 right-4 sm:top-12 sm:bottom-12 sm:left-6 sm:right-6 md:fixed md:bottom-28 md:left-6 md:right-auto md:top-auto md:w-96 md:h-[32rem] md:max-w-none'
        )}
        style={{
          maxHeight:
            viewportHeight > 0 && window.innerWidth < 768
              ? `${viewportHeight - 120}px`
              : undefined,
        }}
      >
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 p-4 md:p-5 rounded-t-3xl text-white flex items-center justify-between shadow-lg shrink-0">
          <div className="flex items-center min-w-0 flex-1">
            <div className="relative shrink-0">
              <Bot className="w-7 h-7 md:w-7 md:h-7 mr-3 opacity-90" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border border-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-lg truncate">NeshamaTech</h3>
              <p className="text-sm opacity-90 truncate">העוזר האישי שלכם</p>
            </div>
          </div>
          <div className="text-xs opacity-75 bg-white/10 px-3 py-1.5 rounded-full shrink-0">
            מקוון
          </div>
        </div>

        <div className="flex-1 p-4 md:p-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-white min-h-0 overscroll-behavior-contain">
          <div
            className="space-y-5 md:space-y-4"
            aria-live="polite"
            aria-atomic="false"
          >
            {messages.map((msg, index) => (
              <div key={index}>
                <div
                  className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="bg-cyan-100 p-2.5 rounded-full self-start shadow-sm shrink-0">
                      <Bot className="w-5 h-5 text-cyan-700" />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[85%] md:max-w-[80%] min-w-0">
                    <div
                      className={cn(
                        'p-4 rounded-2xl shadow-sm leading-relaxed break-words',
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-br-lg'
                          : 'bg-white border border-gray-100 rounded-bl-lg'
                      )}
                    >
                      <p className="text-base font-normal whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-xs text-gray-400 mt-2 px-2',
                        msg.sender === 'user' ? 'text-left' : 'text-right'
                      )}
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="bg-gray-200 p-2.5 rounded-full self-start shadow-sm shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>

                {msg.sender === 'bot' && msg.actions && !isLoading && (
                  <div className="flex flex-col gap-3 mt-4 mr-14">
                    {msg.actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant="outline"
                        className="justify-start text-right bg-white border-cyan-200 text-cyan-700 hover:bg-cyan-50 rounded-xl shadow-sm text-base py-3 px-4 h-auto touch-manipulation min-h-[48px]"
                        onClick={switchToEmailMode}
                      >
                        <Mail className="w-5 h-5 ml-2" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="bg-cyan-100 p-2.5 rounded-full self-start shadow-sm shrink-0">
                  <Bot className="w-5 h-5 text-cyan-700" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <div className="h-2 w-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-cyan-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            {shouldShowPromptQuestions() && (
              <div className="pt-3 mr-14">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span>אולי תרצו לשאול על:</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {promptQuestions.map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      className="rounded-full text-sm h-auto py-3 px-4 bg-white hover:bg-cyan-50 border-cyan-200 text-cyan-700 transition-all duration-200 hover:shadow-sm touch-manipulation min-h-[44px]"
                      onClick={() => submitQuestion(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-100 shrink-0">
            <p className="text-sm text-red-600 text-center leading-relaxed">
              {error}
            </p>
          </div>
        )}

        <form
          onSubmit={handleFormSubmit}
          className="p-4 border-t border-gray-100 bg-white rounded-b-3xl shrink-0"
        >
          {chatMode === 'question' && !isLimitReached && (
            <div className="text-center mb-4">
              <Button
                type="button"
                variant="link"
                className="text-sm text-cyan-600 hover:text-cyan-800 h-auto p-2 underline-offset-4 touch-manipulation min-h-[44px]"
                onClick={switchToEmailMode}
              >
                צריכים מענה אישי יותר? שלחו פנייה לצוות
              </Button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label htmlFor="chat-input" className="sr-only">
              {getPlaceholderText()}
            </label>
            <input
              id="chat-input"
              type={chatMode === 'gatheringEmail' ? 'email' : 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={getPlaceholderText()}
              className="flex-1 px-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-base transition-all duration-200 bg-gray-50 focus:bg-white min-w-0 touch-manipulation"
              disabled={isLoading || isLimitReached}
              dir="rtl"
              style={{ fontSize: '16px' }}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="שלח הודעה"
              className="rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 shrink-0 shadow-md hover:shadow-lg transition-all duration-200 w-12 h-12 touch-manipulation"
              disabled={isLoading || !inputValue.trim() || isLimitReached}
            >
              <Send className="w-6 h-6" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
