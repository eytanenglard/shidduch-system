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
  User,
  LogOut,
  LogIn,
  UserPlus,
  Settings,
  Heart,
  Menu,
  X,
  Languages, // Icon for language
} from "lucide-react";
import type { Session as NextAuthSession } from "next-auth"; // Renamed to avoid conflict
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
        <div className="absolute left-0 mt-2 w-56 origin-top-left bg-white rounded-md shadow-xl z-20 border border-gray-100">
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
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleSignOut = () => {
    setMobileMenuOpen(false);
    signOut({ callbackUrl: "/" });
  };

  const getInitials = () => {
    const fullName = session?.user?.name;
    if (!fullName) return "P"; // Default placeholder
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
  const navbarScrolledClass = "bg-white/90 backdrop-blur-md shadow-md border-b border-gray-200";
  const navbarTopClass = "bg-cyan-50/80 backdrop-blur-sm border-b border-transparent"; // Example: slightly transparent cyan

  const profileIconSize = "w-9 h-9 md:w-10 md:h-10";

  return (
    <>
      <nav className={`${navbarBaseClass} ${scrolled ? navbarScrolledClass : navbarTopClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side (Logo & Main Nav for LTR, will be right for RTL) */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <Heart
                  className="h-7 w-7 text-pink-500 group-hover:text-pink-600 transition-colors"
                  fill={scrolled ? "#fff" : "#f0faff"} // Fill changes slightly if needed
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
              <div className="hidden md:flex items-center gap-2">
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
            <div className="flex items-center gap-3 md:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLanguage(language === "he" ? "en" : "he")}
                className="text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-full"
                title={language === "he" ? "Switch to English" : "עבור לעברית"}
              >
                <Languages className="h-5 w-5" />
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
                    <Button className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-md px-3 py-1.5 shadow-sm hover:shadow-md transition-all">
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
        />
      )}
      <div
        className={`fixed top-0 ${
          language === "he" ? "right-0" : "left-0" // Correct for RTL
        } z-50 h-full w-3/4 max-w-xs bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen
            ? "translate-x-0"
            : language === "he"
            ? "translate-x-full"
            : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <span className="font-semibold text-lg text-cyan-700">תפריט</span>
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-gray-500 hover:text-red-500">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto h-full pb-20 p-2">
          {session && (
            <div className="flex items-center gap-3 p-3 mb-3 border-b rounded-lg bg-cyan-50/50">
              <div className={`relative ${profileIconSize} rounded-full flex items-center justify-center text-lg shadow-sm overflow-hidden`}>
                {mainProfileImage ? (
                  <Image
                    src={mainProfileImage.url}
                    alt={session.user?.name || "תמונת פרופיל"}
                    fill
                    className="object-cover"
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
          <nav className="space-y-1">
            {session ? (
              <>
                {isMatchmaker ? (
                  <>
                    <MobileNavItem href="/matchmaker/suggestions" text="הצעות שידוך" onClick={toggleMobileMenu} pathname={pathname} />
                    <MobileNavItem href="/matchmaker/clients" text="מועמדים" onClick={toggleMobileMenu} pathname={pathname} />
                  </>
                ) : (
                  <MobileNavItem href="/matches" text="ההצעות שלי" onClick={toggleMobileMenu} pathname={pathname} />
                )}
                <MobileNavItem href="/messages" text="הודעות" badge={notifications.total > 0 ? notifications.total : undefined} onClick={toggleMobileMenu} pathname={pathname} />
                <hr className="my-2"/>
                <MobileNavItem href="/profile" text="פרופיל אישי" onClick={toggleMobileMenu} pathname={pathname} />
                <MobileNavItem href="/settings" text="הגדרות חשבון" onClick={toggleMobileMenu} pathname={pathname} />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center text-left px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  התנתקות
                </button>
              </>
            ) : (
              <>
                <MobileNavItem href="/auth/signin" text="התחברות" icon={<LogIn className="mr-2 h-4 w-4"/>} onClick={toggleMobileMenu} pathname={pathname} />
                <MobileNavItem href="/auth/register" text="הרשמה" icon={<UserPlus className="mr-2 h-4 w-4"/>} onClick={toggleMobileMenu} pathname={pathname} />
              </>
            )}
          </nav>
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
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${isActive ? "text-cyan-600 font-semibold" : "text-gray-600 hover:text-cyan-600 hover:bg-cyan-50/70"}`}
    >
      {text}
      {isActive && <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/3 h-0.5 bg-cyan-500 rounded-full"></span>}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-xs w-4.5 h-4.5 rounded-full flex items-center justify-center px-1">
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
  icon?: React.ReactNode; // Icon is now optional
  badge?: number;
  onClick: () => void;
  pathname: string;
}) => {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors
        ${isActive ? "bg-cyan-100 text-cyan-700 font-semibold" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {text}
      {badge !== undefined && badge > 0 && (
        <span className="mr-auto bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  );
};

export default Navbar;