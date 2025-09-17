import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Dua Lipa Agent",
  description: "A Dua Lipa-themed mobile-first web app demo.",
  icons: {
    icon: '/dua_lipa.png',
    shortcut: '/dua_lipa.png',
    apple: '/dua_lipa.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen min-w-screen w-screen h-screen bg-black relative overflow-x-hidden overflow-y-auto`}
        style={{ minHeight: "100vh", minWidth: "100vw", width: "100vw", height: "100vh", margin: 0, padding: 0 }}
      >
        <div className="absolute inset-0 w-full h-full flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
