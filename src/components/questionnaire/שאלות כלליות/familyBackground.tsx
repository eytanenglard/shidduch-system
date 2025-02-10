"use client";
import React from "react";
import { Scroll, Cake, Utensils, Music } from "lucide-react";

const familyBackgroundQuestions = [
  // שאלות פתיחה - Ice Breakers (20%)
  {
    id: "familyTradition",
    category: "family",
    subcategory: "opening",
    question: "איזו מסורת משפחתית מיוחדת יש במשפחה שלך?",
    type: "iconChoice",
    options: [
      { icon: <Cake />, text: "חגיגות משפחתיות", value: "celebrations" },
      { icon: <Utensils />, text: "מתכונים מיוחדים", value: "recipes" },
      { icon: <Music />, text: "שירים ופיוטים", value: "songs" },
      { icon: <Scroll />, text: "סיפורי משפחה", value: "stories" },
    ],
  },
  {
    id: "familyGatherings",
    category: "family",
    subcategory: "opening",
    question: "איך נראים המפגשים המשפחתיים אצלכם?",
    type: "scenario",
    options: [
      "ארוחות שבת גדולות",
      "מפגשים ספונטניים תכופים",
      "אירועים בחגים בלבד",
      "טיולים משפחתיים משותפים",
    ],
  },
];

export default familyBackgroundQuestions;
