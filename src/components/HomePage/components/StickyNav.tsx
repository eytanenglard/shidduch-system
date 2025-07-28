'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { UserPlus, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getRelativeCloudinaryPath } from '@/lib/utils';

export interface NavLink {
  id: string;
  label: string;
}

interface StickyNavProps {
  navLinks: NavLink[];
}

// ======================== קומפוננטת הלוגו המעודכנת ========================
const StickyLogo = () => {
  return (
    <Link
      href="/"
      className="hidden md:flex items-center gap-x-2 group shrink-0"
      aria-label="NeshamaTech Homepage"
    >
      <div className="relative h-8 w-8">
        <Image
          src={getRelativeCloudinaryPath(
            // זה ה-URL המדויק שסיפקת
            'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753713907/ChatGPT_Image_Jul_28_2025_05_45_00_PM_zueqou.png'
          )}
          alt="NeshamaTech Icon"
          fill
          className="object-contain transition-transform duration-300 group-hover:scale-110"
          priority
        />
      </div>
      <span
        className="
        text-xl 
        font-bold 
        bg-gradient-to-r from-teal-600 via-orange-500 to-amber-400
        text-transparent bg-clip-text
        bg-size-200 bg-pos-0 group-hover:bg-pos-100
        transition-all duration-700 ease-in-out
      "
      >
        NeshamaTech
      </span>
    </Link>
  );
};
// ========================================================================

const StickyNav: React.FC<StickyNavProps> = ({ navLinks }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [mobileNavState, setMobileNavState] = useState<'open' | 'closed'>(
    'open'
  );
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsMobile(window.innerWidth < 768);

    sectionRefs.current = navLinks.map((link) =>
      document.getElementById(link.id)
    );

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsSticky(currentScrollY > 10);

      lastScrollY.current = currentScrollY;

      let currentSection = '';
      const offset = isMobile ? 200 : 150;
      sectionRefs.current.forEach((section, index) => {
        if (section) {
          const sectionTop = section.offsetTop - offset;
          const sectionHeight = section.clientHeight;
          if (
            currentScrollY >= sectionTop &&
            currentScrollY < sectionTop + sectionHeight
          ) {
            currentSection = navLinks[index].id;
          }
        }
      });
      setActiveSection(currentSection);
    };

    const handleResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleScroll();
    handleResize();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [navLinks, isMobile]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const headerOffset = isMobile ? 80 : 160;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const isNavOpen = mobileNavState === 'open';

  const navVariants = {
    hidden: { y: '-120%', opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <>
      <AnimatePresence>
        {isSticky && (
          <motion.header
            variants={navVariants}
            initial="hidden"
            animate={isMobile ? (isNavOpen ? 'visible' : 'hidden') : 'visible'}
            exit="hidden"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-20 md:top-0 left-0 right-0 z-40 w-full h-16 md:h-20"
          >
            <div className="absolute inset-0 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
              <StickyLogo />

              <nav className="hidden md:flex items-center gap-2 relative">
                {navLinks.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(e) => handleLinkClick(e, `#${link.id}`)}
                    className={cn(
                      'relative px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200',
                      activeSection === link.id
                        ? 'text-teal-600'
                        : 'text-gray-700 hover:text-teal-600'
                    )}
                  >
                    {activeSection === link.id && (
                      <motion.div
                        layoutId="active-nav-link"
                        className="absolute inset-0 bg-teal-500/10 rounded-full z-0"
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

              <div className="flex md:hidden items-center justify-between w-full">
                <nav className="flex-grow overflow-x-auto scrollbar-hide">
                  <div className="flex items-center gap-2 px-1">
                    {navLinks.map((link) => (
                      <a
                        key={link.id}
                        href={`#${link.id}`}
                        onClick={(e) => handleLinkClick(e, `#${link.id}`)}
                        className={cn(
                          'relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0',
                          activeSection === link.id
                            ? 'bg-teal-600 text-white shadow'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </nav>
                <div className="pl-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-gray-500 hover:bg-gray-200"
                    onClick={() => setMobileNavState('closed')}
                    aria-label="סגור ניווט"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/register">
                  <Button className="group relative overflow-hidden bg-gradient-to-r from-teal-600 to-orange-500 hover:from-teal-700 hover:to-orange-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 px-5">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                    <span className="relative z-10 flex items-center">
                      <UserPlus className="ml-1.5 h-4 w-4" />
                      הרשמה
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobile && isSticky && !isNavOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed bottom-24 right-4 z-50"
          >
            <Button
              size="icon"
              className="rounded-full h-14 w-14 bg-white/80 backdrop-blur-md border border-gray-200/80 shadow-lg hover:bg-gray-100"
              onClick={() => setMobileNavState('open')}
              aria-label="פתח ניווט"
            >
              <Menu className="h-6 w-6 text-teal-600" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StickyNav;
