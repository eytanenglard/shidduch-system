// src/components/HomePage/components/DemoSuggestionCard.tsx
"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export const DemoSuggestionCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="w-full max-w-sm mx-auto shadow-2xl rounded-2xl overflow-hidden bg-white border-2 border-cyan-100/50">
        <div className="relative h-48 bg-gray-200">
          {/* Note: You must have an image at this path in your /public folder */}
          <Image src="/images/team/dina4.jpg" alt="דוגמת פרופיל" layout="fill" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-teal-400 to-cyan-500 text-white border-0 shadow-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            92% התאמה
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="text-lg font-bold text-gray-800">דניאלה, 28</h3>
          <div className="mt-2 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-600" /><span>ירושלים</span></div>
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-cyan-600" /><span>דתיה לאומית</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed italic">אשת שיחה מרתקת עם לב רחב, מחפשת קשר רציני המבוסס על כבוד הדדי וצמיחה רוחנית.</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};