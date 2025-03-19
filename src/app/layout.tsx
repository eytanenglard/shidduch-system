import { Inter } from "next/font/google";
import "./globals.css";
import { metadata as siteMetadata } from "./metadata";
import { cookies } from "next/headers";
import Providers from "@/components/Providers";
import Navbar from "@/components/layout/Navbar";
import { LanguageProvider } from "@/app/contexts/LanguageContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = siteMetadata;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultLanguage = cookieStore.get("language")?.value || "he";
  const isRTL = defaultLanguage === "he";

  return (
    <html
      lang={defaultLanguage}
      dir={isRTL ? "rtl" : "ltr"}
      className={isRTL ? "dir-rtl" : "dir-ltr"}
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <LanguageProvider>
            <div
              className={`min-h-screen flex flex-col ${
                isRTL ? "dir-rtl" : "dir-ltr"
              }`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <Navbar />
              <main className="flex-1 w-full">{children}</main>
            </div>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
