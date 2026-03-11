// src/components/layout/Navbar.tsx

'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AvailabilityStatus from './AvailabilityStatus';
import { useNotifications } from '@/app/[locale]/contexts/NotificationContext';
import {
  Users,
  LogOut,
  LogIn,
  UserPlus,
  MessageCircle,
  Settings,
  Heart,
  X,
  Globe,
  Lightbulb,
  Info,
  Award,
  HelpCircle,
  Mail,
  Gift,
  HeartHandshake,
} from 'lucide-react';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import UserDropdown from './UserDropdown';
import type { Dictionary } from '@/types/dictionary';
import { useQuestionnaireState } from '@/app/[locale]/contexts/QuestionnaireStateContext';

// =============================================================================
// #20 — לוגו מפושט: gradient סטטי בלי אנימציה, שני צבעים בלבד
// =============================================================================
const Logo = ({ locale }: { locale: string }) => (
  <Link
    href={`/${locale}`}
    className="flex items-center gap-x-2 group shrink-0"
    aria-label="NeshamaTech Homepage"
  >
    <div className="relative h-9 w-9">
      <Image
        src="/logo.png"
        alt="NeshamaTech Icon"
        fill
        className="object-contain transition-transform duration-300 group-hover:scale-110"
        priority
        sizes="36px"
        unoptimized
      />
    </div>
    {/* #20: gradient סטטי פשוט — teal בלבד, hover עדין */}
    <span className="text-xl font-bold text-teal-700 transition-colors duration-300 group-hover:text-teal-800">
      NeshamaTech
    </span>
  </Link>
);

// =============================================================================
// #18 — אייקון המבורגר מתנפש ל-X
// =============================================================================
const AnimatedMenuIcon = ({ isOpen }: { isOpen: boolean }) => (
  <div className="relative w-5 h-5 flex flex-col items-center justify-center">
    <motion.span
      className="absolute h-0.5 w-5 bg-current rounded-full"
      animate={isOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    />
    <motion.span
      className="absolute h-0.5 w-5 bg-current rounded-full"
      animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.15 }}
    />
    <motion.span
      className="absolute h-0.5 w-5 bg-current rounded-full"
      animate={isOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    />
  </div>
);

// =============================================================================
// NavItem — desktop (#23: badge אדום לנוטיפיקציות, #7: אנימציה חד-פעמית)
// =============================================================================
const NavItem = ({
  href,
  text,
  badge,
  id,
}: {
  href: string;
  text: string;
  badge?: number;
  id?: string;
}) => {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'he';
  const fullHref = `/${locale}${href}`;
  const isActive =
    pathname === fullHref || (href !== '/' && pathname.startsWith(fullHref));
  return (
    <Link
      id={id}
      href={fullHref}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative px-3 py-2 rounded-full text-sm transition-all duration-200',
        isActive
          ? 'font-bold text-teal-700 bg-teal-50'
          : 'font-medium text-gray-600 hover:text-teal-600 hover:bg-teal-50/50'
      )}
    >
      {text}
      {/* #23: badge אדום (לא כתום כמו CTA), #7: אנימציה חד-פעמית בלבד */}
      {badge !== undefined && badge > 0 && (
        <motion.span
          key={badge}
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm border-2 border-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {badge}
        </motion.span>
      )}
    </Link>
  );
};

