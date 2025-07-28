// src/components/HomePage/components/DemoSuggestionCard.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Heart, Sparkles, Briefcase, Quote } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface InfoPointProps {
  icon: React.ElementType;
  text: string;
  className?: string;
}

// קומפוננטת עזר קטנה לנקודות המידע, לאנימציה מדורגת
const InfoPoint: React.FC<InfoPointProps> = ({
  icon: Icon,
  text,
  className,
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    }}
    className={cn('flex items-center gap-2', className)}
  >
    <Icon className="w-4 h-4 text-cyan-600 flex-shrink-0" />
    <span className="text-sm text-gray-700">{text}</span>
  </motion.div>
);

export const DemoSuggestionCard = () => {
  // כתובת URL מלאה של תמונת דמו איכותית מ-Cloudinary
  // מומלץ להשתמש בתמונה אמיתית שלכם, או בתמונת סטוק איכותית
  const demoImageUrl =
    'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700882/dina4_gr0ako.jpg';

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
      className="w-full max-w-sm mx-auto"
    >
      <Card className="shadow-2xl rounded-2xl overflow-hidden bg-white border-2 border-purple-100/30 group">
        {/* --- Image Section --- */}
        <div className="relative h-56">
          <Image
            src={getRelativeCloudinaryPath(demoImageUrl)}
            alt="דוגמת פרופיל של דניאלה"
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 384px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* --- Compatibility Badge --- */}
          <Badge
            variant="default"
            className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg px-3 py-1.5 text-sm font-bold flex items-center gap-1.5 transition-all duration-300 group-hover:from-purple-600 group-hover:to-pink-600"
          >
            <Sparkles className="w-4 h-4" />
            <span>פוטנציאל התאמה גבוה</span>
          </Badge>
        </div>

        {/* --- Content Section --- */}
        <CardContent className="p-5">
          {/* --- Main Info --- */}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
            className="text-center mb-4"
          >
            <h3 className="text-2xl font-bold text-gray-900">דניאלה, 28</h3>
            <p className="text-gray-500">מעצבת גרפית</p>
          </motion.div>

          {/* --- Key Traits --- */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
            <InfoPoint icon={MapPin} text="ירושלים" />
            <InfoPoint icon={Briefcase} text="דתיה לאומית" />
            <InfoPoint icon={Heart} text="מחפשת קשר רציני" />
            <InfoPoint icon={User} text="1.65 מ'" />
          </div>

          {/* --- Matchmaker's Insight --- */}
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1 },
            }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="relative p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50/70 rounded-xl border border-purple-200/50"
          >
            <Quote className="absolute top-2 right-2 w-6 h-6 text-purple-200/80 transform scale-x-[-1]" />
            <h4 className="text-xs font-bold text-purple-700 mb-1 text-center">
              תובנת השדכן
            </h4>
            <p className="text-sm text-purple-900/90 leading-relaxed text-center italic">
              זיהינו חיבור נדיר בערכים ובתכונות האופי, לצד שאיפות דומות להקמת
              בית של חסד ותורה.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
