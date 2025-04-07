import React from "react";
import Link from "next/link";

// Helper component for footer links
export const FooterLink: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => (
  <li className="transition-transform hover:translate-x-1">
    <Link
      href={href}
      className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center"
    >
      <span className="ml-2">›</span>
      {children}
    </Link>
  </li>
);

// Helper component for footer items with icons
export const FooterItem: React.FC<{ icon: string; text: string }> = ({
  icon,
  text,
}) => (
  <li className="flex items-center transition-transform hover:translate-x-1">
    <span className="ml-2">{icon}</span>
    <span className="text-gray-300 hover:text-white transition-colors duration-300">
      {text}
    </span>
  </li>
);
