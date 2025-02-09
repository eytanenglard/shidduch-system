"use client";


import { Bell } from "lucide-react";
import React, { useEffect, useState } from "react";
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
 ClipboardList,
} from "lucide-react";
import type { Session } from "next-auth";

interface NotificationCount {
 availabilityRequests: number;
 messages: number;
 total: number;
}

const Navbar = () => {
 const { data: session } = useSession() as { data: Session | null };
 const pathname = usePathname();
/*  const { notifications } = useNotifications(); */
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
   <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
     <div className="container mx-auto px-4">
       <div className="flex justify-between items-center h-16">
         <Link href="/" className="flex items-center space-x-2">
           <Heart className="h-6 w-6 text-indigo-600" />
           <span className="text-xl font-bold">מערכת שידוכים</span>
         </Link>

         <div className="flex items-center gap-2 md:gap-4">
           <Link href="/">
             <Button variant={isActive("/") ? "default" : "ghost"}>
               <Home className="ml-2 h-4 w-4" />
               דף הבית
             </Button>
           </Link>

           {session && (
             <>
               {isMatchmaker ? (
                 <>
                   <Link href="/matchmaker/dashboard">
                     <Button variant={isActive("/matchmaker/dashboard") ? "default" : "ghost"}>
                       <ClipboardList className="ml-2 h-4 w-4" />
                       לוח בקרה
                     </Button>
                   </Link>
                   <Link href="/matchmaker/suggestions">
                     <Button variant={isActive("/matchmaker/suggestions") ? "default" : "ghost"}>
                       <Heart className="ml-2 h-4 w-4" />
                       הצעות שידוך
                     </Button>
                   </Link>
                   <Link href="/matchmaker/clients">
                     <Button variant={isActive("/matchmaker/clients") ? "default" : "ghost"}>
                       <Users className="ml-2 h-4 w-4" />
                       מועמדים
                     </Button>
                   </Link>
                 </>
               ) : (
                 <>
                   <Link href="/matches">
                     <Button variant={isActive("/matches") ? "default" : "ghost"}>
                       <Users className="ml-2 h-4 w-4" />
                       שידוכים זמינים
                     </Button>
                   </Link>
                 </>
               )}

               <Link href="/messages">
                 <Button variant={isActive("/messages") ? "default" : "ghost"} className="relative">
                   <MessageCircle className="ml-2 h-4 w-4" />
                   הודעות
                  {/*  {notifications.total > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                       {notifications.total}
                     </span>
                   )} */}
                 </Button>
               </Link>
             </>
           )}
         </div>

         <div className="flex items-center gap-2">
           <LanguageToggle />

           {session ? (
             <>
               <AvailabilityStatus />
               <div className="border-l border-gray-200 h-6 mx-2" />
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                   {getInitials()}
                 </div>
                 <Link href="/profile">
                   <Button variant={isActive("/profile") ? "default" : "ghost"}>
                     <User className="ml-2 h-4 w-4" />
                     פרופיל אישי
                   </Button>
                 </Link>
                 <Link href="/settings">
                   <Button variant={isActive("/settings") ? "default" : "ghost"}>
                     <Settings className="ml-2 h-4 w-4" />
                     הגדרות חשבון
                   </Button>
                 </Link>
                 <Button
                   variant="ghost"
                   onClick={handleSignOut}
                   className="whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50"
                 >
                   <LogOut className="ml-2 h-4 w-4" />
                   התנתקות
                 </Button>
               </div>
             </>
           ) : (
             <>
               <Link href="/auth/signin">
                 <Button variant="ghost">
                   <LogIn className="ml-2 h-4 w-4" />
                   התחברות
                 </Button>
               </Link>
               <Link href="/auth/register">
                 <Button
                   variant="default"
                   className="whitespace-nowrap bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                 >
                   <UserPlus className="ml-2 h-4 w-4" />
                   הרשמה למערכת
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