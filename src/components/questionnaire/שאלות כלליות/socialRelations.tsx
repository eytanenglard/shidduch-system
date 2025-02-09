"use client";
import React from 'react';
import type { ReactNode } from 'react';
import {
  Users,
  Heart,
  Coffee,
  HandHeart,
  Smile,
  Star,
  User,
  Phone,
  MessageCircle,
  Home,
  Globe,
  CalendarDays,
  Clock,
  Music,
  PartyPopper,
  Book,
  HeartHandshake,
  Laugh,
  Lightbulb,
  Bird,
  Sparkles,
  Crown,
  Sun,
  Moon,
  Cloud,
  Gift,
  Calendar 
} from 'lucide-react';

const socialRelationsQuestions = [
  // שאלות פתיחה - Ice Breakers (20%)
  {
    id: 'socialEnergy',
    category: 'social',
    subcategory: 'opening',
    question: "איך היית מתאר/ת את האנרגיה החברתית שלך?",
    type: 'iconChoice',
    options: [
      { icon: <Sun />, text: "מאוד חברותי/ת", value: "veryOutgoing" },
      { icon: <Cloud />, text: "מאוזן/ת חברתית", value: "balanced" },
      { icon: <Moon />, text: "שקט/ה ומופנם/ת", value: "introvert" },
      { icon: <Star />, text: "משתנה לפי מצב", value: "variable" }
    ]
  },
  {
    id: 'friendshipStyle',
    category: 'social',
    subcategory: 'opening',
    question: "איך את/ה מעדיף/ה לבלות עם חברים?",
    type: 'scenario',
    options: [
      "מפגשים אינטימיים אחד על אחד",
      "בילויים קבוצתיים גדולים",
      "פעילויות משותפות ותחביבים",
      "שיחות עמוקות בקבוצה קטנה"
    ]
  },
  
];

export default socialRelationsQuestions;