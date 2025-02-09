"use client";
import React from "react";
import type { ReactNode } from "react";
import {
  Heart,
  User,
  Users,
  Home,
  Book,
  Music,
  Coffee,
  Mountain,
  Target,
  Briefcase,
  Globe,
  Map,
  Brain,
  HeartHandshake,
  Smile,
  Star,
  Sun,
  Moon,
  Hand,
  Flower,
  Trees,
  Bird,
  Cloud,
  Compass,
  Crown,
  Gift,
  Gem,
  Key,
} from "lucide-react";

const partnerPreferences = [
  // שאלות פתיחה - Ice Breakers (20%)
  {
    id: "firstImpression",
    category: "partner",
    subcategory: "opening",
    question: "מה הדבר הראשון שמושך את תשומת לבך באדם חדש?",
    type: "iconChoice",
    options: [
      { icon: <Smile />, text: "חיוך וקלילות", value: "smile" },
      { icon: <Brain />, text: "אינטליגנציה", value: "intelligence" },
      { icon: <Heart />, text: "חום ונעימות", value: "warmth" },
      { icon: <Star />, text: "כריזמה", value: "charisma" },
    ],
  },
  {
    id: "idealDate",
    category: "partner",
    subcategory: "opening",
    question: "איך נראית הפגישה האידיאלית הראשונה בעיניך?",
    type: "scenario",
    options: [
      "שיחה מעמיקה בבית קפה שקט",
      "טיול בטבע או בפארק",
      "פעילות משותפת כמו סדנה או הרצאה",
      "ארוחת ערב במסעדה נעימה",
    ],
  },
  {
    id: "dealBreakers",
    category: "partner",
    subcategory: "opening",
    question: "מהם הדברים שהם 'קו אדום' מבחינתך בבן/בת זוג?",
    type: "multiSelect",
    options: [
      { icon: <Hand />, text: "חוסר כנות", value: "dishonesty" },
      { icon: <Cloud />, text: "עישון", value: "smoking" },
      { icon: <Target />, text: "חוסר שאיפות", value: "noAmbition" },
      { icon: <Heart />, text: "חוסר רגישות", value: "insensitivity" },
    ],
  },

  // שאלות עומק - Core Preferences (50%)
  {
    id: "lifeGoals",
    category: "partner",
    subcategory: "core",
    question: "איך היית רוצה שבן/בת הזוג יראה את החיים המשותפים?",
    type: "budgetAllocation",
    totalPoints: 100,
    categories: [
      { label: "קריירה והתפתחות", icon: <Briefcase /> },
      { label: "משפחה וילדים", icon: <Users /> },
      { label: "רוחניות ולימוד", icon: <Book /> },
      { label: "הנאות החיים", icon: <Sun /> },
    ],
  },
];

export default partnerPreferences;
