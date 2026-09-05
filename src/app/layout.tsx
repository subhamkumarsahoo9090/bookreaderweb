import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Outfit,
  Literata,
  Noto_Sans_Devanagari,
  Noto_Sans_Oriya,
} from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { AppNav } from "@/components/AppNav";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

const notoDeva = Noto_Sans_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
});

const notoOriya = Noto_Sans_Oriya({
  variable: "--font-noto-oriya",
  subsets: ["oriya"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AksharaX — Read, edit, learn",
  description:
    "Upload documents, edit text, tap words for explanations, notes, vocabulary, quiz, and read aloud.",
  applicationName: "AksharaX",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "AksharaX",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${literata.variable} ${notoDeva.variable} ${notoOriya.variable} h-full antialiased`}
      data-theme="paper"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ThemeProvider>
            <PwaRegister />
            <AppNav />
            <main className="flex-1">{children}</main>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
