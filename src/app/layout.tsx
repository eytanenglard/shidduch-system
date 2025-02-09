import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import { cookies } from "next/headers";
import "./globals.css";
import { metadata as siteMetadata } from "./metadata";

interface ProvidersProps {
  children: React.ReactNode;
}

type NavbarProps = Record<string, never>;

interface LanguageProviderProps {
  children: React.ReactNode;
}

const Providers = dynamic<ProvidersProps>(() =>
  import("@/components/Providers").then((mod) => mod.default)
);

const Navbar = dynamic<NavbarProps>(() =>
  import("@/components/layout/Navbar").then((mod) => mod.default)
);

const LanguageProvider = dynamic<LanguageProviderProps>(() =>
  import("@/app/contexts/LanguageContext").then((mod) => mod.LanguageProvider)
);

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
