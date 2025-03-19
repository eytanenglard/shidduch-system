"use client";

import React, { useState } from "react";
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
      className="min-w-[2.5rem] font-medium"
    >
      {language === "he" ? "EN" : "עב"}
    </Button>
  );

  return (
    <>
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold">מערכת שידוכים</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 md:gap-2">
              <Link href="/">
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  className="text-sm"
                >
                  <Home className="ml-2 h-4 w-4" />
                  דף הבית
                </Button>
              </Link>

              {session && (
                <>
                  {isMatchmaker ? (
                    <>
                      <Link href="/matchmaker/suggestions">
                        <Button
                          variant={
                            isActive("/matchmaker/suggestions")
                              ? "default"
                              : "ghost"
                          }
                          className="text-sm"
                        >
                          <Heart className="ml-2 h-4 w-4" />
                          הצעות שידוך
                        </Button>
                      </Link>
                      <Link href="/matchmaker/clients">
                        <Button
                          variant={
                            isActive("/matchmaker/clients")
                              ? "default"
                              : "ghost"
                          }
                          className="text-sm"
                        >
                          <Users className="ml-2 h-4 w-4" />
                          מועמדים
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/matches">
                        <Button
                          variant={isActive("/matches") ? "default" : "ghost"}
                          className="text-sm"
                        >
                          <Users className="ml-2 h-4 w-4" />
                          שידוכים זמינים
                        </Button>
                      </Link>
                    </>
                  )}

                  <Link href="/messages">
                    <Button
                      variant={isActive("/messages") ? "default" : "ghost"}
                      className="relative text-sm"
                    >
                      <MessageCircle className="ml-2 h-4 w-4" />
                      הודעות
                      {notifications.total > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {notifications.total}
                        </span>
                      )}
                    </Button>
                  </Link>
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
                <Menu className="h-6 w-6" />
              </Button>

              {session ? (
                <>
                  <div className="hidden md:block">
                    <AvailabilityStatus />
                  </div>
                  <div className="border-l border-gray-200 h-6 mx-1 md:mx-2 hidden md:block" />
                  <div className="hidden md:flex items-center gap-1 md:gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                      {getInitials()}
                    </div>
                    <Link href="/profile">
                      <Button
                        variant={isActive("/profile") ? "default" : "ghost"}
                        className="text-sm"
                      >
                        <User className="ml-2 h-4 w-4" />
                        פרופיל אישי
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button
                        variant={isActive("/settings") ? "default" : "ghost"}
                        className="text-sm"
                      >
                        <Settings className="ml-2 h-4 w-4" />
                        הגדרות חשבון
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
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
                      <Button variant="ghost" className="text-sm">
                        <LogIn className="ml-2 h-4 w-4" />
                        <span>התחברות</span>
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button
                        variant="default"
                        className="whitespace-nowrap bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-sm"
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
          className="fixed inset-0 bg-black/50 z-50"
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
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-indigo-600" />
            <span className="font-bold">מערכת שידוכים</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={toggleMobileMenu}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {session && (
            <div className="flex items-center gap-3 p-4 border-b">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
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
              <li>
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive("/") ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Home className="ml-2 h-5 w-5" />
                    דף הבית
                  </Button>
                </Link>
              </li>

              {session ? (
                <>
                  {isMatchmaker ? (
                    <>
                      <li>
                        <Link
                          href="/matchmaker/suggestions"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button
                            variant={
                              isActive("/matchmaker/suggestions")
                                ? "default"
                                : "ghost"
                            }
                            className="w-full justify-start"
                          >
                            <Heart className="ml-2 h-5 w-5" />
                            הצעות שידוך
                          </Button>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/matchmaker/clients"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button
                            variant={
                              isActive("/matchmaker/clients")
                                ? "default"
                                : "ghost"
                            }
                            className="w-full justify-start"
                          >
                            <Users className="ml-2 h-5 w-5" />
                            מועמדים
                          </Button>
                        </Link>
                      </li>
                    </>
                  ) : (
                    <li>
                      <Link
                        href="/matches"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant={isActive("/matches") ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          <Users className="ml-2 h-5 w-5" />
                          שידוכים זמינים
                        </Button>
                      </Link>
                    </li>
                  )}

                  <li>
                    <Link
                      href="/messages"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant={isActive("/messages") ? "default" : "ghost"}
                        className="w-full justify-start relative"
                      >
                        <MessageCircle className="ml-2 h-5 w-5" />
                        הודעות
                        {notifications.total > 0 && (
                          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {notifications.total}
                          </span>
                        )}
                      </Button>
                    </Link>
                  </li>

                  <li className="pt-2 mt-2 border-t">
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant={isActive("/profile") ? "default" : "ghost"}
                        className="w-full justify-start"
                      >
                        <User className="ml-2 h-5 w-5" />
                        פרופיל אישי
                      </Button>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant={isActive("/settings") ? "default" : "ghost"}
                        className="w-full justify-start"
                      >
                        <Settings className="ml-2 h-5 w-5" />
                        הגדרות חשבון
                      </Button>
                    </Link>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="ml-2 h-5 w-5" />
                      התנתקות
                    </Button>
                  </li>
                </>
              ) : (
                <>
                  <li className="pt-2 mt-2 border-t">
                    <Link
                      href="/auth/signin"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="ghost" className="w-full justify-start">
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
                        className="w-full justify-start bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
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

export default Navbar;
