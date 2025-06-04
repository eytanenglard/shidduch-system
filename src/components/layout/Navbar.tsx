"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import AvailabilityStatus from "@/components/AvailabilityStatus";
import { useLanguage } from "@/app/contexts/LanguageContext"; // ודא שהנתיב נכון
import { useNotifications } from "@/app/contexts/NotificationContext"; // ודא שהנתיב נכון
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
  // ChevronDown, // לא בשימוש כרגע אם אין dropdown ייעודי לשפה
} from "lucide-react";
import type { Session as NextAuthSession } from "next-auth";
import type { UserImage } from "@/types/next-auth";

// User Dropdown Menu Component
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
        className={`relative ${profileIconSize} rounded-full flex items-center justify-center text-sm shadow-md transition-all duration-300 cursor-pointer group overflow-hidden hover:ring-2 hover:ring-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400`}
        title={session.user?.name || "פרופיל"}
      >
        {mainProfileImage ? (
          <Image
            src={mainProfileImage.url}
            alt={session.user?.name || "תמונת פרופיל"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 40px, 40px"
          />
        ) : (
          <span className="font-semibold text-base text-cyan-700 bg-cyan-100 w-full h-full flex items-center justify-center">
            {getInitials()}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute mt-2 w-56 origin-top-left bg-white rounded-md shadow-xl z-20 border border-gray-100 ${
          // Adjust position for RTL language toggle if needed, though dropdown is usually LTR content-wise
          // Assuming language context is not directly affecting dropdown positioning here
          typeof window !== 'undefined' && document.documentElement.dir === 'rtl' ? 'left-0' : 'right-0'
        }`}>
          <div className="py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800 truncate">{session.user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
            </div>
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
              onClick={() => setIsOpen(false)}
            >
              <User className="mr-2 h-4 w-4" />
              פרופיל אישי
            </Link>
            <Link
              href="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="mr-2 h-4 w-4" />
              הגדרות חשבון
            </Link>
            <button
              onClick={() => {
                setIsOpen(false);
                handleSignOut();
              }}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              התנתקות
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


const Navbar = () => {
  const { data: session } = useSession() as {
    data: (NextAuthSession & { user?: { images?: UserImage[] } }) | null;
  };
  const pathname = usePathname();
  const isMatchmaker = session?.user?.role === "MATCHMAKER" || session?.user?.role === "ADMIN";
  const { notifications } = useNotifications();
  const { language, setLanguage } = useLanguage(); // מנהל את השפה הנוכחית ואת הפונקציה להחלפתה
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update HTML lang and dir attributes when language changes
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

  const navbarBaseClass = "sticky top-0 z-50 w-full transition-colors duration-300";
  const navbarScrolledClass = "bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200"; // מעט יותר אטום בגלילה
  const navbarTopClass = "bg-cyan-50/70 backdrop-blur-md border-b border-transparent";

  const profileIconSize = "w-9 h-9 md:w-10 md:h-10";

  return (
    <>
      <nav className={`${navbarBaseClass} ${scrolled ? navbarScrolledClass : navbarTopClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side (Logo & Main Nav for LTR, will be right for RTL) */}
            <div className="flex items-center gap-4 md:gap-6"> {/* הגדלת מרווח */}
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <Heart
                  className="h-7 w-7 text-pink-500 group-hover:text-pink-600 transition-colors"
                  fill={scrolled ? "#fff" : "#f0faff"}
                />
                <span
                  className={`text-xl font-bold 
                    text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600
                    group-hover:from-cyan-700 group-hover:to-pink-700 transition-all`}
                >
                  Match Point
                </span>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center gap-1 md:gap-2"> {/* הקטנת מרווח בין פריטי ניווט */}
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

            {/* Right Side (Actions & User for LTR, will be left for RTL) */}
            <div className="flex items-center gap-2 md:gap-3"> {/* הקטנת מרווח */}
              <Button
                variant="outline" // שינוי ל-outline שיראה טוב יותר
                size="sm" // גודל קטן יותר
                onClick={() => setLanguage(language === "he" ? "en" : "he")}
                className={`font-medium transition-colors duration-300 rounded-md px-3 py-1.5 min-w-[3rem]
                  ${scrolled 
                    ? "border-cyan-500 text-cyan-600 hover:bg-cyan-50" 
                    : "border-cyan-600/70 text-cyan-700 hover:bg-cyan-500/10"
                  }`}
                title={language === "he" ? "Switch to English" : "עבור לעברית"}
              >
                {language === "he" ? "EN" : "עב"}
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
                    <Button variant="ghost" className="text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 rounded-md px-3 py-1.5">
                      <LogIn className="mr-1.5 h-4 w-4" />
                      התחברות
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-md px-3 py-1.5 text-sm shadow-sm hover:shadow-md transition-all">
                      <UserPlus className="mr-1.5 h-4 w-4" />
                      הרשמה
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-full"
                onClick={toggleMobileMenu}
                aria-label="פתח תפריט"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay & Panel */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm md:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed top-0 ${
          language === "he" ? "right-0" : "left-0"
        } z-50 h-full w-3/4 max-w-xs bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden 
        ${mobileMenuOpen ? "translate-x-0" : (language === "he" ? "translate-x-full" : "-translate-x-full")}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <Link href="/" className="flex items-center gap-2 group" onClick={toggleMobileMenu}>
            <Heart className="h-6 w-6 text-pink-500" fill="#f0faff" />
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
              Match Point
            </span>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-gray-500 hover:text-red-500" aria-label="סגור תפריט">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-4.5rem)]"> {/* Adjust height for header */}
          {session && (
            <div className="flex items-center gap-3 p-3 my-2 mx-2 border rounded-lg bg-cyan-50/30">
              <div className={`relative ${profileIconSize} rounded-full flex items-center justify-center text-lg shadow-sm overflow-hidden`}>
                {mainProfileImage ? (
                  <Image
                    src={mainProfileImage.url}
                    alt={session.user?.name || "תמונת פרופיל"}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <span className="font-semibold text-cyan-700 bg-cyan-100 w-full h-full flex items-center justify-center">
                    {getInitials()}
                  </span>
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-800 truncate">{session.user?.name}</div>
                <div className="text-xs text-gray-500 truncate">{session.user?.email}</div>
              </div>
            </div>
          )}
          <nav className="space-y-1 p-2">
            {session ? (
              <>
                {isMatchmaker ? (
                  <>
                    <MobileNavItem href="/matchmaker/suggestions" text="הצעות שידוך" icon={<Heart className="mr-2 h-5 w-5 text-pink-500"/>} onClick={toggleMobileMenu} pathname={pathname} />
                    <MobileNavItem href="/matchmaker/clients" text="מועמדים" icon={<Users className="mr-2 h-5 w-5 text-cyan-600"/>} onClick={toggleMobileMenu} pathname={pathname} />
                  </>
                ) : (
                  <MobileNavItem href="/matches" text="ההצעות שלי" icon={<Users className="mr-2 h-5 w-5 text-cyan-600"/>} onClick={toggleMobileMenu} pathname={pathname} />
                )}
                <MobileNavItem href="/messages" text="הודעות" icon={<MessageCircle className="mr-2 h-5 w-5 text-green-500"/>} badge={notifications.total > 0 ? notifications.total : undefined} onClick={toggleMobileMenu} pathname={pathname} />
                <hr className="my-2"/>
                <MobileNavItem href="/profile" text="פרופיל אישי" icon={<User className="mr-2 h-5 w-5 text-gray-600"/>} onClick={toggleMobileMenu} pathname={pathname} />
                <MobileNavItem href="/settings" text="הגדרות חשבון" icon={<Settings className="mr-2 h-5 w-5 text-gray-600"/>} onClick={toggleMobileMenu} pathname={pathname} />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center text-left px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  התנתקות
                </button>
              </>
            ) : (
              <>
                <MobileNavItem href="/auth/signin" text="התחברות" icon={<LogIn className="mr-2 h-5 w-5"/>} onClick={toggleMobileMenu} pathname={pathname} />
                <MobileNavItem href="/auth/register" text="הרשמה" icon={<UserPlus className="mr-2 h-5 w-5"/>} onClick={toggleMobileMenu} pathname={pathname} />
              </>
            )}
          </nav>
           {/* כפתור שפה בתחתית תפריט המובייל */}
           <div className="absolute bottom-4 left-0 right-0 px-4">
            <Button
              variant="outline"
              size="lg" // כפתור גדול יותר ונגיש
              onClick={() => {
                setLanguage(language === "he" ? "en" : "he");
                // setMobileMenuOpen(false); // אפשר לסגור את התפריט אחרי החלפת שפה
              }}
              className="w-full font-medium border-cyan-500 text-cyan-600 hover:bg-cyan-50"
            >
              {language === "he" ? "Switch to English" : "החלף לעברית"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

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
  const isActive = pathname === href || (href === "/matchmaker/suggestions" && pathname.startsWith("/matchmaker")); // Highlight "הצעות" if in any matchmaker sub-route

  return (
    <Link
      href={href}
      className={`relative px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-200
        ${isActive ? "text-cyan-600" : "text-gray-600 hover:text-cyan-600 hover:bg-cyan-50/60"}`}
    >
      {text}
      {isActive && <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-2/3 h-[2px] bg-cyan-500 rounded-t-full"></span>}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-[0.65rem] w-4 h-4 rounded-full flex items-center justify-center font-bold">
          {badge}
        </span>
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
      className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors duration-150 group
        ${isActive ? "bg-cyan-100 text-cyan-700 shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
    >
      {icon && <span className={`mr-3 ${isActive ? "text-cyan-600" : "text-gray-500 group-hover:text-gray-700"}`}>{icon}</span>}
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