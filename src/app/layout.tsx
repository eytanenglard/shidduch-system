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

  return (
    <html lang={defaultLanguage} dir={defaultLanguage === "he" ? "rtl" : "ltr"}>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          <LanguageProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
