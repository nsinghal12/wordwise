import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Outfit } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from '@/lib/AuthContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "WordWise",
  description: "Your AI-powered writing assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${outfit.className}`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
