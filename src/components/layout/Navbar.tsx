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
  Home,
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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
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
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === "he" ? "en" : "he")}
      className="min-w-[2.5rem] font-medium border-2 border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-300"
    >
      {language === "he" ? "EN" : "עב"}
    </Button>
  );

  return (
    <>
      <nav
        className={`bg-white sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "shadow-md border-b border-blue-100"
            : "shadow-sm border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative overflow-hidden rounded-full p-1 transition-all duration-300 group-hover:scale-110">
                <Heart
                  className="h-7 w-7 text-blue-600 transition-all duration-300 group-hover:text-blue-700"
                  fill="#f0f9ff"
                />
              </div>
              <span className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-all duration-300">
                מערכת שידוכים
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 md:gap-2">
              <NavItem
                href="/"
                isActive={isActive("/")}
                icon={<Home className="ml-2 h-4 w-4" />}
                text="דף הבית"
              />

              {session && (
                <>
                  {isMatchmaker ? (
                    <>
                      <NavItem
                        href="/matchmaker/suggestions"
                        isActive={isActive("/matchmaker/suggestions")}
                        icon={<Heart className="ml-2 h-4 w-4" />}
                        text="הצעות שידוך"
                      />
                      <NavItem
                        href="/matchmaker/clients"
                        isActive={isActive("/matchmaker/clients")}
                        icon={<Users className="ml-2 h-4 w-4" />}
                        text="מועמדים"
                      />
                    </>
                  ) : (
                    <>
                      <NavItem
                        href="/matches"
                        isActive={isActive("/matches")}
                        icon={<Users className="ml-2 h-4 w-4" />}
                        text="ההצעות שלי"
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
                  />
                </>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <LanguageToggle />

              {/* Mobile Menu Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                className="p-1 md:hidden"
                onClick={toggleMobileMenu}
              >
                <Menu className="h-6 w-6 text-blue-600" />
              </Button>

              {session ? (
                <>
                  <div className="hidden md:block">
                    <AvailabilityStatus />
                  </div>
                  <div className="border-l border-gray-200 h-6 mx-1 md:mx-2 hidden md:block" />
                  <div className="hidden md:flex items-center gap-1 md:gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-semibold text-sm shadow-sm">
                      {getInitials()}
                    </div>
                    <NavItem
                      href="/profile"
                      isActive={isActive("/profile")}
                      icon={<User className="ml-2 h-4 w-4" />}
                      text="פרופיל אישי"
                    />
                    <NavItem
                      href="/settings"
                      isActive={isActive("/settings")}
                      icon={<Settings className="ml-2 h-4 w-4" />}
                      text="הגדרות חשבון"
                    />
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50 text-sm transition-colors duration-300"
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
                        variant="ghost"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-300"
                      >
                        <LogIn className="ml-2 h-4 w-4" />
                        <span>התחברות</span>
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button
                        variant="default"
                        className="whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm shadow-md hover:shadow-lg transition-all duration-300"
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={`fixed top-0 ${
          language === "he" ? "right-0" : "left-0"
        } z-50 h-full w-3/4 max-w-xs bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen
            ? "translate-x-0"
            : language === "he"
            ? "translate-x-full"
            : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-blue-100">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-blue-600" fill="#f0f9ff" />
            <span className="font-bold text-gray-800">מערכת שידוכים</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-blue-600 hover:bg-blue-50"
            onClick={toggleMobileMenu}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {session && (
            <div className="flex items-center gap-3 p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-semibold text-lg shadow-sm">
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
              <MobileNavItem
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                isActive={isActive("/")}
                icon={<Home className="ml-2 h-5 w-5" />}
                text="דף הבית"
              />

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
                      />
                      <MobileNavItem
                        href="/matchmaker/clients"
                        onClick={() => setMobileMenuOpen(false)}
                        isActive={isActive("/matchmaker/clients")}
                        icon={<Users className="ml-2 h-5 w-5" />}
                        text="מועמדים"
                      />
                    </>
                  ) : (
                    <MobileNavItem
                      href="/matches"
                      onClick={() => setMobileMenuOpen(false)}
                      isActive={isActive("/matches")}
                      icon={<Users className="ml-2 h-5 w-5" />}
                      text=""
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
                  />

                  <li className="pt-2 mt-2 border-t border-gray-100">
                    <MobileNavItem
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      isActive={isActive("/profile")}
                      icon={<User className="ml-2 h-5 w-5" />}
                      text="פרופיל אישי"
                    />
                  </li>
                  <MobileNavItem
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    isActive={isActive("/settings")}
                    icon={<Settings className="ml-2 h-5 w-5" />}
                    text="הגדרות חשבון"
                  />
                  <li>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-300"
                    >
                      <LogOut className="ml-2 h-5 w-5" />
                      התנתקות
                    </Button>
                  </li>
                </>
              ) : (
                <>
                  <li className="pt-2 mt-2 border-t border-gray-100">
                    <Link
                      href="/auth/signin"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-300"
                      >
                        <LogIn className="ml-2 h-5 w-5" />
                        התחברות
                      </Button>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant="default"
                        className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-300"
                      >
                        <UserPlus className="ml-2 h-5 w-5" />
                        הרשמה למערכת
                      </Button>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

// NavItem component for desktop navigation
const NavItem = ({
  href,
  isActive,
  icon,
  text,
  badge,
}: {
  href: string;
  isActive: boolean;
  icon: React.ReactNode;
  text: string;
  badge?: number;
}) => (
  <Link href={href}>
    <Button
      variant={isActive ? "default" : "ghost"}
      className={`text-sm transition-all duration-300 relative ${
        isActive
          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
          : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
      }`}
    >
      {icon}
      {text}
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
          {badge}
        </span>
      )}
    </Button>
  </Link>
);

// MobileNavItem component for mobile navigation
const MobileNavItem = ({
  href,
  onClick,
  isActive,
  icon,
  text,
  badge,
}: {
  href: string;
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  text: string;
  badge?: number;
}) => (
  <li>
    <Link href={href} onClick={onClick}>
      <Button
        variant={isActive ? "default" : "ghost"}
        className={`w-full justify-start transition-all duration-300 relative ${
          isActive
            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
            : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
        }`}
      >
        {icon}
        {text}
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
