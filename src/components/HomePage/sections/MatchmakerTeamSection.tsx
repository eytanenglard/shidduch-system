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
  const getGradientByColor = () => {
    switch (color) {
      case 'cyan':
        return 'from-cyan-500 to-cyan-700';
      case 'green':
        return 'from-teal-500 to-teal-700';
      default:
        return 'from-cyan-500 to-cyan-700';
    }
  };

  const getButtonColorByColor = () => {
    switch (color) {
      case 'cyan':
        return 'bg-cyan-600 hover:bg-cyan-700';
      case 'green':
        return 'bg-teal-600 hover:bg-teal-700';
      default:
        return 'bg-cyan-600 hover:bg-cyan-700';
    }
  };

  const getTagColorByColor = () => {
    switch (color) {
      case 'cyan':
        return 'bg-cyan-100 text-cyan-800';
      case 'green':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-cyan-100 text-cyan-800';
    }
  };

  return (
    <div className="rounded-xl shadow-lg overflow-hidden bg-white border border-gray-100 flex flex-col h-full transition-all duration-300 hover:shadow-xl">
      <div className="p-8 flex flex-col items-center flex-grow">
        <motion.div
          className="w-48 h-48 mb-6 overflow-hidden rounded-full border-4 border-white shadow-md relative"
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

        <h3 className="text-2xl font-bold text-gray-800 mb-1 text-center">
          {name}
        </h3>
        <p
          className={`text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-r ${getGradientByColor()} text-center`}
        >
          {role}
        </p>

        <motion.div
          className="flex flex-wrap gap-2 justify-center mb-5"
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
              className={`text-sm px-3 py-1 rounded-full ${getTagColorByColor()}`}
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

        <p className="text-gray-600 mb-6 text-center leading-relaxed flex-grow">
          {description}
        </p>

        <div className="mt-auto">
          <Link href={`/contact?matchmaker=${encodeURIComponent(name)}`}>
            <motion.div
              className={`inline-block text-center px-8 py-3 rounded-lg text-white ${getButtonColorByColor()} transition-colors duration-300 font-medium cursor-pointer`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
      className="py-16 md:py-24 px-4 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-100/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>

      <div className="max-w-6xl mx-auto relative">
        <motion.div className="text-center mb-16" variants={headerVariants}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {dict.title_part1}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">
              {' '}
              {dict.title_highlight}{' '}
            </span>
            {dict.title_part2}
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 mx-auto rounded-full mb-6" />
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {dict.subtitle}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 max-w-5xl mx-auto"
          variants={cardContainerVariants}
        >
          {dict.team.map((member) => (
            <motion.div key={member.name} variants={cardVariants}>
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
