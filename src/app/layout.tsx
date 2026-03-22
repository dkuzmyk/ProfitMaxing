import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { GlobalNav } from "@/components/global-nav";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Profit Maxing",
  description: "Trading journal with private and guest demo workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="min-h-screen">
          <GlobalNav />
          {children}
        </div>
      </body>
    </html>
  );
}
