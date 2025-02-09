import React from 'react';
import { 
  Brain, Smile, Target, Heart, User, 
  Star, HeartHandshake, Laugh 
} from 'lucide-react';
import type { Question } from "../types/types";

const personalityQuestions: Question[] = [
  {
    id: 'selfDescription',
    category: 'personality',
    subcategory: 'core',
    question: "איך היית מתאר/ת את עצמך במילה אחת?",
    type: 'singleChoice',
    depth: "BASIC",
    isRequired: true,
    options: [
      { 
        value: "deep", 
        text: "עמוק/ה ומעמיק/ה" 
      },
      { 
        value: "happy", 
        text: "שמח/ה ואופטימי/ת" 
      },
      { 
        value: "ambitious", 
        text: "ממוקד/ת ושאפתן/ית" 
      },
      { 
        value: "sensitive", 
        text: "רגיש/ה ואכפתי/ת" 
      }
    ]
  },
  {
    id: 'socialInteraction',
    category: 'personality',
    subcategory: 'social',
    question: "באירוע חברתי חדש, איך את/ה בדרך כלל מתנהג/ת?",
    type: 'singleChoice',
    depth: "BASIC",
    isRequired: true,
    options: [
      { value: "proactive", text: "מתערבב/ת מיד ויוצר/ת שיחות" },
      { value: "reactive", text: "מחכה שיפנו אליי" },
      { value: "selective", text: "מוצא/ת אדם אחד לדבר איתו" },
      { value: "observer", text: "נשאר/ת בשקט ומתבונן/ת" }
    ]
  },
  {
    id: 'emotionalResponse',
    category: 'personality',
    subcategory: 'emotional',
    question: "כשמשהו מרגש קורה, איך את/ה מגיב/ה?",
    type: 'multiChoice',
    depth: "ADVANCED",
    isRequired: false,
    options: [
      { value: "expressive", text: "מראה רגשות בחופשיות" },
      { value: "introspective", text: "מעבד/ת לעצמי בשקט" },
      { value: "sharing", text: "משתף/ת עם הקרובים" },
      { value: "composed", text: "שומר/ת על קור רוח" }
    ],
    minSelections: 1,
    maxSelections: 2
  },
  {
    id: 'stressManagement',
    category: 'personality',
    subcategory: 'coping',
    question: "איך את/ה מתמודד/ת עם מצבי לחץ?",
    type: 'singleChoice',
    depth: "ADVANCED",
    isRequired: true,
    options: [
      { value: "plan", text: "לוקח/ת צעד אחורה ומתכנן/ת" },
      { value: "act", text: "פועל/ת מיד לפתרון" },
      { value: "consult", text: "מתייעץ/ת עם אחרים" },
      { value: "calm", text: "מנסה להירגע ולהתמקד" }
    ],
    metadata: {
      helpText: "חשוב לענות בכנות על השאלה הזו כדי להבין את סגנון ההתמודדות שלך",
      estimatedTime: 2
    }
  },
  {
    id: 'personalityOpenQuestion',
    category: 'personality',
    subcategory: 'reflection',
    question: "ספר/י על אירוע שבו הרגשת שהאישיות שלך באה לידי ביטוי בצורה הטובה ביותר",
    type: 'openText',
    depth: "EXPERT",
    isRequired: false,
    minLength: 50,
    maxLength: 500,
    placeholder: "תאר/י את האירוע והסבר/י מה הוא מלמד על האישיות שלך..."
  }
];

export default personalityQuestions;