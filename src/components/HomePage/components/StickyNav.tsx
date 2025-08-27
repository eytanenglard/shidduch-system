// src/components/HomePage/components/StickyNav.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { UserPlus, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { UserImage } from '@/types/next-auth';
import UserDropdown from '@/components/layout/UserDropdown';
import type { StickyNavDict } from '@/types/dictionary'; // ✨ 1. ייבוא הטיפוס החדש

export interface NavLink {
  id: string;
  label: string;
}

interface StickyNavProps {
  locale: 'he' | 'en';
  navLinks: NavLink[];
  session: Session | null;
  isVisible: boolean;
  dict: StickyNavDict; // ✨ 2. הוספת המילון לממשק ה-props
}

// ======================== קומפוננטת הלוגו המעודכנת ========================
const StickyLogo = ({ homepageAriaLabel }: { homepageAriaLabel: string }) => {
  return (
    <Link
      href="/"
      className="hidden md:flex items-center gap-x-2 group shrink-0"
      aria-label={homepageAriaLabel} // ✨ שימוש ב-prop
    >
      <div className="relative h-8 w-8">
        <Image
          src={getRelativeCloudinaryPath(
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

const StickyNav: React.FC<StickyNavProps> = ({
  navLinks,
  session,
  isVisible,
  dict, // ✨ 3. קבלת המילון כ-prop
  locale,
}) => {
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
      // START: Improved Logic
      const navHeight = isMobile ? 64 : 80; // Height of the sticky nav
      const triggerPoint = currentScrollY + navHeight + 40; // Nav height + extra margin

      let currentSection = '';

      // Iterate backwards to find the last section that is above the trigger point
      for (let i = sectionRefs.current.length - 1; i >= 0; i--) {
        const section = sectionRefs.current[i];
        if (section && section.offsetTop <= triggerPoint) {
          currentSection = navLinks[i].id;
          break; // Found the active section, no need to continue
        }
      }
      // END: Improved Logic

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
  }, [navLinks, isMobile]); // Dependencies remain the same

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const navHeight = isMobile ? 64 : 80;
      const topOffset = isMobile ? 80 : 0;
      const padding = 30;
      const headerOffset = navHeight + topOffset + padding;

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

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const getInitials = () => {
    const fullName = session?.user?.name;
    if (!fullName) return 'P';
    const names = fullName.split(' ');
    return (
      (names[0]?.[0] || '') +
      (names.length > 1 ? names[names.length - 1]?.[0] || '' : '')
    ).toUpperCase();
  };

  const getMainProfileImage = (): UserImage | null => {
    if (session?.user?.image) {
      return {
        id: 'session-image',
        url: session.user.image,
        isMain: true,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        cloudinaryPublicId: null,
      };
    }
    return null;
  };

  const mainProfileImage = getMainProfileImage();
  const profileIconSize = 'w-10 h-10';

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.header
            variants={navVariants}
            initial="hidden"
            animate={isMobile ? (isNavOpen ? 'visible' : 'hidden') : 'visible'}
            exit="hidden"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-40 w-full h-16 md:h-20"
          >
            <div className="absolute inset-0 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
              <StickyLogo homepageAriaLabel={dict.homepageAriaLabel} />

              <nav className="hidden md:flex items-center gap-2 relative">
                {navLinks.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(e) => handleLinkClick(e, `#${link.id}`)}
                    className={cn(
                      'relative px-3 py-2 rounded-full text-sm transition-colors duration-200',
                      activeSection === link.id
                        ? 'font-semibold text-cyan-600'
                        : 'font-medium text-gray-700 hover:text-cyan-600 hover:bg-cyan-500/10'
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
                            ? 'font-semibold text-cyan-600 bg-cyan-500/10'
                            : 'font-medium text-gray-700 hover:text-cyan-600 hover:bg-cyan-500/10'
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
                    aria-label={dict.closeNavAriaLabel} // ✨ שימוש בתרגום
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2">
                {session ? (
                  <UserDropdown
                    session={session}
                    mainProfileImage={mainProfileImage}
                    getInitials={getInitials}
                    handleSignOut={handleSignOut}
                    profileIconSize={profileIconSize}
                    locale={locale}
                  />
                ) : (
                  <Link href="/auth/register">
                    <Button className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 px-5 py-2.5">
                      <span className="relative z-10 flex items-center">
                        <UserPlus className="ml-1.5 h-4 w-4" />
                        {dict.signUpButton} {/* ✨ שימוש בתרגום */}
                      </span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobile && isVisible && !isNavOpen && (
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
              aria-label={dict.openNavAriaLabel} // ✨ שימוש בתרגום
            >
              <Menu className="h-6 w-6 text-cyan-600" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StickyNav;
