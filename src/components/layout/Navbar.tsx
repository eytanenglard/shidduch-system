// src/components/layout/Navbar.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AvailabilityStatus from './AvailabilityStatus';
import { useNotifications } from '@/app/[locale]/contexts/NotificationContext';
import {
  Users,
  User,
  LogOut,
  LogIn,
  UserPlus,
  MessageCircle,
  Settings,
  Heart,
  Menu,
  X,
  Globe,
  Lightbulb,
  Info,
  Award,
  HelpCircle,
  Mail,
} from 'lucide-react';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import UserDropdown from './UserDropdown';
import type { Dictionary } from '@/types/dictionary';
import { useQuestionnaireState } from '@/app/[locale]/contexts/QuestionnaireStateContext';

// --- רכיב לוגו (עם תיקון) ---
const Logo = ({ locale }: { locale: string }) => (
  <Link
    href={`/${locale}`}
    className="flex items-center gap-x-2 group shrink-0"
    aria-label="NeshamaTech Homepage"
  >
    <div className="relative h-9 w-9">
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
    <span className="text-xl font-bold bg-gradient-to-r from-teal-600 via-orange-500 to-amber-400 text-transparent bg-clip-text bg-size-200 bg-pos-0 group-hover:bg-pos-100 transition-all duration-700 ease-in-out">
      NeshamaTech
    </span>
  </Link>
);

// --- רכיבי ניווט (ללא שינוי, הם היו תקינים) ---
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
        'relative px-3 py-2 rounded-full text-sm transition-colors duration-200',
        isActive
          ? 'font-semibold text-cyan-600 bg-cyan-500/10'
          : 'font-medium text-gray-700 hover:text-cyan-600 hover:bg-cyan-500/10'
      )}
    >
      {text}
      {badge !== undefined && badge > 0 && (
        <motion.span
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold shadow-lg border-2 border-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative">{badge}</span>
        </motion.span>
      )}
    </Link>
  );
};

