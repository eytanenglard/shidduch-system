"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Bot, User, Sparkles, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Types ---
interface ActionButton {
  type: 'email';
  label: string;
}

interface ChatMessage {
  sender: "bot" | "user";
  text: string;
  actions?: ActionButton[];
}

type ChatMode = 'question' | 'gatheringEmail' | 'composingEmail';

// --- Constants ---
const promptQuestions = [
  "מה המחיר?",
  "איך הפרטיות שלי נשמרת?",
  "כמה זמן לוקח למצוא התאמה?",
  "האם יש אירועים קהילתיים?",
];
const EMAIL_REGEX = /\S+@\S+\.\S+/; // Simple email validation

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('question');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsLoading(true);
      setTimeout(() => {
        setMessages([
          {
            sender: "bot",
            text: "שלום! אני העוזר הדיגיטלי של Match Point. שאלו אותי כל דבר על השירות, המחירים, או איך אנחנו עובדים.",
          },
        ]);
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen, messages.length]);

  const switchToEmailMode = () => {
    setChatMode('gatheringEmail');
    setMessages(prev => [...prev, {
      sender: 'bot',
      text: 'בטח, אשמח לעזור. מה כתובת המייל שלך כדי שנוכל לחזור אליך?'
    }]);
    setInputValue("");
  };
  
  const submitQuestion = async (questionText: string) => {
    const userMessageCount = messages.filter(msg => msg.sender === 'user').length;
    if (userMessageCount >= 10 && !isLimitReached) {
      const limitMessage: ChatMessage = {
        sender: "bot",
        text: "הגעת למגבלת 10 השאלות בשיחה זו. כדי להמשיך, באפשרותך לשלוח לנו פניה ישירה במייל או לרענן את העמוד כדי להתחיל שיחה חדשה.",
        actions: [{ type: 'email', label: 'שלח/י פניה במייל' }]
      };
      setMessages(prev => [...prev, limitMessage]);
      setIsLimitReached(true);
      return;
    }
    if (!questionText.trim() || isLoading || isLimitReached) return;

    const userMessage: ChatMessage = { sender: "user", text: questionText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: questionText }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const botMessage: ChatMessage = { sender: "bot", text: data.reply, actions: data.actions };
      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 700);
    } catch (error) {
      // ... error handling
    }
  };

  const handleEmailFlow = async () => {
    if (!inputValue.trim()) return;

    // Step 1: Gather email
    if (chatMode === 'gatheringEmail') {
      if (!EMAIL_REGEX.test(inputValue)) {
        setMessages(prev => [...prev, { sender: 'bot', text: 'כתובת המייל שהזנת אינה נראית תקינה. אנא נסה/י שוב.' }]);
        return;
      }
      setUserEmail(inputValue);
      setMessages(prev => [...prev, 
        { sender: 'user', text: inputValue },
        { sender: 'bot', text: 'מעולה. עכשיו, כתבו את הודעתכם כאן ואעביר אותה יחד עם המייל שלכם לצוות.' }
      ]);
      setChatMode('composingEmail');
      setInputValue("");
      return;
    }

    // Step 2: Gather message and send
    if (chatMode === 'composingEmail' && userEmail) {
      const emailText = inputValue;
      setMessages(prev => [...prev, { sender: 'user', text: emailText }]);
      setIsLoading(true);
      setInputValue("");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: emailText, type: "email", userEmail: userEmail }),
        });
        if (!response.ok) throw new Error("Email sending failed");
        const data = await response.json();
        setTimeout(() => {
          setMessages(prev => [...prev, { sender: "bot", text: data.reply }]);
          setIsLoading(false);
          setChatMode('question'); // Reset mode after successful email
          setUserEmail(null);
        }, 700);
      } catch (error) {
        // ... error handling
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMode === 'question') {
      submitQuestion(inputValue);
    } else {
      handleEmailFlow();
    }
    if (chatMode === 'question') {
      setInputValue("");
    }
  };
  
  const getPlaceholderText = () => {
    if (isLimitReached) return "הגעת למגבלת השאלות";
    switch(chatMode) {
      case 'gatheringEmail': return "הכנס/י את כתובת המייל...";
      case 'composingEmail': return "כתוב/י את הודעתך כאן...";
      default: return "כתוב/י את שאלתך...";
    }
  }

  return (
    <>
      <div className="fixed bottom-8 left-8 z-[100]">
        <Button id="onboarding-target-chat-widget"

          aria-label={isOpen ? "Close chat" : "Open chat"}
          size="icon"
          className="rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 group w-16 h-16"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="w-7 h-7 text-white transition-transform duration-300 rotate-0 group-hover:rotate-90" />
          ) : (
            <MessageCircle className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
          )}
        </Button>
       
      </div>

      <div
        className={cn(
          "fixed bottom-28 left-8 z-[99] w-full max-w-sm h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out origin-bottom-left",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 p-4 rounded-t-2xl text-white flex items-center shadow-md">
          <Bot className="w-6 h-6 mr-3" />
          <div>
            <h3 className="font-bold">Match Point Assistant</h3>
            <p className="text-xs opacity-80">מוכן לענות על כל שאלה</p>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index}>
                <div
                  className={`flex items-start gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "bot" && (
                    <div className="bg-cyan-100 p-2 rounded-full self-start"><Bot className="w-5 h-5 text-cyan-700" /></div>
                  )}
                  <div
                    className={cn("flex flex-col max-w-[80%] leading-1.5 p-3 rounded-xl", msg.sender === "user" ? "bg-cyan-600 text-white" : "bg-white border border-gray-200")}
                  >
                    <p className="text-sm font-normal">{msg.text}</p>
                  </div>
                  {msg.sender === "user" && (
                    <div className="bg-gray-200 p-2 rounded-full self-start"><User className="w-5 h-5 text-gray-600" /></div>
                  )}
                </div>
                
                {msg.sender === 'bot' && msg.actions && !isLoading && (
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 ml-12">
                    {msg.actions.map((action, actionIndex) => (
                      <Button 
                        key={actionIndex}
                        variant="outline"
                        size="sm"
                        className="justify-start text-left bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={switchToEmailMode}
                      >
                        <Mail className="w-4 h-4 ml-2" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="bg-cyan-100 p-2 rounded-full self-start"><Bot className="w-5 h-5 text-cyan-700" /></div>
                <div className="flex items-center space-x-1 rtl:space-x-reverse p-3">
                  <div className="h-2 w-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-cyan-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            
            {chatMode === 'question' && !isLoading && !isLimitReached && messages.length > 0 && messages[messages.length - 1].sender === 'bot' && !messages[messages.length - 1].actions && (
              <div className="pt-2 ml-12">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Sparkles className="w-3 h-3"/>
                  <span>או נסו אחת מהשאלות הנפוצות:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {promptQuestions.map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs h-auto py-1 px-3 bg-white hover:bg-cyan-50 border-cyan-200 text-cyan-700"
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

        <form onSubmit={handleFormSubmit} className="p-3 border-t border-gray-200 bg-white rounded-b-2xl">
          {chatMode === 'question' && !isLimitReached && (
            <div className="text-center mb-2">
              <Button
                  type="button"
                  variant="link"
                  className="text-xs text-cyan-600 hover:text-cyan-800 h-auto p-0"
                  onClick={switchToEmailMode}
              >
                  או, שלחו לנו פנייה ישירה במייל
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type={chatMode === 'gatheringEmail' ? 'email' : 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={getPlaceholderText()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              disabled={isLoading || isLimitReached}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full bg-cyan-600 hover:bg-cyan-700 shrink-0"
              disabled={isLoading || !inputValue.trim() || isLimitReached}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}