// src/components/layout/BottomNavBar.tsx
//
// Bottom navigation bar — shown only on mobile for CANDIDATE users.
// Solves the discoverability problem where users couldn't find Suggestions,
// Messages, and Questionnaire because the hamburger menu was hidden.

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Lightbulb, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/app/[locale]/contexts/NotificationContext';
import type { Dictionary } from '@/types/dictionary';

interface BottomNavBarProps {
  dict: Dictionary;
}

export default function BottomNavBar({ dict }: BottomNavBarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { notifications } = useNotifications();

  const locale = pathname.split('/')[1] || 'he';

  // Only render for authenticated candidates
  if (!session?.user) return null;
  const isMatchmaker =
    (session.user as { role?: string }).role === 'MATCHMAKER' ||
    (session.user as { role?: string }).role === 'ADMIN';
  if (isMatchmaker) return null;

  const items = [
    {
      href: `/${locale}/profile`,
      label: dict.userDropdown.myProfile,
      icon: User,
      badge: 0,
    },
    {
      href: `/${locale}/matches`,
      label: dict.navbar.myMatches,
      icon: Heart,
      // action-required items (pending suggestions waiting for response)
      badge: notifications.availabilityRequests,
    },
    {
      href: `/${locale}/messages`,
      label: dict.navbar.messages,
      icon: MessageCircle,
      badge: notifications.messages,
    },
    {
      href: `/${locale}/questionnaire`,
      label: dict.navbar.matchmakingQuestionnaire,
      icon: Lightbulb,
      badge: 0,
    },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-16">
        {items.map((item) => {
          const fullHref = item.href;
          const isActive =
            pathname === fullHref ||
            (fullHref !== `/${locale}` && pathname.startsWith(fullHref));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 relative touch-manipulation transition-colors duration-150 active:scale-[0.95]',
                isActive ? 'text-teal-600' : 'text-gray-400'
              )}
            >
              {/* active indicator line at top */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 w-8 h-0.5 bg-teal-500 rounded-full"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </AnimatePresence>

              {/* icon + badge */}
              <div className="relative">
                <Icon
                  className={cn(
                    'h-[22px] w-[22px] transition-all duration-150',
                    isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'
                  )}
                />
                {item.badge > 0 && (
                  <motion.span
                    key={item.badge}
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white leading-none"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </motion.span>
                )}
              </div>

              {/* label */}
              <span
                className={cn(
                  'text-[10px] leading-none transition-all duration-150',
                  isActive ? 'font-semibold text-teal-600' : 'font-medium'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
