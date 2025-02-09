"use client";

import { useSession } from "next-auth/react";
import AccountSettings from "@/components/account-settings";

export default function SettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Access Denied</div>;
  if (!session?.user) return <div>Error: No user data</div>;

  const userData = {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    role: session.user.role,
    status: session.user.status,
    isVerified: session.user.isVerified,
    lastLogin: session.user.lastLogin,
    createdAt: session.user.createdAt,
  };

  return <AccountSettings user={userData} />;
}
