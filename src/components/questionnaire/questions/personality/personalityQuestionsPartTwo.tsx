// personalityQuestionsPartTwo.tsx
import { Question } from "../../types/types";
import {
  Heart,
  Star,
  Users,
  Book,
  Target,
  Leaf,
  Music,
  Cloud,
  Bike,
} from "lucide-react";

export const personalityQuestionsPartTwo: Question[] = [
  {
    worldId: "PERSONALITY",

    id: "life_challenges",
    category: "personality",
    subcategory: "depth",
    question: "מהו האתגר המשמעותי ביותר שהתגברת עליו ומה למדת ממנו על עצמך?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 100,
    maxLength: 1000,
    placeholder: "שתף/י את סיפור ההתמודדות והצמיחה...",
  },
  {
    worldId: "PERSONALITY",

    id: "home_environment",
    category: "personality",
    subcategory: "basics",
    question: "איך את/ה אוהב/ת את סביבת המגורים שלך?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Leaf />,
        text: "טבעי ומרגיע",
        value: "natural",
        description: "צמחים, אור טבעי ואווירה רגועה",
      },
      {
        icon: <Target />,
        text: "מינימליסטי ומסודר",
        value: "minimal",
        description: "נקי, מאורגן ופונקציונלי",
      },
      {
        icon: <Heart />,
        text: "חמים וביתי",
        value: "cozy",
        description: "נעים, מזמין ונוח",
      },
      {
        icon: <Star />,
        text: "מודרני ועיצובי",
        value: "modern",
        description: "סטייל עכשווי ואלמנטים עיצוביים",
      },
    ],
  },
  {
    worldId: "PERSONALITY",
    id: "dinner_with_historical_figures",
    category: "personality",
    subcategory: "depth",
    question:
      "אם היית יכול/ה לארח לארוחת ערב שלושה אנשים מכל התקופות (חיים או היסטוריים), את מי היית מזמין/ה ומה היית רוצה ללמוד מהם?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: false,
    minLength: 100,
    maxLength: 1000,
    placeholder: "ספר/י על האורחים שבחרת ומה היית רוצה לשוחח איתם...",
  },
  {
    worldId: "PERSONALITY",
    id: "stress_relief",
    category: "personality",
    subcategory: "basics",
    question: "מה עוזר לך להירגע במצבי לחץ?",
    type: "multiSelect",
    depth: "BASIC",
    isRequired: true,
    options: [
      {
        icon: <Music />,
        text: "מוזיקה ואומנות",
        value: "arts",
      },
      {
        icon: <Users />,
        text: "שיחה עם חברים",
        value: "social",
      },
      {
        icon: <Bike />,
        text: "פעילות גופנית",
        value: "exercise",
      },
      {
        icon: <Book />,
        text: "זמן שקט לבד",
        value: "alone_time",
      },
    ],
    minSelections: 1,
    maxSelections: 2,
  },
  {
    worldId: "PERSONALITY",
    id: "happiness_definition",
    category: "personality",
    subcategory: "depth",
    question: "מה משמעותו של אושר עבורך? מתי את/ה מרגיש/ה הכי מאושר/ת?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 100,
    maxLength: 800,
    placeholder: "שתף/י את תפיסתך לגבי משמעות האושר...",
  },

  {
    worldId: "PERSONALITY",
    id: "family_traditions",
    category: "personality",
    subcategory: "depth",
    question: "אילו מסורות משפחתיות חשובות לך במיוחד ולמה?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 100,
    maxLength: 800,
    placeholder: "ספר/י על המסורות המשפחתיות המשמעותיות עבורך...",
  },
  {
    worldId: "PERSONALITY",
    id: "organization_approach",
    category: "personality",
    subcategory: "basics",
    question: "איך את/ה מתייחס/ת לארגון וסדר?",
    type: "iconChoice",
    depth: "BASIC",
    isRequired: false,
    options: [
      {
        icon: <Target />,
        text: "מסודר/ת ומאורגן/ת",
        value: "organized",
        description: "הכל במקום ומתוכנן",
      },
      {
        icon: <Cloud />,
        text: "גמיש/ה ומסתגל/ת",
        value: "flexible",
        description: "סדר עם גמישות",
      },
      {
        icon: <Star />,
        text: "יצירתי/ת ומשתנה",
        value: "creative",
        description: "סדר בתוך הכאוס",
      },
      {
        icon: <Heart />,
        text: "זורם/ת עם מה שיש",
        value: "flow",
        description: "פחות מתעסק/ת בארגון",
      },
    ],
  },
  {
    worldId: "PERSONALITY",
    id: "conflict_resolution",
    category: "personality",
    subcategory: "depth",
    question:
      "(איך את/ה מתמודד/ת עם מחלוקות או קונפליקטים במערכות יחסים (לא דווקא זוגיים?",
    type: "openText",
    depth: "ADVANCED",
    isRequired: true,
    minLength: 100,
    maxLength: 800,
    placeholder: "תאר/י את הגישה שלך להתמודדות עם מחלוקות...",
  },
];

export default personalityQuestionsPartTwo;
