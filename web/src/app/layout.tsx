import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Devlog Scriptwriter",
  description:
    "AI-powered script generation for YouTube Shorts devlogs",
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
      <body className="min-h-full flex flex-col bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8 w-full">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Devlog Scriptwriter
            </h1>
          </header>
          <main>{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
