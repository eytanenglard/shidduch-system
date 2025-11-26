
import React from "react";
import Link from "next/link";

// Helper component for footer links
export const FooterLink: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => (
  <li className="transition-transform duration-300 hover:translate-x-1">
    <Link
      href={href}
      className="text-gray-400 hover:text-teal-400 transition-colors duration-300 flex items-center group"
    >
      <span className="ml-2 text-teal-600/0 group-hover:text-teal-500 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">›</span>
      {children}
    </Link>
  </li>
);

// Helper component for footer items with icons
export const FooterItem: React.FC<{ icon: string; text: string }> = ({
  icon,
  text,
}) => (
  <li className="flex items-center group transition-transform duration-300 hover:translate-x-1">
    <span className="ml-2 text-teal-500/70 group-hover:text-orange-400 transition-colors duration-300">{icon}</span>
    <span className="text-gray-400 hover:text-white transition-colors duration-300">
      {text}
    </span>
  </li>
);