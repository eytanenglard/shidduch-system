import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Send, CheckCircle2 } from "lucide-react";

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
              <Button
                className="w-full"
                size="lg"
                onClick={onSendToMatching}
                disabled={isLoading}
              >
                <Send className="w-5 h-5 ml-2" />
                {isLoading ? "שולח..." : "שלח לאיפיון"}
              </Button>
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
