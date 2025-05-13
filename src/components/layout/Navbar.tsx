"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import type { Session } from "next-auth";

const Navbar = () => {
  const { data: session } = useSession() as { data: Session | null };
  const pathname = usePathname();
  const { notifications } = useNotifications();
  const isActive = (path: string) => pathname === path;
  const isMatchmaker = session?.user?.role === "MATCHMAKER";
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 300;
      const progress = Math.min(scrollPosition / scrollThreshold, 1);

      setScrollProgress(progress);
      setScrolled(scrollPosition > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = () => {
    setMobileMenuOpen(false);
    signOut({ callbackUrl: "/" });
  };

  const getInitials = () => {
    const fullName = session?.user?.name;
    if (!fullName) return "";

    const [firstName, lastName] = fullName.split(" ");
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  const LanguageToggle = () => (
    <Button
      variant="default"
      size="sm"
      onClick={() => setLanguage(language === "he" ? "en" : "he")}
      className={`min-w-[2.5rem] font-medium transition-all duration-300 rounded-xl ${gradientButtonStyle}`}
    >
      {language === "he" ? "EN" : "עב"}
    </Button>
  );

  const navbarStyle = {
    background: scrolled
      ? `rgba(255, 255, 255, ${scrollProgress * 0.9})`
      : `rgb(236, 254, 255)`,
    backdropFilter: `blur(${5 + scrollProgress * 10}px)`,
    borderBottom: scrolled
      ? "1px solid rgba(6, 182, 212, 0.2)"
      : "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: scrolled ? "0 4px 20px rgba(6, 182, 212, 0.1)" : "none",
  };

  const gradientButtonStyle = scrolled
    ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg rounded-xl"
    : "bg-gradient-to-r from-cyan-500/70 via-pink-500/30 to-cyan-500/70 hover:from-cyan-500/90 hover:via-pink-500/40 hover:to-cyan-500/90 text-white backdrop-filter backdrop-blur-sm shadow-md hover:shadow-lg rounded-xl";

  return (
    <>
      <nav
        className="sticky top-0 z-50 w-full transition-all duration-500"
        style={navbarStyle}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-pink-300 to-cyan-400 animate-gradient-x"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center gap-2 group relative z-10"
            >
              <div className="relative overflow-hidden rounded-full p-1 transition-all duration-500">
                <Heart
                  className="h-7 w-7 transition-all duration-500 text-pink-500"
                  fill="#f0faff"
                />
                <div className="absolute inset-0 rounded-full animate-ping-slow bg-gradient-to-r from-cyan-200/40 to-pink-200/40"></div>
              </div>
              <span
                className={`text-xl font-bold transition-all duration-500 
  text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500
  group-hover:from-cyan-600 group-hover:to-pink-600 group-hover:scale-105`}
              >
                Match Point
              </span>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/0 via-pink-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:via-pink-500/10 group-hover:to-cyan-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </Link>

            <div className="hidden md:flex items-center gap-1 md:gap-2">
              {session && (
                <>
                  {isMatchmaker ? (
                    <>
                      <NavItem
                        href="/matchmaker/suggestions"
                        isActive={isActive("/matchmaker/suggestions")}
                        icon={<Heart className="ml-2 h-4 w-4" />}
                        text="הצעות שידוך"
                        scrolled={scrolled}
                        gradientStyle={gradientButtonStyle}
                      />
                      <NavItem
                        href="/matchmaker/clients"
                        isActive={isActive("/matchmaker/clients")}
                        icon={<Users className="ml-2 h-4 w-4" />}
                        text="מועמדים"
                        scrolled={scrolled}
                        gradientStyle={gradientButtonStyle}
                      />
                    </>
                  ) : (
                    <>
                      <NavItem
                        href="/matches"
                        isActive={isActive("/matches")}
                        icon={<Users className="ml-2 h-4 w-4" />}
                        text="ההצעות שלי"
                        scrolled={scrolled}
                        gradientStyle={gradientButtonStyle}
                      />
                    </>
                  )}

                  <NavItem
                    href="/messages"
                    isActive={isActive("/messages")}
                    icon={<MessageCircle className="ml-2 h-4 w-4" />}
                    text="הודעות"
                    badge={
                      notifications.total > 0 ? notifications.total : undefined
                    }
                    scrolled={scrolled}
                    gradientStyle={gradientButtonStyle}
                  />
                </>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <LanguageToggle />

              <Button
                variant="ghost"
                size="sm"
                className={`p-1 md:hidden transition-colors duration-300 rounded-xl ${
                  scrolled
                    ? "text-cyan-600 hover:text-pink-500"
                    : "text-white hover:text-pink-200 hover:bg-white/10"
                }`}
                onClick={toggleMobileMenu}
              >
                <Menu className="h-6 w-6" />
              </Button>

              {session ? (
                <>
                  <div className="hidden md:block">
                    <AvailabilityStatus />
                  </div>
                  <div
                    className={`border-l h-6 mx-1 md:mx-2 hidden md:block ${
                      scrolled ? "border-gray-200" : "border-white/20"
                    }`}
                  />
                  <div className="hidden md:flex items-center gap-1 md:gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm transition-all duration-300 ${
                        scrolled
                          ? "bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-700 font-semibold"
                          : "bg-gradient-to-br from-white/10 to-pink-300/10 text-white backdrop-filter backdrop-blur-sm"
                      }`}
                    >
                      {getInitials()}
                    </div>
                    <NavItem
                      href="/profile"
                      isActive={isActive("/profile")}
                      icon={<User className="ml-2 h-4 w-4" />}
                      text="פרופיל אישי"
                      scrolled={scrolled}
                      gradientStyle={gradientButtonStyle}
                    />
                    <NavItem
                      href="/settings"
                      isActive={isActive("/settings")}
                      icon={<Settings className="ml-2 h-4 w-4" />}
                      text="הגדרות חשבון"
                      scrolled={scrolled}
                      gradientStyle={gradientButtonStyle}
                    />
                    <Button
                      variant="default"
                      onClick={handleSignOut}
                      className={`whitespace-nowrap text-sm transition-all duration-300 ${gradientButtonStyle}`}
                    >
                      <LogOut className="ml-2 h-4 w-4" />
                      <span>התנתקות</span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="hidden md:flex items-center gap-2">
                    <Link href="/auth/signin">
                      <Button
                        variant="default"
                        className={`text-sm transition-all duration-300 ${gradientButtonStyle}`}
                      >
                        <LogIn className="ml-2 h-4 w-4" />
                        <span>התחברות</span>
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button
                        variant="default"
                        className={`whitespace-nowrap text-sm transition-all duration-300 ${gradientButtonStyle}`}
                      >
                        <UserPlus className="ml-2 h-4 w-4" />
                        <span>הרשמה למערכת</span>
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gradient-to-br from-cyan-900/30 via-gray-900/50 to-pink-900/30 z-50 backdrop-blur-md transition-opacity duration-300"
          onClick={toggleMobileMenu}
        />
      )}

      <div
        className={`fixed top-0 ${
          language === "he" ? "right-0" : "left-0"
        } z-50 h-full w-3/4 max-w-xs bg-gradient-to-br from-white to-cyan-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen
            ? "translate-x-0"
            : language === "he"
            ? "translate-x-full"
            : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-white">
          <div className="relative">
            <Heart className="h-6 w-6 text-pink-500" fill="#f0faff" />
            <div className="absolute inset-0 rounded-full animate-ping-slow bg-gradient-to-r from-cyan-200/40 to-pink-200/40"></div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-cyan-600 hover:text-pink-500 hover:bg-cyan-50"
            onClick={toggleMobileMenu}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {session && (
            <div className="flex items-center gap-3 p-4 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-white">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-100 to-pink-100 flex items-center justify-center text-cyan-700 font-semibold text-lg shadow-sm">
                {getInitials()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {session.user?.name}
                </div>
                <div className="text-sm text-gray-500">
                  {session.user?.email}
                </div>
              </div>
            </div>
          )}

          <nav className="p-2">
            <ul className="space-y-1">
              {session ? (
                <>
                  {isMatchmaker ? (
                    <>
                      <MobileNavItem
                        href="/matchmaker/suggestions"
                        onClick={() => setMobileMenuOpen(false)}
                        isActive={isActive("/matchmaker/suggestions")}
                        icon={<Heart className="ml-2 h-5 w-5" />}
                        text="הצעות שידוך"
                        gradientStyle="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-700 hover:via-blue-700 hover:to-cyan-700 rounded-xl"
                      />
                      <MobileNavItem
                        href="/matchmaker/clients"
                        onClick={() => setMobileMenuOpen(false)}
                        isActive={isActive("/matchmaker/clients")}
                        icon={<Users className="ml-2 h-5 w-5" />}
                        text="מועמדים"
                        gradientStyle="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-700 hover:via-blue-700 hover:to-cyan-700"
                      />
                    </>
                  ) : (
                    <MobileNavItem
                      href="/matches"
                      onClick={() => setMobileMenuOpen(false)}
                      isActive={isActive("/matches")}
                      icon={<Users className="ml-2 h-5 w-5" />}
                      text="ההצעות שלי"
                      gradientStyle="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-700 hover:via-blue-700 hover:to-cyan-700"
                    />
                  )}

                  <MobileNavItem
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    isActive={isActive("/messages")}
                    icon={<MessageCircle className="ml-2 h-5 w-5" />}
                    text="הודעות"
                    badge={
                      notifications.total > 0 ? notifications.total : undefined
                    }
                    gradientStyle="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-700 hover:via-blue-700 hover:to-cyan-700"
                  />
                  {/* הוספנו קו הפרדה רק אם הפריטים הבאים קיימים */}
                  <li className="pt-2 mt-2 border-t border-gray-100" />

                  <MobileNavItem
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    isActive={isActive("/profile")}
                    icon={<User className="ml-2 h-5 w-5" />}
                    text="פרופיל אישי"
                    gradientStyle="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-700 hover:via-blue-700 hover:to-cyan-700"
                  />
                  <MobileNavItem
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    isActive={isActive("/settings")}
                    icon={<Settings className="ml-2 h-5 w-5" />}
                    text="הגדרות חשבון"
                    gradientStyle="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-700 hover:via-blue-700 hover:to-cyan-700"
                  />
                  {/* כפתור ההתנתקות עכשיו עטוף ב-MobileNavItem */}
                  <MobileNavItem
                    href="#" // ניתן להשאיר # או להסיר את ה-href אם ה-onClick מטפל בניווט
                    onClick={handleSignOut}
                    isActive={false} // כפתור התנתקות לא פעיל במובן של נתיב
                    icon={<LogOut className="ml-2 h-5 w-5" />}
                    text="התנתקות"
                    gradientStyle="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-700 hover:via-blue-700 hover:to-cyan-700 rounded-xl"
                  />
                </>
              ) : (
                <>
                  {/* הוספנו קו הפרדה רק אם הפריטים הבאים קיימים */}
                  <li className="pt-2 mt-2 border-t border-gray-100" />
                  {/* כפתורי התחברות והרשמה עכשיו משתמשים ב-MobileNavItem */}
                  <MobileNavItem
                    href="/auth/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    isActive={isActive("/auth/signin")}
                    icon={<LogIn className="ml-2 h-5 w-5" />}
                    text="התחברות"
                    gradientStyle="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-700 hover:via-blue-700 hover:to-cyan-700"
                  />
                  <MobileNavItem
                    href="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                    isActive={isActive("/auth/register")}
                    icon={<UserPlus className="ml-2 h-5 w-5" />}
                    text="הרשמה למערכת"
                    gradientStyle="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-700 hover:via-blue-700 hover:to-cyan-700"
                  />
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

const NavItem = ({
  href,
  icon,
  text,
  badge,
  gradientStyle,
}: {
  href: string;
  isActive: boolean;
  icon: React.ReactNode;
  text: string;
  badge?: number;
  scrolled: boolean;
  gradientStyle: string;
}) => (
  <Link href={href}>
    <Button
      variant="default"
      className={`text-sm transition-all duration-300 relative group overflow-hidden ${gradientStyle}`}
    >
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
      <span className="relative z-10 flex items-center">
        {icon}
        {text}
      </span>
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
          {badge}
        </span>
      )}
    </Button>
  </Link>
);

const MobileNavItem = ({
  href,
  onClick,
  isActive, // הוספנו isActive כדי שנוכל להשתמש בו אם נרצה בעתיד
  icon,
  text,
  badge,
  gradientStyle,
}: {
  href: string;
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  text: string;
  badge?: number;
  gradientStyle: string;
}) => (
  <li>
    <Link href={href} onClick={onClick} passHref>
      {" "}
      {/* הוספנו passHref */}
      <Button
        variant="default"
        // className={`w-full justify-start transition-all duration-300 relative overflow-hidden group text-white shadow-md ${gradientStyle} ${isActive ? "ring-2 ring-pink-300" : ""}`}
        // ה-styling של הכפתור נלקח ישירות מה-gradientStyle שהועבר. אין צורך להוסיף כאן class נוסף אם הוא כבר מוגדר ב-gradientStyle
        className={`w-full justify-start transition-all duration-300 relative overflow-hidden group text-white shadow-md ${gradientStyle}`}
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
        <span className="relative z-10 flex items-center">
          {icon}
          {text}
        </span>
        {badge !== undefined && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {badge}
          </span>
        )}
      </Button>
    </Link>
  </li>
);

export default Navbar;
