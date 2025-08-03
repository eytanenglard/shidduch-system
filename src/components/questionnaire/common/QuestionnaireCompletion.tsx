import React from "react";
import Link from 'next/link'; // *** הוספה חדשה ***
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Send, CheckCircle2, BookUser } from "lucide-react"; // *** הוספנו אייקון BookUser ***

interface QuestionnaireCompletionProps {
  onSendToMatching: () => void;
  isLoading?: boolean;
  isLoggedIn?: boolean;
}

const QuestionnaireCompletion: React.FC<QuestionnaireCompletionProps> = ({
  onSendToMatching,
  isLoading = false,
  isLoggedIn = false,
}) => {
  return (
    <div className="max-w-xl mx-auto p-4">
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-center">
            כל הכבוד! סיימת את השאלון
          </CardTitle>
          <CardDescription className="text-center">
            {isLoggedIn
              ? "התשובות שלך יעזרו לנו למצוא עבורך את ההתאמה הטובה ביותר"
              : "כדי לשמור את התשובות ולהתחיל בתהליך ההתאמה, יש להתחבר למערכת"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoggedIn ? (
            <>
              <div className="text-center text-gray-600">
                <p>כעת ניתן לשלוח את השאלון לצוות האיפיון שלנו</p>
                <p className="text-sm mt-2">
                  הצוות יעבור על התשובות ויתחיל בתהליך ההתאמה
                </p>
              </div>
              <div className="space-y-3"> {/* *** עטפנו את הכפתורים ב-div *** */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={onSendToMatching}
                  disabled={isLoading}
                >
                  <Send className="w-5 h-5 ml-2" />
                  {isLoading ? "שולח..." : "שלח לאיפיון"}
                </Button>
                {/* --- START: הוספת קישור לצפייה בכל התשובות --- */}
                <Link href="/profile?tab=questionnaire" className="block">
                  <Button
                    variant="outline"
                    className="w-full bg-white/70"
                    size="lg"
                    disabled={isLoading}
                  >
                    <BookUser className="w-5 h-5 ml-2 text-blue-600" />
                    סקירת כל התשובות שלי
                  </Button>
                </Link>
                {/* --- END: הוספת קישור לצפייה בכל התשובות --- */}
              </div>
            </>
          ) : (
            <Button className="w-full" size="lg" onClick={onSendToMatching}>
              התחבר למערכת
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionnaireCompletion;