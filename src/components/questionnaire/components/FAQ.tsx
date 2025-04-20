import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  HelpCircle,
  ArrowRight,
  Info,
  Clock,
  Star,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
  category: "process" | "technical" | "privacy" | "results" | "general";
  isPopular?: boolean;
}

interface FAQProps {
  className?: string;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  initialOpenId?: string;
  items?: FAQItem[];
}

// שאלות נפוצות לדוגמה
const defaultFAQItems: FAQItem[] = [
  {
    id: "save-progress",
    question: "האם אפשר לשמור את ההתקדמות ולהמשיך בפעם אחרת?",
    answer: (
      <div className="space-y-2">
        <p>
          כן, המערכת שומרת באופן אוטומטי את התקדמותך בשאלון. תוכל/י לחזור בכל עת
          ולהמשיך מהמקום שבו הפסקת.
        </p>
        <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-md">
          <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">עצה:</p>
            <p>
              בכל פעם שאתה עובר לעולם אחר או מסיים עולם, המערכת שומרת אוטומטית
              את התקדמותך.
            </p>
          </div>
        </div>
      </div>
    ),
    category: "technical",
    isPopular: true,
  },
  {
    id: "time-to-complete",
    question: "כמה זמן לוקח להשלים את השאלון?",
    answer: (
      <p>
        השאלון כולו אורך כ-30-40 דקות, אך אין צורך למלא הכל ברצף. אפשר למלא חלק
        בכל פעם. העולמות השונים אורכים כ-5-10 דקות כל אחד.
      </p>
    ),
    category: "process",
    isPopular: true,
  },
  {
    id: "required-questions",
    question: "האם חובה לענות על כל השאלות?",
    answer: (
      <div className="space-y-2">
        <p>
          לא, רק השאלות המסומנות ב-
          <Badge variant="destructive" className="text-xs">
            חובה *
          </Badge>{" "}
          הן שאלות שחייבים לענות עליהן. שאלות אלו חיוניות ליצירת פרופיל התאמה
          בסיסי.
        </p>
        <p>
          עם זאת, ככל שתענה/י על יותר שאלות, כך נוכל לעשות התאמה טובה יותר
          עבורך.
        </p>
      </div>
    ),
    category: "process",
  },
  {
    id: "how-matching-works",
    question: "איך עובד תהליך ההתאמה?",
    answer: (
      <div className="space-y-3">
        <p>תהליך ההתאמה מבוסס על מספר שלבים:</p>
        <ol className="list-decimal mr-5 space-y-1">
          <li>מילוי השאלון ויצירת פרופיל אישיותי וערכי</li>
          <li>ניתוח התשובות על ידי צוות מקצועי וגם אלגוריתם ממוחשב</li>
          <li>איתור התאמות פוטנציאליות על סמך קריטריונים רבים</li>
          <li>הצגת התאמות מובילות לשני הצדדים</li>
          <li>במקרה של הסכמה הדדית, תיווך לקשר ראשוני</li>
        </ol>
      </div>
    ),
    category: "process",
    isPopular: true,
  },
  {
    id: "privacy-info",
    question: "מי יכול לראות את התשובות שלי?",
    answer: (
      <div className="space-y-2">
        <p>
          המידע שלך נשמר בסודיות מוחלטת. רק צוות המאצמייקינג המקצועי שלנו יכול
          לראות את התשובות המלאות שלך, וזאת אך ורק לצורך יצירת התאמות.
        </p>
        <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-md">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p>
              בעת הצגת התאמה פוטנציאלית, הצד השני רואה רק פרטים כלליים ותחומי
              עניין משותפים, לא את כל התשובות שלך.
            </p>
          </div>
        </div>
      </div>
    ),
    category: "privacy",
  },
  {
    id: "edit-answers",
    question: "האם ניתן לערוך תשובות אחרי שסיימתי?",
    answer: (
      <p>
        כן, תמיד אפשר לחזור ולערוך את התשובות. פשוט היכנס/י לשאלון דרך הפרופיל
        האישי ובחר/י את העולם שתרצה/י לערוך. שינוי התשובות עשוי להשפיע על
        ההתאמות העתידיות שלך.
      </p>
    ),
    category: "technical",
  },
  {
    id: "match-percentage",
    question: "איך מחושב אחוז ההתאמה?",
    answer: (
      <div className="space-y-2">
        <p>אחוז ההתאמה מחושב על סמך מגוון פרמטרים:</p>
        <ul className="list-disc mr-5 space-y-1">
          <li>מידת ההתאמה בערכי ליבה ואמונות</li>
          <li>סגנון חיים ושאיפות לעתיד</li>
          <li>ציפיות מחיי משפחה וזוגיות</li>
          <li>תחומי עניין משותפים</li>
          <li>התאמה רגשית וקוגניטיבית</li>
        </ul>
        <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 rounded-md border border-amber-100">
          <Star className="h-5 w-5 text-amber-500 mt-0.5" />
          <div className="text-sm text-amber-700">
            <p>
              אחוז התאמה גבוה מעיד על פוטנציאל טוב לקשר משמעותי, אך זכרו שכימיה
              אישית ומפגש פנים אל פנים הם תמיד המבחן האמיתי!
            </p>
          </div>
        </div>
      </div>
    ),
    category: "results",
  },
  {
    id: "incomplete-questionnaire",
    question: "מה קורה אם לא אשלים את כל השאלון?",
    answer: (
      <div className="space-y-2">
        <p>
          אתה יכול להתחיל לקבל התאמות גם אם לא השלמת את כל העולמות בשאלון, בתנאי
          שענית על שאלות החובה ועל מספיק שאלות כדי ליצור פרופיל בסיסי.
        </p>
        <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 rounded-md border border-red-100">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div className="text-sm text-red-700">
            <p>
              עם זאת, ככל שתשלים יותר שאלות, כך תגדל הדיוק של ההתאמות שתקבל.
              מומלץ להשלים את כל השאלות בהדרגה.
            </p>
          </div>
        </div>
      </div>
    ),
    category: "process",
  },
  {
    id: "inactive-account",
    question: "מה קורה אם אני לא פעיל/ה לתקופה ממושכת?",
    answer: (
      <p>
        אם חשבונך לא יהיה פעיל למשך 3 חודשים, נשלח לך התראה בדואל. לאחר 6
        חודשים של חוסר פעילות, הפרופיל שלך יוגדר כלא פעיל ולא יוצג בהתאמות
        חדשות. תוכל/י תמיד להפעיל אותו מחדש בכניסה לחשבון.
      </p>
    ),
    category: "general",
  },
];

export default function FAQ({
  className,
  title = "שאלות נפוצות",
  subtitle = "כל מה שחשוב לדעת על השאלון ותהליך ההתאמה",
  showSearch = true,
  showCategories = true,
  initialOpenId,
  items = defaultFAQItems,
}: FAQProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>(
    initialOpenId ? [initialOpenId] : []
  );

  // קטגוריות שאלות נפוצות
  const categories = [
    {
      id: "process",
      label: "תהליך ההתאמה",
      icon: <ArrowRight className="h-4 w-4" />,
    },
    {
      id: "technical",
      label: "טכני",
      icon: <HelpCircle className="h-4 w-4" />,
    },
    {
      id: "privacy",
      label: "פרטיות ואבטחה",
      icon: <Info className="h-4 w-4" />,
    },
    { id: "results", label: "תוצאות", icon: <Star className="h-4 w-4" /> },
    { id: "general", label: "כללי", icon: <Info className="h-4 w-4" /> },
  ];

  // סינון שאלות לפי חיפוש וקטגוריה
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof item.answer === "string" &&
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = !activeCategory || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}

        {/* חיפוש */}
        {showSearch && (
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="חיפוש שאלה..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50"
            />
          </div>
        )}

        {/* קטגוריות */}
        {showCategories && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge
              variant={activeCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCategory(null)}
            >
              הכל
            </Badge>

            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                className="cursor-pointer flex items-center gap-1"
                onClick={() =>
                  setActiveCategory(
                    activeCategory === category.id ? null : category.id
                  )
                }
              >
                {category.icon}
                {category.label}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">לא נמצאו שאלות שתואמות את החיפוש</p>
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={expandedItems}
            onValueChange={setExpandedItems}
            className="space-y-2"
          >
            {filteredItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className={cn(
                  "border rounded-lg px-4 py-1",
                  expandedItems.includes(item.id)
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200 hover:border-blue-200"
                )}
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-medium">{item.question}</span>
                    {item.isPopular && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                      >
                        נפוץ
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 pt-1 pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
