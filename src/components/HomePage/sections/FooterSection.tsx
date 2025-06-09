import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { FooterLink, FooterItem } from "../components/FooterComponents";

const FooterSection: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12 md:py-16 px-4 relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTEwIDEwaDIwdjIwSDEwVjEweiIvPjwvZz48L2c+PC9zdmc+')]"></div>

      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group mb-6">
              <div className="relative overflow-hidden rounded-full p-1 transition-all duration-300 group-hover:scale-110">
                <Heart
                  className="h-7 w-7 text-cyan-400 transition-all duration-300 group-hover:text-cyan-300"
                  fill="#1e293b"
                />
              </div>
              <span className="text-xl font-bold text-white group-hover:text-cyan-300 transition-all duration-300">
                Match Point
              </span>
            </Link>

            <p className="text-gray-400 mb-6">
              משלבים טכנולוגיה מתקדמת וליווי אישי ליצירת קשרים משמעותיים ארוכי
              טווח.
            </p>

            <div className="flex space-x-4 rtl:space-x-reverse">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-cyan-600/20 transition-colors duration-300"
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
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-cyan-400/20 transition-colors duration-300"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gradient-to-br from-purple-600/20 to-pink-600/20 transition-colors duration-300"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">
                ניווט מהיר
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/30 to-cyan-300/30" />
            </h3>
            <ul className="space-y-3 md:space-y-4">
              <FooterLink href="/">דף הבית</FooterLink>
              <FooterLink href="/about">אודות</FooterLink>
              <FooterLink href="/faq">שאלות נפוצות</FooterLink>
              <FooterLink href="/matches">שידוכים זמינים</FooterLink>
              <FooterLink href="/success-stories">סיפורי הצלחה</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">
                מידע שימושי
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/30 to-cyan-300/30" />
            </h3>
            <ul className="space-y-3 md:space-y-4">
              <FooterLink href="/privacy">פרטיות</FooterLink>
              <FooterLink href="/terms">תנאי שימוש</FooterLink>
              <FooterLink href="/help">עזרה ותמיכה</FooterLink>
              <FooterLink href="/blog">בלוג</FooterLink>
              <FooterLink href="/pricing">תוכניות ומחירים</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-4 md:mb-6 relative">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">
                יצירת קשר
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/30 to-cyan-300/30" />
            </h3>
            <ul className="space-y-3 md:space-y-4">
              <FooterItem icon="📱" text="054-321-0040" />
              <FooterItem icon="✉️" text="jewish.matchpoint@gmail.com
" />
              <FooterItem icon="📍" text="רעננה" />
              <FooterItem icon="🕒" text="א'-ה' 9:00-18:00, ו' 9:00-13:00" />
            </ul>
          </div>
        </div>

        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-700/50">
          <div className="text-center">
            <div className="mb-4">
              <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-cyan-400/10 text-cyan-400 hover:from-cyan-500/20 hover:to-cyan-400/20 transition-colors duration-300">
                מחברים לבבות בדרך הנכונה
              </span>
            </div>
            <p className="text-gray-400">
              © כל הזכויות שמורות Match Point 2025
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
