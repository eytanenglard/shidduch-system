"use client";
import React from "react";
import type { ReactNode } from "react";
import {
  Sun,
  Moon,
  Coffee,
  Utensils,
  Clock,
  Calendar,
  Heart,
  Users,
  Home,
  Briefcase,
  Book,
  User,
  Music,
  Plane,
  Bike,
  Dumbbell,
  Timer,
  Battery,
  Bed,
  Wallet,
  ShoppingBag,
  Tent,
  Tv,
  Smartphone,
  Pizza,
  Salad,
  Car,
  Train,
  Map,
  Globe,
  Sparkles,
} from "lucide-react";

const lifestyleQuestions = [
  // שאלות פתיחה - Ice Breakers (20%)
  {
    id: "morningRoutine",
    category: "lifestyle",
    subcategory: "opening",
    question: "איך נראה הבוקר האידיאלי שלך?",
    type: "iconChoice",
    options: [
      { icon: <Sun />, text: "קימה מוקדמת ופעילות", value: "active" },
      { icon: <Coffee />, text: "קפה ורוגע", value: "calm" },
      { icon: <Book />, text: "לימוד או קריאה", value: "study" },
      { icon: <Timer />, text: "מהיר ויעיל", value: "efficient" },
    ],
  },
  {
    id: "dailyEnergyPattern",
    category: "lifestyle",
    subcategory: "opening",
    question: "מתי את/ה במיטבך במהלך היום?",
    type: "multiSelect",
    options: [
      { icon: <Sun />, text: "בוקר מוקדם", value: "earlyMorning" },
      { icon: <Coffee />, text: "צהריים", value: "noon" },
      { icon: <Moon />, text: "ערב", value: "evening" },
      { icon: <Sparkles />, text: "לילה", value: "night" },
    ],
  },
  {
    id: "weekendStyle",
    category: "lifestyle",
    subcategory: "opening",
    question: "איך נראה סוף השבוע המושלם בעיניך?",
    type: "scenario",
    options: [
      "בילוי משפחתי מלא באירועים ופעילויות",
      "מנוחה מוחלטת בבית עם ספר טוב",
      "טיול בטבע וספורט",
      "בילוי חברתי ומפגשים",
    ],
  },

  // שאלות עומק - Core Lifestyle (50%)
  {
    id: "workLifeBalance",
    category: "lifestyle",
    subcategory: "core",
    question: "איך את/ה רואה את האיזון בין עבודה לחיים אישיים?",
    type: "budgetAllocation",
    totalPoints: 100,
    categories: [
      { label: "קריירה ועבודה", icon: <Briefcase /> },
      { label: "זמן משפחה", icon: <Heart /> },
      { label: "זמן אישי", icon: <User /> },
      { label: "תחביבים ופנאי", icon: <Music /> },
    ],
  },
];

export default lifestyleQuestions;
