import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { AppNav } from "@/components/AppNav";
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

export const metadata: Metadata = {
  title: "BookReader — Read, tap, learn",
  description:
    "Upload images or PDFs, read extracted text, tap words for speech and definitions, save vocabulary.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AppNav />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
