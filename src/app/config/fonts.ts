// src/app/config/fonts.ts
import localFont from "next/font/local";

export const geistSans = localFont({
  src: [
    {
      path: '../fonts/GeistVF.woff2',
      weight: '100 900',
      style: 'normal',
    }
  ],
  variable: '--font-geist-sans',
  display: 'swap',
  preload: true,
});

export const geistMono = localFont({
  src: [
    {
      path: '../fonts/GeistMonoVF.woff2',
      weight: '100 900',
      style: 'normal',
    }
  ],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: true,
});