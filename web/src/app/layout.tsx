import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Settings, CircleFadingPlus, LibraryBig } from "lucide-react";
import { Providers } from "@/components/providers";
import { YouTubeStatusIcon } from "@/components/youtube-status-icon";
import { getQuickConnectionStatus } from "@/lib/youtube-client";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scriptor",
  description:
    "AI-powered script generation and analytics for YouTube Shorts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const connectionStatus = getQuickConnectionStatus();
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <Providers>
          <div className="max-w-4xl mx-auto px-6 py-8 w-full">
            <header className="mb-8 flex items-center justify-between">
              <Link href="/scripts" className="cursor-pointer flex items-center gap-2">
                <LibraryBig className="w-6 h-6 text-zinc-900" />
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                  Scriptor
                </h1>
              </Link>
              <nav className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                  title="Generate"
                >
                  <CircleFadingPlus className="w-4 h-4" />
                </Link>
                <YouTubeStatusIcon status={connectionStatus} />
                <Link
                  href="/settings"
                  className="text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </nav>
            </header>
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
