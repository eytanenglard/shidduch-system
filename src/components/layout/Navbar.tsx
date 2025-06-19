// src/components/layout/Navbar.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import AvailabilityStatus from "@/components/AvailabilityStatus";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useNotifications } from "@/app/contexts/NotificationContext";
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
} from "lucide-react";
import type { Session as NextAuthSession } from "next-auth";
import type { UserImage } from "@/types/next-auth";

// רכיב התפריט הנפתח של המשתמש, מותאם לעיצוב החדש
const UserDropdown = ({
  session,
  mainProfileImage,
  getInitials,
  handleSignOut,
  profileIconSize,
}: {
  session: (NextAuthSession & { user?: { images?: UserImage[] } }) | null;
  mainProfileImage: UserImage | null;
  getInitials: () => string;
  handleSignOut: () => void;
  profileIconSize: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative ${profileIconSize} rounded-full flex items-center justify-center text-sm shadow-md transition-all duration-300 cursor-pointer group overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 focus:ring-offset-white`}
        title={session.user?.name || "פרופיל"}
      >
        <div className="absolute inset-0 rounded-full transition-all duration-300 group-hover:ring-2 group-hover:ring-cyan-400"></div>
        {mainProfileImage ? (
          <Image
            src={mainProfileImage.url}
            alt={session.user?.name || "תמונת פרופיל"}
            fill
            className="object-cover rounded-full"
            sizes="(max-width: 768px) 40px, 40px"
          />
        ) : (
          <span className="font-semibold text-lg text-cyan-700 bg-cyan-100 w-full h-full flex items-center justify-center rounded-full">
            {getInitials()}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute mt-3 w-56 origin-top-left bg-white rounded-xl shadow-2xl z-20 border border-gray-100 ${
          typeof window !== 'undefined' && document.documentElement.dir === 'rtl' ? 'left-0' : 'right-0'
        }`}>
          <div className="p-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800 truncate">{session.user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/profile"
                className="flex items-center w-full text-right px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className="ml-2 h-4 w-4" />
                פרופיל אישי
              </Link>
              <Link
                href="/settings"
                className="flex items-center w-full text-right px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="ml-2 h-4 w-4" />
                הגדרות חשבון
              </Link>
            </div>
            <div className="py-1 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                className="w-full text-right flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="ml-2 h-4 w-4" />
                התנתקות
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// רכיב הלוגו נשאר כפי שביקשת
const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-x-2 group shrink-0" aria-label="Keystone Match Homepage">
      <div className="relative h-9 w-9">
        <Image
          src="/images/keystone-icon.png" 
          alt="Keystone Match Icon"
          fill 
          className="object-contain transition-transform duration-300 group-hover:scale-110" 
          priority
        />
      </div>
      <span className="text-xl font-bold text-gray-800 group-hover:text-cyan-600 transition-colors duration-300">
        Keystone Match
      </span>
    </Link>
  );
};

