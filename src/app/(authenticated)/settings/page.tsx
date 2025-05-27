// --- START OF FILE page.tsx ---

"use client";

import { useSession } from "next-auth/react";
import AccountSettings from "@/components/account-settings";

export default function SettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Access Denied</div>;
  // It's good practice to check session?.user as well, though useSession types often guarantee it if status is "authenticated"
  if (!session?.user) return <div>Error: No user data or session invalid</div>;

  const userData = {
    id: session.user.id,
    email: session.user.email, // Assuming email is always present and a string
    firstName: session.user.firstName, // Assuming firstName is always present and a string
    lastName: session.user.lastName, // Assuming lastName is always present and a string
    role: session.user.role,
    status: session.user.status,
    isVerified: session.user.isVerified,
    lastLogin: session.user.lastLogin ?? null, // Fix: Convert undefined to null
    createdAt: session.user.createdAt,
  };

  return <AccountSettings user={userData} />;
}
// --- END OF FILE page.tsx ---