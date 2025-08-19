import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { FooterLink, FooterItem } from '../components/FooterComponents';
const FooterSection: React.FC = () => {
const ref = useRef(null);
const isInView = useInView(ref, { once: true, amount: 0.1 });
// Animation variants
const containerVariants = {
hidden: { opacity: 0 },
visible: {
opacity: 1,
transition: {
staggerChildren: 0.1,
delayChildren: 0.2,
},
},
};
const fadeInUp = {
hidden: { opacity: 0, y: 30 },
visible: {
opacity: 1,
y: 0,
transition: { duration: 0.6, ease: 'easeOut' },
},
};
const logoVariants = {
hidden: { opacity: 0, scale: 0.8, y: 20 },
visible: {
opacity: 1,
scale: 1,
y: 0,
transition: {
duration: 0.6,
ease: 'easeOut',
scale: {
type: 'spring',
stiffness: 260,
damping: 20,
},
},
},
};
const socialIconsVariants = {
hidden: { opacity: 0 },
visible: {
opacity: 1,
transition: {
staggerChildren: 0.1,
delayChildren: 0.3,
},
},
};
const socialIconVariants = {
hidden: { opacity: 0, scale: 0 },
visible: {
opacity: 1,
scale: 1,
transition: {
duration: 0.4,
type: 'spring',
stiffness: 260,
damping: 15,
},
},
};
const columnVariants = {
hidden: { opacity: 0, y: 20 },
visible: {
opacity: 1,
y: 0,
transition: { duration: 0.6, ease: 'easeOut' },
},
};
const staggeredListVariants = {
hidden: { opacity: 0 },
visible: {
opacity: 1,
transition: {
staggerChildren: 0.05,
},
},
};
const listItemVariants = {
hidden: { opacity: 0, x: -10 },
visible: {
opacity: 1,
x: 0,
transition: { duration: 0.4, ease: 'easeOut' },
},
};
const bottomSectionVariants = {
hidden: { opacity: 0, y: 20 },
visible: {
opacity: 1,
y: 0,
transition: { duration: 0.6, ease: 'easeOut', delay: 0.5 },
},
};
return (
<motion.footer
ref={ref}
className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12 md:py-16 px-4 relative overflow-hidden"
variants={containerVariants}
initial="hidden"
animate={isInView ? 'visible' : 'hidden'}
>
{/* Enhanced background effects */}
<div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTEwIDEwaDIwdjIwSDEwVjEweiIvPjwvZz48L2c+PC9zdmc+')]"></div>

<div className="max-w-6xl mx-auto relative">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
      {/* Logo and Description Column */}
      <motion.div className="md:col-span-1" variants={logoVariants}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Link href="/" className="flex items-center gap-2 group mb-6">
            <div className="relative overflow-hidden rounded-full p-1 transition-all duration-300 group-hover:scale-110">
              <Heart
                className="h-7 w-7 text-cyan-400 transition-all duration-300 group-hover:text-cyan-300"
                fill="#1e293b"
              />
            </div>
            <span className="text-xl font-bold text-white group-hover:text-cyan-300 transition-all duration-300">
              NeshamaTech
            </span>
          </Link>
        </motion.div>

        <motion.p className="text-gray-400 mb-6" variants={fadeInUp}>
          משלבים טכנולוגיה מתקדמת וליווי אישי ליצירת קשרים משמעותיים ארוכי
          טווח.
        </motion.p>

        <motion.div
          className="flex space-x-4 rtl:space-x-reverse"
          variants={socialIconsVariants}
        >
          <motion.a
            href="https://www.facebook.com/profile.php?id=61577134204445"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-cyan-600/20 transition-colors duration-300"
            variants={socialIconVariants}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Facebook Page"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                clipRule="evenodd"
              ></path>
            </svg>
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Navigation Column */}
      <motion.div variants={columnVariants}>
        <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
          <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">
            ניווט מהיר
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/30 to-cyan-300/30" />
        </h3>
        <motion.ul
          className="space-y-3 md:space-y-4"
          variants={staggeredListVariants}
        >
          <motion.div variants={listItemVariants}>
            <FooterLink href="/">דף הבית</FooterLink>
          </motion.div>
          <motion.div variants={listItemVariants}>
            <FooterLink href="#our-method">השיטה שלנו</FooterLink>
          </motion.div>
          <motion.div variants={listItemVariants}>
            <FooterLink href="#how-it-works">איך זה עובד</FooterLink>
          </motion.div>
          <motion.div variants={listItemVariants}>
            <FooterLink href="#success-stories">סיפורי הצלחה</FooterLink>
          </motion.div>
          <motion.div variants={listItemVariants}>
            <FooterLink href="#faq">שאלות נפוצות</FooterLink>
          </motion.div>
        </motion.ul>
      </motion.div>

      {/* Information Column */}
      <motion.div variants={columnVariants}>
        <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
          <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">
            מידע שימושי
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/30 to-cyan-300/30" />
        </h3>
        <motion.ul
          className="space-y-3 md:space-y-4"
          variants={staggeredListVariants}
        >
          <motion.div variants={listItemVariants}>
            <FooterLink href="/privacy">מדיניות פרטיות</FooterLink>
          </motion.div>
          <motion.div variants={listItemVariants}>
            <FooterLink href="/terms">תנאי שימוש</FooterLink>
          </motion.div>
          <motion.div variants={listItemVariants}>
            <FooterLink href="#faq">מחירים (בתוך שאלות נפוצות)</FooterLink>
          </motion.div>
          <motion.div variants={listItemVariants}>
            <FooterLink href="/contact">יצירת קשר ותמיכה</FooterLink>
          </motion.div>
        </motion.ul>
      </motion.div>

      {/* Contact Column */}
      <motion.div variants={columnVariants}>
        <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
          <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">
            יצירת קשר
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/30 to-cyan-300/30" />
        </h3>
        <motion.ul
          className="space-y-3 md:space-y-4"
          variants={staggeredListVariants}
        >
          <motion.div variants={listItemVariants}>
            <FooterItem icon="📱" text="054-321-0040" />
          </motion.div>
          <motion.div variants={listItemVariants}>
            <FooterItem icon="✉️" text="info@neshamatech.com" />
          </motion.div>
          <motion.div variants={listItemVariants}>
            <FooterItem icon="📍" text="רעננה, ישראל" />
          </motion.div>
          <motion.div variants={listItemVariants}>
            <FooterItem icon="🕒" text="א'-ה' 9:00-18:00" />
          </motion.div>
        </motion.ul>
      </motion.div>
    </div>

    {/* Bottom Section */}
    <motion.div
      className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-700/50"
      variants={bottomSectionVariants}
    >
      <div className="text-center">
        <motion.div
          className="mb-4"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-cyan-400/10 text-cyan-400 hover:from-cyan-500/20 hover:to-cyan-400/20 transition-colors duration-300">
            זוגיות שמתחילה מהנשמה
          </span>
        </motion.div>
        <p className="text-gray-400">
          © כל הזכויות שמורות NeshamaTech 2025
        </p>
      </div>
    </motion.div>
  </div>
</motion.footer>
);
};
export default FooterSection;