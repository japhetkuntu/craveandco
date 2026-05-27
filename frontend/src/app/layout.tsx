import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crave & Co Restaurant",
  description: "Crave & Co restaurant – fresh food, cozy vibes, and neighborhood favorites.",
  applicationName: "Crave & Co",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: ["/favicon.ico", "/favicon.svg"],
    shortcut: "/favicon.svg",
    apple: "/favicon.png",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: "#c9a646",
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
      <body className="min-h-full flex flex-col bg-surface-base text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
