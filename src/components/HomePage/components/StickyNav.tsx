// src/components/HomePage/components/StickyNav.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X, UserPlus, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

// Data structure for navigation links for easy management
export interface NavLink {
  id: string;
  label: string;
}

interface StickyNavProps {
  navLinks: NavLink[];
}

const StickyNav: React.FC<StickyNavProps> = ({ navLinks }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Effect to manage sticky state and active section on scroll
  useEffect(() => {
    // Populate refs for each section
    sectionRefs.current = navLinks.map((link) =>
      document.getElementById(link.id)
    );

    const handleScroll = () => {
      // ======================= START OF CHANGE 1 (The likely fix) =======================
      // The old condition was too strict. This new one makes the nav appear
      // as soon as the user scrolls just a little bit.
      if (window.scrollY > 10) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
      // ======================== END OF CHANGE 1 =========================

      // Logic for active section highlighting
      let currentSection = '';
      sectionRefs.current.forEach((section, index) => {
        if (section) {
          const sectionTop = section.offsetTop - 150; // Offset for better accuracy
          const sectionHeight = section.clientHeight;
          if (
            window.scrollY >= sectionTop &&
            window.scrollY < sectionTop + sectionHeight
          ) {
            currentSection = navLinks[index].id;
          }
        }
      });
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check on load

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [navLinks]);

  // Effect to handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({
      behavior: 'smooth',
    });
    setIsMenuOpen(false); // Close mobile menu on link click
  };

  // Animation variants for the mobile menu
  const menuVariants = {
    closed: { opacity: 0, y: '-100%' },
    open: { opacity: 1, y: '0%' },
  };

  return (
    <>
      {/* Ensures smooth scrolling behavior is enabled */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
      <AnimatePresence>
        {isSticky && (
          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            // ======================= START OF CHANGE 2 (Safety measure) =======================
            // Increased z-index from z-40 to z-50 to ensure it's on top of everything.
            className="fixed top-0 left-0 right-0 z-50 w-full h-20"
            // ======================== END OF CHANGE 2 =========================
          >
            <div className="absolute inset-0 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-x-2 group shrink-0"
              >
                <Heart className="h-7 w-7 text-cyan-500 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-xl font-bold text-gray-800 group-hover:text-cyan-600 transition-colors">
                  Match Point
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2 relative">
                {navLinks.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(e) => handleLinkClick(e, `#${link.id}`)}
                    className={cn(
                      'relative px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200',
                      activeSection === link.id
                        ? 'text-cyan-600'
                        : 'text-gray-700 hover:text-cyan-600'
                    )}
                  >
                    {activeSection === link.id && (
                      <motion.div
                        layoutId="active-nav-link"
                        className="absolute inset-0 bg-cyan-500/10 rounded-full z-0"
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </a>
                ))}
              </nav>

              {/* Actions: Desktop CTA and Mobile Menu Toggle */}
              <div className="flex items-center gap-2">
                <Link href="/auth/register" className="hidden md:block">
                  <Button className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 px-5">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                    <span className="relative z-10 flex items-center">
                      <UserPlus className="ml-1.5 h-4 w-4" />
                      הרשמה
                    </span>
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-gray-600 hover:text-cyan-600 hover:bg-cyan-100/50 rounded-full"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="פתח תפריט"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 bg-white z-50 p-6 flex flex-col md:hidden"
          >
            <div className="flex justify-between items-center mb-10">
              <Link href="/" className="flex items-center gap-x-2 group">
                <Heart className="h-7 w-7 text-cyan-500" />
                <span className="text-xl font-bold text-gray-800">
                  Match Point
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <nav className="flex flex-col gap-4 text-center">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => handleLinkClick(e, `#${link.id}`)}
                  className={cn(
                    'text-2xl font-medium py-3 rounded-lg transition-colors',
                    activeSection === link.id
                      ? 'bg-cyan-50 text-cyan-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-auto pt-10 flex flex-col gap-4">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="w-full text-lg bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-full"
                >
                  <UserPlus className="ml-2 h-5 w-5" />
                  הרשמה
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-lg rounded-full"
                >
                  כבר יש לי חשבון
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StickyNav;
