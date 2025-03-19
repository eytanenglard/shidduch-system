"use client";

import React from "react";
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
} from "lucide-react";
import type { Session } from "next-auth";

const Navbar = () => {
  const { data: session } = useSession() as { data: Session | null };
  const pathname = usePathname();
  const { notifications } = useNotifications();
  const isActive = (path: string) => pathname === path;
  const isMatchmaker = session?.user?.role === "MATCHMAKER";
  const { language, setLanguage } = useLanguage();

  const handleSignOut = () => {
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
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold">מערכת שידוכים</span>
          </Link>

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
                          isActive("/matchmaker/clients") ? "default" : "ghost"
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

            {session ? (
              <>
                <AvailabilityStatus />
                <div className="border-l border-gray-200 h-6 mx-1 md:mx-2 hidden md:block" />
                <div className="flex items-center gap-1 md:gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                    {getInitials()}
                  </div>
                  <div className="hidden md:flex items-center gap-1 md:gap-2">
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
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
                  >
                    <LogOut className="ml-2 h-4 w-4" />
                    <span className="hidden md:inline">התנתקות</span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-sm">
                    <LogIn className="ml-2 h-4 w-4" />
                    <span className="hidden md:inline">התחברות</span>
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    variant="default"
                    className="whitespace-nowrap bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-sm"
                  >
                    <UserPlus className="ml-2 h-4 w-4" />
                    <span className="hidden md:inline">הרשמה למערכת</span>
                    <span className="md:hidden">הרשמה</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