// רכיב ה-Navbar המעוצב
const Navbar = () => {
  const { data: session } = useSession() as {
    data: (NextAuthSession & { user?: { images?: UserImage[] } }) | null;
  };
  const pathname = usePathname();
  const isMatchmaker = session?.user?.role === "MATCHMAKER" || session?.user?.role === "ADMIN";
  const { notifications } = useNotifications();
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Set initial state
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    }
  }, [language]);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleSignOut = () => {
    setMobileMenuOpen(false);
    signOut({ callbackUrl: "/" });
  };

  const getInitials = () => {
    const fullName = session?.user?.name;
    if (!fullName) return "P";
    const names = fullName.split(" ");
    return (
      (names[0]?.[0] || "") + (names.length > 1 ? names[names.length - 1]?.[0] || "" : "")
    ).toUpperCase();
  };

  const getMainProfileImage = (): UserImage | null => {
    return session?.user?.images?.find((img) => img.isMain) || null;
  };
  const mainProfileImage = getMainProfileImage();

  // סגנונות דינמיים שמשתנים עם הגלילה כדי להתאים לדף הבית
  const navbarClasses = scrolled
    ? "bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80"
    : "bg-transparent border-b border-transparent";
  
  const profileIconSize = "w-10 h-10";

  return (
    <>
      <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${navbarClasses}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* צד ימין: לוגו וניווט ראשי */}
            <div className="flex items-center gap-4 md:gap-8">
              <Logo />
              <div className="hidden md:flex items-center gap-2 md:gap-3">
                {session && (
                  <>
                    {isMatchmaker ? (
                      <>
                        <NavItem href="/matchmaker/suggestions" text="הצעות שידוך" pathname={pathname} />
                        <NavItem href="/matchmaker/clients" text="מועמדים" pathname={pathname} />
                      </>
                    ) : (
                      <NavItem href="/matches" text="ההצעות שלי" pathname={pathname} />
                    )}
                    <NavItem
                      href="/messages"
                      text="הודעות"
                      badge={notifications.total > 0 ? notifications.total : undefined}
                      pathname={pathname}
                    />
                  </>
                )}
              </div>
            </div>

            {/* צד שמאל: כפתורי פעולה */}
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLanguage(language === "he" ? "en" : "he")}
                className="text-gray-600 hover:text-cyan-600 hover:bg-cyan-100/50 rounded-full"
                title={language === "he" ? "Switch to English" : "עבור לעברית"}
              >
                <Globe className="h-5 w-5" />
              </Button>

              {session && (
                <div className="hidden md:block">
                  <AvailabilityStatus />
                </div>
              )}

              {session ? (
                <UserDropdown
                  session={session}
                  mainProfileImage={mainProfileImage}
                  getInitials={getInitials}
                  handleSignOut={handleSignOut}
                  profileIconSize={profileIconSize}
                />
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/auth/signin">
                    <Button variant="ghost" className="text-gray-700 hover:text-cyan-600 hover:bg-cyan-50/70 rounded-full px-4">
                      התחברות
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 px-5 py-2.5">
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                      <span className="relative z-10 flex items-center">
                        <UserPlus className="ml-1.5 h-4 w-4" />
                        הרשמה
                      </span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* כפתור תפריט מובייל */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600 hover:text-cyan-600 hover:bg-cyan-100/50 rounded-full"
                onClick={toggleMobileMenu}
                aria-label="פתח תפריט"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* תפריט מובייל */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm md:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed top-0 ${
          language === "he" ? "right-0" : "left-0"
        } z-50 h-full w-4/5 max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden 
        ${mobileMenuOpen ? "translate-x-0" : (language === "he" ? "translate-x-full" : "-translate-x-full")}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <Logo />
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-gray-500 hover:text-gray-800 rounded-full" aria-label="סגור תפריט">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-4.5rem)] pb-20">
          {session && (
            <div className="p-4">
              <div className="flex items-center gap-4 p-3 border rounded-xl bg-gray-50">
                <div className={`relative ${profileIconSize} rounded-full flex items-center justify-center shadow-sm overflow-hidden`}>
                  {mainProfileImage ? (
                    <Image
                      src={mainProfileImage.url}
                      alt={session.user?.name || "תמונת פרופיל"}
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
                <div>
                  <div className="font-semibold text-gray-800 truncate">{session.user?.name}</div>
                  <div className="text-sm text-gray-500 truncate">{session.user?.email}</div>
                </div>
              </div>
            </div>
          )}
          <nav className="space-y-1.5 p-2">
            {session ? (
              <>
                {isMatchmaker ? (
                  <>
                    <MobileNavItem href="/matchmaker/suggestions" text="הצעות שידוך" icon={<Heart className="ml-2 h-5 w-5"/>} onClick={toggleMobileMenu} pathname={pathname} />
                    <MobileNavItem href="/matchmaker/clients" text="מועמדים" icon={<Users className="ml-2 h-5 w-5"/>} onClick={toggleMobileMenu} pathname={pathname} />
                  </>
                ) : (
                  <MobileNavItem href="/matches" text="ההצעות שלי" icon={<Users className="ml-2 h-5 w-5"/>} onClick={toggleMobileMenu} pathname={pathname} />
                )}
                <MobileNavItem href="/messages" text="הודעות" icon={<MessageCircle className="ml-2 h-5 w-5"/>} badge={notifications.total > 0 ? notifications.total : undefined} onClick={toggleMobileMenu} pathname={pathname} />
                <hr className="my-3"/>
                <MobileNavItem href="/profile" text="פרופיל אישי" icon={<User className="ml-2 h-5 w-5"/>} onClick={toggleMobileMenu} pathname={pathname} />
                <MobileNavItem href="/settings" text="הגדרות חשבון" icon={<Settings className="ml-2 h-5 w-5"/>} onClick={toggleMobileMenu} pathname={pathname} />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center text-right px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="ml-2 h-5 w-5" />
                  התנתקות
                </button>
              </>
            ) : (
              <>
                <MobileNavItem href="/auth/signin" text="התחברות" icon={<LogIn className="ml-2 h-5 w-5"/>} onClick={toggleMobileMenu} pathname={pathname} />
                <MobileNavItem href="/auth/register" text="הרשמה" icon={<UserPlus className="ml-2 h-5 w-5"/>} onClick={toggleMobileMenu} pathname={pathname} />
              </>
            )}
          </nav>
          
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <Button
              variant="outline"
              onClick={() => setLanguage(language === "he" ? "en" : "he")}
              className="w-full font-medium border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 flex items-center justify-center py-6 text-base"
            >
              <Globe className={`h-5 w-5 ${language === 'he' ? 'ml-2' : 'mr-2'}`} /> 
              {language === "he" ? "Switch to English" : "החלף לעברית"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// רכיב פריט ניווט, מותאם לעיצוב החדש
const NavItem = ({
  href,
  text,
  badge,
  pathname,
}: {
  href: string;
  text: string;
  badge?: number;
  pathname: string;
}) => {
  const isActive = pathname === href || (href === "/matchmaker/suggestions" && pathname.startsWith("/matchmaker"));

  return (
    <Link
      href={href}
      className={`relative px-3 py-2 rounded-full text-sm transition-colors duration-200
        ${isActive
          ? "font-semibold text-cyan-600 bg-cyan-500/10"
          : "font-medium text-gray-700 hover:text-cyan-600 hover:bg-cyan-500/10"
        }`}
    >
      {text}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[0.65rem] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">
          {badge}
        </span>
      )}
    </Link>
  );
};

// רכיב פריט ניווט למובייל, מותאם לעיצוב החדש
const MobileNavItem = ({
  href,
  text,
  icon,
  badge,
  onClick,
  pathname,
}: {
  href: string;
  text: string;
  icon?: React.ReactNode;
  badge?: number;
  onClick: () => void;
  pathname: string;
}) => {
  const isActive = pathname === href || (href === "/matchmaker/suggestions" && pathname.startsWith("/matchmaker"));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 group
        ${isActive
          ? "bg-cyan-100 text-cyan-800 shadow-inner"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
    >
      {icon && <span className={`transition-colors ${isActive ? "text-cyan-600" : "text-gray-500 group-hover:text-gray-700"}`}>{icon}</span>}
      <span className="flex-grow">{text}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
          {badge}
        </span>
      )}
    </Link>
  );
};

export default Navbar;