const MobileNavItem = ({
  href,
  text,
  icon,
  badge,
  onClick,
  id,
  isRtl,
}: {
  href: string;
  text: string;
  icon?: React.ReactNode;
  badge?: number;
  onClick: () => void;
  id?: string;
  isRtl: boolean;
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
        'flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 group gap-4',
        isActive
          ? 'bg-cyan-100 text-cyan-800 shadow-inner'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      {icon && (
        <span
          className={cn(
            'transition-colors',
            isActive
              ? 'text-cyan-600'
              : 'text-gray-500 group-hover:text-gray-700'
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex-grow">{text}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            'bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold',
            isRtl ? 'mr-auto' : 'ml-auto'
          )}
        >
          {badge}
        </span>
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
      const navHeight = 80;
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
      className="flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 group text-gray-700 hover:bg-gray-100 hover:text-gray-900 gap-4"
    >
      <span className="text-gray-500 group-hover:text-gray-700">{icon}</span>
      <span className="flex-grow">{text}</span>
    </a>
  );
};

interface NavbarProps {
  dict: Dictionary;
}

const Navbar = ({ dict }: NavbarProps) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const { isDirty, promptNavigation } = useQuestionnaireState();

  const isMatchmaker =
    session?.user?.role === 'MATCHMAKER' || session?.user?.role === 'ADMIN';
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

  const handleLanguageChange = () => {
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
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const handleSignOut = () => {
    setMobileMenuOpen(false);
    signOut({ callbackUrl: `/${locale}` });
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
  const mainProfileImage = session?.user?.image
    ? {
        id: 'session-image',
        url: session.user.image,
        isMain: true,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        cloudinaryPublicId: null,
      }
    : null;
  const navbarClasses = scrolled
    ? 'bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80'
    : 'bg-transparent border-b border-transparent';
  const profileIconSize = 'w-10 h-10';

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${navbarClasses}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4 md:gap-8">
              <Logo locale={locale} />
              <div
                aria-label="ניווט ראשי"
                className="hidden md:flex items-center gap-2 md:gap-3"
              >
                {session ? (
                  <>
                    {isMatchmaker ? (
                      <>
                        <NavItem
                          href="/matchmaker/suggestions"
                          text={dict.navbar.matchmakerSuggestions}
                        />
                        <NavItem
                          href="/matchmaker/clients"
                          text={dict.navbar.matchmakerClients}
                        />
                        <NavItem
                          href="/admin/engagement"
                          text={
                            dict.navbar.engagementDashboard ||
                            'ניהול Engagement'
                          }
                        />
                      </>
                    ) : (
                      <NavItem
                        id="onboarding-target-matches-link"
                        href="/matches"
                        text={dict.navbar.myMatches}
                      />
                    )}

                    <NavItem
                      href="/profile"
                      text={dict.userDropdown.myProfile}
                    />

                    <NavItem
                      href="/questionnaire"
                      text={dict.navbar.matchmakingQuestionnaire}
                    />
                    <NavItem
                      href="/messages"
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
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                onClick={handleLanguageChange}
                className="group flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-cyan-600 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-pink-50 rounded-full transition-all duration-300 border border-gray-200/60 hover:border-cyan-300 shadow-sm hover:shadow-lg"
                aria-label={`Switch to ${locale === 'he' ? 'English' : 'Hebrew'}`}
                title={`Switch to ${locale === 'he' ? 'English' : 'Hebrew'}`}
              >
                <div className="relative">
                  <Globe className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-cyan-500" />
                  <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm border border-white">
                    <span className="text-[8px] font-bold text-white leading-none">
                      {locale === 'he' ? 'ע' : 'E'}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-pink-600">
                  {locale === 'he' ? 'EN' : 'HE'}
                </span>
              </Button>

              {session && (
                <div
                  id="onboarding-target-availability-status"
                  className="hidden md:block"
                >
                  <AvailabilityStatus
                    dict={dict.profilePage.availabilityStatus}
                  />
                </div>
              )}
              {session ? (
                <UserDropdown
                  session={session}
                  mainProfileImage={mainProfileImage}
                  getInitials={getInitials}
                  handleSignOut={handleSignOut}
                  profileIconSize={profileIconSize}
                  dict={dict.userDropdown}
                  locale={locale}
                />
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <NavItem
                    href="/questionnaire"
                    text={dict.navbar.toQuestionnaire}
                  />
                  <NavItem href="/auth/signin" text={dict.navbar.login} />
                  <Link href={`/${locale}/auth/register`}>
                    <Button className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 px-5 py-2.5">
                      <span className="relative z-10 flex items-center">
                        <UserPlus
                          className={cn('h-4 w-4', isRtl ? 'ml-1.5' : 'mr-1.5')}
                        />
                        {dict.navbar.register}
                      </span>
                    </Button>
                  </Link>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600 hover:text-cyan-600 hover:bg-cyan-100/50 rounded-full"
                onClick={toggleMobileMenu}
                aria-label="פתח תפריט"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu-panel"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm md:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}
      <div
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
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
            <Logo locale={locale} />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="text-gray-500 hover:text-gray-800 rounded-full"
              aria-label="סגור תפריט"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Container for scrollable content */}
          <div
            className="overflow-y-auto flex-grow overscroll-contain pb-8"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {session?.user && (
              <div className="p-4 space-y-3">
                {/* כרטיס פרופיל עם קישור */}
                <Link
                  href={`/${locale}/profile`}
                  onClick={toggleMobileMenu}
                  className="block"
                >
                  <div className="p-4 border rounded-xl bg-gradient-to-br from-cyan-50/50 to-pink-50/50 hover:from-cyan-100/50 hover:to-pink-100/50 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div
                        className={`relative ${profileIconSize} rounded-full flex-shrink-0 flex items-center justify-center shadow-sm overflow-hidden ring-2 ring-white group-hover:ring-cyan-200 transition-all`}
                      >
                        {mainProfileImage?.url ? (
                          <Image
                            src={getRelativeCloudinaryPath(
                              mainProfileImage.url
                            )}
                            alt={session.user.name || 'תמונת פרופיל'}
                            fill
                            className="object-cover rounded-full"
                            sizes="40px"
                          />
                        ) : (
                          <span className="font-semibold text-xl text-cyan-700 bg-cyan-100 w-full h-full flex items-center justify-center rounded-full">
                            {getInitials()}
                          </span>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="font-semibold text-gray-800 truncate group-hover:text-cyan-700 transition-colors">
                          {session.user.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {session.user.email}
                        </div>
                        <div className="text-xs text-cyan-600 font-medium mt-1 group-hover:text-cyan-700">
                          {dict.userDropdown.myProfile} ←
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* סטטוס זמינות */}
                <div
                  id="onboarding-target-availability-status"
                  className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                >
                  <AvailabilityStatus
                    dict={dict.profilePage.availabilityStatus}
                  />
                </div>

                {/* כפתור שינוי שפה */}
                <Button
                  variant="outline"
                  onClick={handleLanguageChange}
                  className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-pink-50 hover:border-cyan-300 flex items-center justify-between py-3 text-base transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Globe className="h-5 w-5 text-cyan-600" />
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full flex items-center justify-center border border-white">
                        <span className="text-[8px] font-bold text-white leading-none">
                          {locale === 'he' ? 'ע' : 'E'}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-700">
                      {locale === 'he' ? 'English' : 'עברית'}
                    </span>
                  </div>
                  <span className="font-bold text-sm bg-gradient-to-r from-cyan-600 to-pink-600 bg-clip-text text-transparent">
                    {locale === 'he' ? 'EN' : 'HE'}
                  </span>
                </Button>
              </div>
            )}

            <nav className="space-y-1.5 p-2 pb-6">
              {session ? (
                <>
                  {isMatchmaker ? (
                    <>
                      <MobileNavItem
                        href="/matchmaker/suggestions"
                        text={dict.navbar.matchmakerSuggestions}
                        icon={<Heart className="h-5 w-5" />}
                        onClick={toggleMobileMenu}
                        isRtl={isRtl}
                      />
                      <MobileNavItem
                        href="/matchmaker/clients"
                        text={dict.navbar.matchmakerClients}
                        icon={<Users className="h-5 w-5" />}
                        onClick={toggleMobileMenu}
                        isRtl={isRtl}
                      />
                      <MobileNavItem
                        href="/admin/engagement"
                        text={
                          dict.navbar.engagementDashboard || 'ניהול Engagement'
                        }
                        icon={<Mail className="h-5 w-5" />}
                        onClick={toggleMobileMenu}
                        isRtl={isRtl}
                      />
                    </>
                  ) : (
                    <MobileNavItem
                      id="onboarding-target-matches-link"
                      href="/matches"
                      text={dict.navbar.myMatches}
                      icon={<Users className="h-5 w-5" />}
                      onClick={toggleMobileMenu}
                      isRtl={isRtl}
                    />
                  )}
                  <MobileNavItem
                    href="/questionnaire"
                    text={dict.navbar.matchmakingQuestionnaire}
                    icon={<Lightbulb className="h-5 w-5" />}
                    onClick={toggleMobileMenu}
                    isRtl={isRtl}
                  />
                  <MobileNavItem
                    id="onboarding-target-messages-link"
                    href="/messages"
                    text={dict.navbar.messages}
                    icon={<MessageCircle className="h-5 w-5" />}
                    badge={
                      notifications.total > 0 ? notifications.total : undefined
                    }
                    onClick={toggleMobileMenu}
                    isRtl={isRtl}
                  />

                  {isHomePage && homePageLinks.length > 0 && (
                    <>
                      <hr className="my-3" />
                      <div className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {dict.stickyNav.mobileTitle || 'ניווט בדף'}
                      </div>
                      {homePageLinks.map((link) => (
                        <MobileHomePageLink
                          key={link.id}
                          href={`#${link.id}`}
                          text={link.text}
                          icon={link.icon}
                          onClick={toggleMobileMenu}
                        />
                      ))}
                    </>
                  )}

                  <hr className="my-3" />

                  <MobileNavItem
                    href="/settings"
                    text={dict.userDropdown.accountSettings}
                    icon={<Settings className="h-5 w-5" />}
                    onClick={toggleMobileMenu}
                    isRtl={isRtl}
                  />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors gap-4"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="flex-grow text-start">
                      {dict.userDropdown.signOut}
                    </span>
                  </button>
                </>
              ) : (
                <>
                  {/* כפתור שינוי שפה למשתמשים לא מחוברים */}
                  <div className="p-4">
                    <Button
                      variant="outline"
                      onClick={handleLanguageChange}
                      className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-pink-50 hover:border-cyan-300 flex items-center justify-between py-3 text-base transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <Globe className="h-5 w-5 text-cyan-600" />
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full flex items-center justify-center border border-white">
                            <span className="text-[8px] font-bold text-white leading-none">
                              {locale === 'he' ? 'ע' : 'E'}
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-700">
                          {locale === 'he' ? 'English' : 'עברית'}
                        </span>
                      </div>
                      <span className="font-bold text-sm bg-gradient-to-r from-cyan-600 to-pink-600 bg-clip-text text-transparent">
                        {locale === 'he' ? 'EN' : 'HE'}
                      </span>
                    </Button>
                  </div>

                  {isHomePage && homePageLinks.length > 0 && (
                    <>
                      <div className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {dict.stickyNav.mobileTitle || 'ניווט בדף'}
                      </div>
                      {homePageLinks.map((link) => (
                        <MobileHomePageLink
                          key={link.id}
                          href={`#${link.id}`}
                          text={link.text}
                          icon={link.icon}
                          onClick={toggleMobileMenu}
                        />
                      ))}
                      <hr className="my-3" />
                    </>
                  )}

                  <MobileNavItem
                    href="/questionnaire"
                    text={dict.navbar.matchmakingQuestionnaire}
                    icon={<Lightbulb className="h-5 w-5" />}
                    onClick={toggleMobileMenu}
                    isRtl={isRtl}
                  />
                  <MobileNavItem
                    href="/auth/signin"
                    text={dict.navbar.login}
                    icon={<LogIn className="h-5 w-5" />}
                    onClick={toggleMobileMenu}
                    isRtl={isRtl}
                  />
                  <MobileNavItem
                    href="/auth/register"
                    text={dict.navbar.register}
                    icon={<UserPlus className="h-5 w-5" />}
                    onClick={toggleMobileMenu}
                    isRtl={isRtl}
                  />
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
