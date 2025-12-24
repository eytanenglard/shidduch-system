// src/components/HomePage/sections/MatchmakerTeamSection.tsx
'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import Link from 'next/link';
import type { MatchmakerTeamDict } from '@/types/dictionary';

// --- Type Definition for Component Props ---
interface MatchmakerTeamProps {
  dict: MatchmakerTeamDict;
}

// --- START: Re-integrated MatchmakerCard Component ---
// This component now receives all data dynamically
interface MatchmakerCardProps {
  name: string;
  role: string;
  description: string;
  tags: string[];
  color: string;
  imageSrc?: string;
  contactButtonText: string; // New prop for translated text
}

const MatchmakerCard: React.FC<MatchmakerCardProps> = ({
  name,
  role,
  description,
  tags,
  color,
  imageSrc,
  contactButtonText,
}) => {
  // Mapping 'cyan' and 'green' props to the new Hero-based palette (Teal & Orange/Rose)
  const isTealTheme = color === 'cyan'; // 'cyan' prop now maps to the Teal/Tech theme

  const getGradientByColor = () => {
    return isTealTheme
      ? 'from-teal-500 to-emerald-600' // Teal theme
      : 'from-orange-500 to-rose-500'; // Orange/Warm theme
  };

  const getBorderColor = () => {
    return isTealTheme
      ? 'group-hover:border-teal-200'
      : 'group-hover:border-orange-200';
  };

  const getButtonGradient = () => {
    return isTealTheme
      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-teal-500/20'
      : 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 shadow-orange-500/20';
  };

  const getTagStyle = () => {
    return isTealTheme
      ? 'bg-teal-50 text-teal-700 border-teal-100'
      : 'bg-orange-50 text-orange-700 border-orange-100';
  };

  const getGlowColor = () => {
    return isTealTheme ? 'bg-teal-400/20' : 'bg-orange-400/20';
  };

  return (
    <div
      className={`group relative rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm border border-white/60 flex flex-col h-full transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${getBorderColor()}`}
    >
      {/* Subtle colorful glow inside the card */}
      <div
        className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${getGlowColor()}`}
      />

      <div className="p-8 flex flex-col items-center flex-grow relative z-10">
        <motion.div
          className="w-48 h-48 mb-6 overflow-hidden rounded-full border-[6px] border-white shadow-xl relative ring-1 ring-gray-100"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          {imageSrc ? (
            <Image
              src={getRelativeCloudinaryPath(imageSrc)}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 192px"
              className="object-cover object-center"
              priority
            />
          ) : (
            <div
              className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${getGradientByColor()}`}
            >
              <span className="text-white text-6xl font-bold opacity-30">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </motion.div>

        <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center tracking-tight">
          {name}
        </h3>
        <p
          className={`text-lg font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r ${getGradientByColor()} text-center`}
        >
          {role}
        </p>

        <motion.div
          className="flex flex-wrap gap-2 justify-center mb-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.3 },
            },
          }}
        >
          {tags.map((tag) => (
            <motion.span
              key={tag}
              className={`text-sm px-3 py-1 rounded-full border ${getTagStyle()} font-medium shadow-sm`}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.3 },
                },
              }}
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>

        <p className="text-gray-600 mb-8 text-center leading-relaxed flex-grow text-base">
          {description}
        </p>

        <div className="mt-auto w-full flex justify-center">
          <Link href={`/contact?matchmaker=${encodeURIComponent(name)}`}>
            <motion.div
              className={`inline-block text-center px-8 py-3.5 rounded-full text-white ${getButtonGradient()} transition-all duration-300 font-semibold cursor-pointer shadow-lg`}
              whileHover={{
                scale: 1.05,
                boxShadow:
                  '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              }}
            >
              {`${contactButtonText} ${name.split(' ')[0]}`}
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
};
// --- END: Re-integrated MatchmakerCard Component ---

const MatchmakerTeamSection: React.FC<MatchmakerTeamProps> = ({ dict }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3, delayChildren: 0.2 },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <motion.section
      ref={ref}
      id="our-team"
      // Updated background to match HeroSection: Slate via Teal to Orange
      className="py-16 md:py-24 px-4 bg-gradient-to-b from-slate-50 via-teal-50/30 to-orange-50/20 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Background Orbs updated to match Hero colors (Teal & Orange/Rose) */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-orange-300/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute top-1/2 left-1/2 w-full h-full bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div className="text-center mb-16" variants={headerVariants}>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-800 mb-6 tracking-tight">
            {dict.title_part1}
            {/* Updated Gradient Text to match Hero (Teal -> Orange) */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 px-2">
              {dict.title_highlight}
            </span>
            {dict.title_part2}
          </h2>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {dict.subtitle}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto"
          variants={cardContainerVariants}
        >
          {dict.team.map((member) => (
            <motion.div
              key={member.name}
              variants={cardVariants}
              className="h-full"
            >
              <MatchmakerCard
                name={member.name}
                role={member.role}
                description={member.description}
                color={member.color}
                tags={member.tags}
                imageSrc={member.imageSrc}
                contactButtonText={dict.contact_button_text}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default MatchmakerTeamSection;