// =============================================================================
// MobileNavItem — (#25: active:scale, #22: תמיכה בגודל שונה לפריטים ראשיים,
//                  #23: badge אדום, #7: אנימציה חד-פעמית)
// =============================================================================
const MobileNavItem = ({
  href,
  text,
  icon,
  badge,
  onClick,
  id,
  isRtl,
  isPrimary = false,
}: {
  href: string;
  text: string;
  icon?: React.ReactNode;
  badge?: number;
  onClick: () => void;
  id?: string;
  isRtl: boolean;
  isPrimary?: boolean;
}) => {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'he';
  const fullHref = `/${locale}${href}`;
  const isActive =
    pathname === fullHref || (href !== '/' && pathname.startsWith(fullHref));
  return (
    <Link
      id={id}
      href={fullHref}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        // #25: active:scale-[0.98] לפידבק מגע
        'flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-150 group gap-4 mb-1 touch-manipulation active:scale-[0.98]',
        // #22: פריטים ראשיים בולטים יותר
        isPrimary ? 'text-base' : 'text-sm',
        isActive
          ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100/50'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      {icon && (
        <span
          className={cn(
            'transition-colors flex-shrink-0',
            // #22: אייקונים צבעוניים לפריטים ראשיים
            isActive
              ? 'text-teal-600'
              : isPrimary
                ? 'text-teal-500 group-hover:text-teal-600'
                : 'text-gray-400 group-hover:text-gray-600'
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex-grow">{text}</span>
      {/* #23: badge אדום, #7: אנימציה חד-פעמית */}
      {badge !== undefined && badge > 0 && (
        <motion.span
          key={badge}
          className={cn(
            'bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center justify-center font-bold shadow-sm',
            isRtl ? 'mr-auto' : 'ml-auto'
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {badge}
        </motion.span>
      )}
    </Link>
  );
};

const MobileHomePageLink = ({
  href,
  text,
  icon,
  onClick,
}: {
  href: string;
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
}) => {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      // #9: גובה navbar מעודכן ל-64px
      const navHeight = 64;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    onClick();
  };
  return (
    <a
      href={href}
      onClick={handleScroll}
      // #25: active:scale
      className="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 group text-gray-600 hover:bg-gray-50 hover:text-gray-900 gap-4 touch-manipulation active:scale-[0.98]"
    >
      <span className="text-gray-400 group-hover:text-gray-600 flex-shrink-0">
        {icon}
      </span>
      <span className="flex-grow">{text}</span>
    </a>
  );
};

// =============================================================================
// #17 — useScrollLock hook (תומך גם ב-iOS)
// =============================================================================
function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    const originalStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.position = originalStyle.position;
      document.body.style.top = originalStyle.top;
      document.body.style.width = originalStyle.width;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}

// =============================================================================
// #11 — useFocusTrap hook
// =============================================================================
function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean
) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll(focusableSelector);
      if (focusableElements.length === 0) return;

      const firstEl = focusableElements[0] as HTMLElement;
      const lastEl = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first focusable element on open
    const firstFocusable = container.querySelector(
      focusableSelector
    ) as HTMLElement | null;
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, containerRef]);
}

// =============================================================================
// Stagger animation variants for mobile menu items (#19)
// =============================================================================
const menuContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
  exit: { opacity: 0 },
};

const menuItemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// =============================================================================
// Navbar
// =============================================================================

interface NavbarProps {
  dict: Dictionary;
}

