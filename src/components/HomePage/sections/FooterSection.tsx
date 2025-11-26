// src/components/HomePage/sections/FooterSection.tsx
'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { FooterLink, FooterItem } from '../components/FooterComponents';
import type { FooterDict } from '@/types/dictionary';

// --- Type Definition for Component Props ---
interface FooterProps {
  dict: FooterDict;
}

const FooterSection: React.FC<FooterProps> = ({ dict }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };
  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        scale: {
          type: 'spring',
          stiffness: 260,
          damping: 20,
        },
      },
    },
  };
  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };
  const staggeredListVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  const listItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };
  const bottomSectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut', delay: 0.5 },
    },
  };
  return (
    <motion.footer
      ref={ref}
      // Background: Slate-900 with gradients matching the Hero theme
      className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12 md:py-16 px-4 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTEwIDEwaDIwdjIwSDEwVjEweiIvPjwvZz48L2c+PC9zdmc+')]"></div>

      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <motion.div className="md:col-span-1" variants={logoVariants}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Link href="/" className="flex items-center gap-2 group mb-6">
                <div className="relative overflow-hidden rounded-full p-1 transition-all duration-300 group-hover:scale-110">
                  {/* Heart Icon: Rose color for warmth */}
                  <Heart
                    className="h-7 w-7 text-rose-500 transition-all duration-300 group-hover:text-rose-400"
                    fill="#1e293b"
                  />
                </div>
                {/* Logo Text Hover: Orange */}
                <span className="text-xl font-bold text-white group-hover:text-orange-300 transition-all duration-300">
                  NeshamaTech
                </span>
              </Link>
            </motion.div>
            <motion.p className="text-gray-400 mb-6" variants={fadeInUp}>
              {dict.description}
            </motion.p>
          </motion.div>

          {/* Navigation Column */}
          <motion.div variants={columnVariants}>
            <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
              {/* Header Gradient: Teal -> Orange */}
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-orange-400">
                {dict.columns.navigation.title}
              </span>
              {/* Separator Line: Teal/Orange */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400/30 to-orange-400/30" />
            </h3>
            <motion.ul
              className="space-y-3 md:space-y-4"
              variants={staggeredListVariants}
            >
              {dict.columns.navigation.links.map((link) => (
                <motion.div key={link.href} variants={listItemVariants}>
                  <FooterLink href={link.href}>{link.text}</FooterLink>
                </motion.div>
              ))}
            </motion.ul>
          </motion.div>

          {/* Information Column */}
          <motion.div variants={columnVariants}>
            <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
              {/* Header Gradient: Teal -> Orange */}
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-orange-400">
                {dict.columns.information.title}
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400/30 to-orange-400/30" />
            </h3>
            <motion.ul
              className="space-y-3 md:space-y-4"
              variants={staggeredListVariants}
            >
              {dict.columns.information.links.map((link) => (
                <motion.div key={link.href} variants={listItemVariants}>
                  <FooterLink href={link.href}>{link.text}</FooterLink>
                </motion.div>
              ))}
            </motion.ul>
          </motion.div>

          {/* Contact Column */}
          <motion.div variants={columnVariants}>
            <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
              {/* Header Gradient: Teal -> Orange */}
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-orange-400">
                {dict.columns.contact.title}
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400/30 to-orange-400/30" />
            </h3>
            <motion.ul
              className="space-y-3 md:space-y-4"
              variants={staggeredListVariants}
            >
              {dict.columns.contact.items.map((item) => (
                <motion.div key={item.text} variants={listItemVariants}>
                  <FooterItem icon={item.icon} text={item.text} />
                </motion.div>
              ))}
            </motion.ul>
          </motion.div>
        </div>

        <motion.div
          className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-700/50"
          variants={bottomSectionVariants}
        >
          <div className="text-center">
            <motion.div
              className="mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {/* Motto Badge: Teal/Orange background */}
              <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-orange-400/10 text-teal-400 hover:from-teal-500/20 hover:to-orange-400/20 transition-colors duration-300 border border-teal-500/20">
                {dict.motto}
              </span>
            </motion.div>
            <p className="text-gray-400">{dict.copyright}</p>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};
export default FooterSection;