const Navbar = ({ dict }: NavbarProps) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const { isDirty, promptNavigation } = useQuestionnaireState();

  const isMatchmaker =
    session?.user?.role === 'MATCHMAKER' || session?.user?.role === 'ADMIN';
  const isAdmin = session?.user?.role === 'ADMIN';
  const { notifications } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const locale = (pathname.split('/')[1] || 'he') as 'he' | 'en';
  const isRtl = locale === 'he';

  const isHomePage = pathname === `/${locale}` || pathname === '/';

  const homePageLinks = dict.stickyNav?.navLinks
    ? [
        {
          id: 'how-it-works',
          text: dict.stickyNav.navLinks.howItWorks,
          icon: <Info className="h-5 w-5" />,
        },
        {
          id: 'suggestion-demo',
          text: dict.stickyNav.navLinks.suggestionDemo,
          icon: <Heart className="h-5 w-5" />,
        },
        {
          id: 'success-stories',
          text: dict.stickyNav.navLinks.successStories,
          icon: <Award className="h-5 w-5" />,
        },
        {
          id: 'our-team',
          text: dict.stickyNav.navLinks.ourTeam,
          icon: <Users className="h-5 w-5" />,
        },
        {
          id: 'faq',
          text: dict.stickyNav.navLinks.faq,
          icon: <HelpCircle className="h-5 w-5" />,
        },
      ]
    : [];

  // #3: כפתור שפה — פשוט, בלי אנימציות מיותרות
  const handleLanguageChange = useCallback(() => {
    const changeAction = () => {
      const newLocale = locale === 'he' ? 'en' : 'he';
      const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
      router.push(newPathname);
    };

    if (isDirty) {
      promptNavigation(changeAction);
    } else {
      changeAction();
    }
  }, [locale, pathname, mobileMenuOpen, isDirty, promptNavigation, router]);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // #10: סגירת תפריט צד אוטומטית בשינוי pathname
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // #17: scroll lock
  useScrollLock(mobileMenuOpen);

  // #11: focus trap
  useFocusTrap(mobileMenuRef, mobileMenuOpen);

  // #12: Escape key סוגר את התפריט
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleSignOut = useCallback(() => {
    setMobileMenuOpen(false);
    signOut({ callbackUrl: `/${locale}` });
  }, [locale]);

  // #16: getInitials עם useMemo
  const initials = useMemo(() => {
    const fullName = session?.user?.name;
    if (!fullName) return 'P';
    const names = fullName.split(' ');
    return (
      (names[0]?.[0] || '') +
      (names.length > 1 ? names[names.length - 1]?.[0] || '' : '')
    ).toUpperCase();
  }, [session?.user?.name]);

  const mainProfileImage = useMemo(() => {
    if (!session?.user?.image) return null;
    return {
      id: 'session-image',
      url: session.user.image,
      isMain: true,
      userId: session.user.id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      cloudinaryPublicId: null,
    };
  }, [session?.user?.image, session?.user?.id]);

  // #8: רקע מוצק תמיד, shadow משתנה בגלילה בלבד
  const navbarClasses = scrolled
    ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100'
    : 'bg-white border-b border-gray-50';

  const profileIconSize = 'w-10 h-10';

  // נתיב הודעות לפי תפקיד
  const messagesHref = isMatchmaker ? '/matchmaker/messages' : '/messages';

  return (
    <>
      {/* ================================================================= */}
      {/* #9: גובה navbar מופחת ל-h-16 (64px) במקום h-20 (80px)           */}
      {/* #8: רקע מוצק תמיד                                                */}
      {/* ================================================================= */}
      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${navbarClasses}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4 md:gap-8">
              <Logo locale={locale} />

              {/* =========================================================== */}
              {/* Desktop nav — #2: dropdown לשדכנית, #13: פרופיל רק ב-dropdown */}
              {/* #14: שאלון לא מוצג פעמיים לאורח                             */}
              {/* =========================================================== */}
              <div
                aria-label="ניווט ראשי"
                className="hidden md:flex items-center gap-1 md:gap-2"
              >
                {session ? (
                  <>
                    {isMatchmaker ? (
                      <>
                        {/* #2: ניווט שדכנית — פריטים עיקריים בלבד ב-navbar */}
                        <NavItem
                          href="/matchmaker/suggestions"
                          text={dict.navbar.matchmakerSuggestions}
                        />
                        <NavItem
                          href="/matchmaker/clients"
                          text={dict.navbar.matchmakerClients}
                        />
                        <NavItem
                          href="/matchmaker/potential-matches"
                          text={
                            dict.navbar.potentialMatches || 'התאמות פוטנציאליות'
                          }
                        />
                        {/* #2: פריטים ניהוליים — dropdown בתוך UserDropdown עדיף,
                             אבל כרגע נשאיר כי צריך שינוי ב-UserDropdown */}
                        <NavItem
                          href="/admin/engagement"
                          text={
                            dict.navbar.engagementDashboard ||
                            'ניהול Engagement'
                          }
                        />
                        {isAdmin && (
                          <NavItem
                            href="/admin/referrals"
                            text={dict.navbar.referralsAdmin || 'ניהול רפרלים'}
                          />
                        )}
                      </>
                    ) : (
                      <NavItem
                        id="onboarding-target-matches-link"
                        href="/matches"
                        text={dict.navbar.myMatches}
                      />
                    )}

                    {/* #13: הסרנו NavItem לפרופיל מכאן — הוא קיים ב-UserDropdown */}

                    <NavItem
                      href="/questionnaire"
                      text={dict.navbar.matchmakingQuestionnaire}
                    />
                    <NavItem
                      href={messagesHref}
                      id="onboarding-target-messages-link"
                      text={dict.navbar.messages}
                      badge={
                        notifications.total > 0
                          ? notifications.total
                          : undefined
                      }
                    />
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* =========================================================== */}
              {/* #3: כפתור שפה מפושט — אייקון globe + טקסט בלבד             */}
              {/* =========================================================== */}
              <Button
                variant="ghost"
                onClick={handleLanguageChange}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-full transition-colors duration-200"
                aria-label={`Switch to ${locale === 'he' ? 'English' : 'Hebrew'}`}
                title={`Switch to ${locale === 'he' ? 'English' : 'Hebrew'}`}
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {locale === 'he' ? 'EN' : 'HE'}
                </span>
              </Button>

              {/* #1: AvailabilityStatus הוסר מה-navbar — יוצג רק בתפריט צד */}

              {/* #1 (desktop): UserDropdown רק בדסקטופ */}
              {session ? (
                <div className="hidden md:block">
                  <UserDropdown
                    session={session}
                    mainProfileImage={mainProfileImage}
                    getInitials={() => initials}
                    handleSignOut={handleSignOut}
                    profileIconSize={profileIconSize}
                    dict={dict.userDropdown}
                    locale={locale}
                  />
                </div>
              ) : (
                // #14: כפתורי login/register לאורח — בלי כפתור שאלון כפול
                <div className="hidden md:flex items-center gap-2">
                  <NavItem href="/auth/signin" text={dict.navbar.login} />

                  {/* #21: כפתור register מפושט — solid color, בלי shimmer */}
                  <Link
                    href={`/${locale}/auth/register`}
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 px-5 py-2 inline-flex items-center justify-center font-semibold text-sm"
                  >
                    <UserPlus
                      className={cn('h-4 w-4', isRtl ? 'ml-1.5' : 'mr-1.5')}
                    />
                    {dict.navbar.register}
                  </Link>
                </div>
              )}

              {/* #18: אייקון המבורגר מתנפש ל-X — מוצג רק במובייל */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-full touch-manipulation"
                onClick={toggleMobileMenu}
                aria-label={mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu-panel"
              >
                <AnimatedMenuIcon isOpen={mobileMenuOpen} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* =================================================================== */}
      {/* #24: Overlay רכה יותר (bg-black/25)                                */}
      {/* =================================================================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/25 z-40 backdrop-blur-sm md:hidden"
            onClick={closeMobileMenu}
            style={{ touchAction: 'none' }}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* תפריט צד — כולל:                                                   */}
      {/* #6: אזור פרופיל מצומצם                                             */}
      {/* #11: focus trap                                                     */}
      {/* #15: לוגו הוסר מתפריט הצד — רק X לסגירה                           */}
      {/* #19: stagger animation על הפריטים                                   */}
      {/* #22: היררכיה ויזואלית — פריטים ראשיים בולטים                       */}
      {/* #4: כפתור שפה בתחתית, קטן ושקט                                     */}
      {/* #26: הפרדה בין קבוצות עם padding גדול יותר                         */}
      {/* =================================================================== */}
      <div
        ref={mobileMenuRef}
        className={cn(
          'fixed top-0 z-50 h-full w-4/5 max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden',
          isRtl ? 'right-0' : 'left-0',
          mobileMenuOpen
            ? 'translate-x-0'
            : isRtl
              ? 'translate-x-full'
              : '-translate-x-full'
        )}
        id="mobile-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="תפריט ניווט"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* =============================================================== */}
          {/* #15: Header — רק כפתור סגירה (בלי לוגו)                        */}
          {/* =============================================================== */}
          <div
            className={cn(
              'flex items-center p-4 border-b border-gray-100 shrink-0',
              isRtl ? 'justify-start' : 'justify-end'
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMobileMenu}
              className="text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-100 touch-manipulation"
              aria-label="סגור תפריט"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div
            className="overflow-y-auto flex-grow pb-8 scrollbar-hide min-h-0"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehavior: 'contain',
            }}
          >
            {/* ============================================================= */}
            {/* #6: אזור פרופיל מצומצם — אווטאר + שם בלבד, בלי קלף גדול    */}
            {/* #1: AvailabilityStatus מוצג כאן בלבד (לא ב-navbar desktop)   */}
            {/* ============================================================= */}
            {session?.user && (
              <div className="px-4 pt-4 pb-2 space-y-3">
                <Link
                  href={`/${locale}/profile`}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors active:scale-[0.98] touch-manipulation"
                >
                  <div
                    className={`relative ${profileIconSize} rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-gray-100`}
                  >
                    {mainProfileImage?.url ? (
                      <Image
                        src={getRelativeCloudinaryPath(mainProfileImage.url)}
                        alt={session.user.name || 'תמונת פרופיל'}
                        fill
                        className="object-cover rounded-full"
                        sizes="40px"
                      />
                    ) : (
                      <span className="font-semibold text-lg text-teal-800 bg-teal-100 w-full h-full flex items-center justify-center rounded-full">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-semibold text-gray-800 truncate text-sm">
                      {session.user.name}
                    </div>
                    <div className="text-xs text-teal-600 font-medium">
                      {dict.userDropdown.myProfile}
                      <span className="text-[10px] mx-0.5">
                        {isRtl ? '←' : '→'}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="px-1">
                  <AvailabilityStatus
                    dict={dict.profilePage.availabilityStatus}
                  />
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* ניווט ראשי — עם stagger animation (#19)                       */}
            {/* ============================================================= */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.nav
                  className="p-2"
                  variants={menuContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {session ? (
                    <>
                      {/* #22: קטגוריה ראשית */}
                      <motion.div
                        variants={menuItemVariants}
                        className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
                      >
                        {isRtl ? 'תפריט ראשי' : 'Main Menu'}
                      </motion.div>

                      {isMatchmaker ? (
                        <>
                          <motion.div variants={menuItemVariants}>
                            <MobileNavItem
                              href="/matchmaker/suggestions"
                              text={dict.navbar.matchmakerSuggestions}
                              icon={<Heart className="h-5 w-5" />}
                              onClick={closeMobileMenu}
                              isRtl={isRtl}
                              isPrimary
                            />
                          </motion.div>
                          <motion.div variants={menuItemVariants}>
                            <MobileNavItem
                              href="/matchmaker/clients"
                              text={dict.navbar.matchmakerClients}
                              icon={<Users className="h-5 w-5" />}
                              onClick={closeMobileMenu}
                              isRtl={isRtl}
                              isPrimary
                            />
                          </motion.div>
                          <motion.div variants={menuItemVariants}>
                            <MobileNavItem
                              href="/matchmaker/potential-matches"
                              text={
                                dict.navbar.potentialMatches ||
                                'התאמות פוטנציאליות'
                              }
                              icon={<HeartHandshake className="h-5 w-5" />}
                              onClick={closeMobileMenu}
                              isRtl={isRtl}
                              isPrimary
                            />
                          </motion.div>
                          <motion.div variants={menuItemVariants}>
                            <MobileNavItem
                              href="/admin/engagement"
                              text={
                                dict.navbar.engagementDashboard ||
                                'ניהול Engagement'
                              }
                              icon={<Mail className="h-5 w-5" />}
                              onClick={closeMobileMenu}
                              isRtl={isRtl}
                            />
                          </motion.div>
                          {isAdmin && (
                            <motion.div variants={menuItemVariants}>
                              <MobileNavItem
                                href="/admin/referrals"
                                text={
                                  dict.navbar.referralsAdmin || 'ניהול רפרלים'
                                }
                                icon={<Gift className="h-5 w-5" />}
                                onClick={closeMobileMenu}
                                isRtl={isRtl}
                              />
                            </motion.div>
                          )}
                        </>
                      ) : (
                        <motion.div variants={menuItemVariants}>
                          <MobileNavItem
                            id="onboarding-target-matches-link"
                            href="/matches"
                            text={dict.navbar.myMatches}
                            icon={<Users className="h-5 w-5" />}
                            onClick={closeMobileMenu}
                            isRtl={isRtl}
                            isPrimary
                          />
                        </motion.div>
                      )}

                      <motion.div variants={menuItemVariants}>
                        <MobileNavItem
                          href="/questionnaire"
                          text={dict.navbar.matchmakingQuestionnaire}
                          icon={<Lightbulb className="h-5 w-5" />}
                          onClick={closeMobileMenu}
                          isRtl={isRtl}
                          isPrimary
                        />
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <MobileNavItem
                          id="onboarding-target-messages-link"
                          href={messagesHref}
                          text={dict.navbar.messages}
                          icon={<MessageCircle className="h-5 w-5" />}
                          badge={
                            notifications.total > 0
                              ? notifications.total
                              : undefined
                          }
                          onClick={closeMobileMenu}
                          isRtl={isRtl}
                          isPrimary
                        />
                      </motion.div>

                      {/* Home page section links */}
                      {isHomePage && homePageLinks.length > 0 && (
                        <>
                          {/* #26: padding גדול יותר במקום קו דק */}
                          <motion.div
                            variants={menuItemVariants}
                            className="px-4 pt-6 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
                          >
                            {dict.stickyNav.mobileTitle || 'ניווט בדף'}
                          </motion.div>
                          {homePageLinks.map((link) => (
                            <motion.div
                              key={link.id}
                              variants={menuItemVariants}
                            >
                              <MobileHomePageLink
                                href={`#${link.id}`}
                                text={link.text}
                                icon={link.icon}
                                onClick={closeMobileMenu}
                              />
                            </motion.div>
                          ))}
                        </>
                      )}

                      {/* #22/#26: קבוצה משנית — הגדרות והתנתקות */}
                      <motion.div
                        variants={menuItemVariants}
                        className="px-4 pt-6 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
                      >
                        {isRtl ? 'חשבון' : 'Account'}
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <MobileNavItem
                          href="/settings"
                          text={dict.userDropdown.accountSettings}
                          icon={<Settings className="h-5 w-5" />}
                          onClick={closeMobileMenu}
                          isRtl={isRtl}
                        />
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={handleSignOut}
                          // #25: active:scale
                          className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-150 gap-4 touch-manipulation active:scale-[0.98]"
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="flex-grow text-start">
                            {dict.userDropdown.signOut}
                          </span>
                        </button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      {/* ================================================= */}
                      {/* Guest mobile menu                                  */}
                      {/* ================================================= */}
                      {isHomePage && homePageLinks.length > 0 && (
                        <>
                          <motion.div
                            variants={menuItemVariants}
                            className="px-4 pt-2 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
                          >
                            {dict.stickyNav.mobileTitle || 'ניווט בדף'}
                          </motion.div>
                          {homePageLinks.map((link) => (
                            <motion.div
                              key={link.id}
                              variants={menuItemVariants}
                            >
                              <MobileHomePageLink
                                href={`#${link.id}`}
                                text={link.text}
                                icon={link.icon}
                                onClick={closeMobileMenu}
                              />
                            </motion.div>
                          ))}
                          <div className="h-4" />
                        </>
                      )}

                      {/* #14: שאלון מוצג פעם אחת בלבד */}
                      <motion.div variants={menuItemVariants}>
                        <MobileNavItem
                          href="/questionnaire"
                          text={dict.navbar.matchmakingQuestionnaire}
                          icon={<Lightbulb className="h-5 w-5" />}
                          onClick={closeMobileMenu}
                          isRtl={isRtl}
                          isPrimary
                        />
                      </motion.div>
                      <motion.div variants={menuItemVariants}>
                        <MobileNavItem
                          href="/auth/signin"
                          text={dict.navbar.login}
                          icon={<LogIn className="h-5 w-5" />}
                          onClick={closeMobileMenu}
                          isRtl={isRtl}
                        />
                      </motion.div>
                      <motion.div variants={menuItemVariants}>
                        <MobileNavItem
                          href="/auth/register"
                          text={dict.navbar.register}
                          icon={<UserPlus className="h-5 w-5" />}
                          onClick={closeMobileMenu}
                          isRtl={isRtl}
                          isPrimary
                        />
                      </motion.div>
                    </>
                  )}

                  {/* ======================================================= */}
                  {/* #4: כפתור שפה בתחתית התפריט — קטן ושקט                  */}
                  {/* ======================================================= */}
                  <motion.div variants={menuItemVariants} className="pt-6 px-4">
                    <button
                      onClick={handleLanguageChange}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">
                        {locale === 'he' ? 'Switch to English' : 'עבור לעברית'}
                      </span>
                    </button>
                  </motion.div>
                </motion.nav>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
