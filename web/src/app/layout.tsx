import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Providers } from "@/components/providers";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
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
      className={`${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <Providers>
          <div className="max-w-4xl mx-auto px-6 py-8 w-full">
            <header className="mb-8 flex items-center justify-between">
              <Link href="/">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                  Devlog Scriptwriter
                </h1>
              </Link>
              <nav className="flex gap-4">
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                >
                  Generate
                </Link>
                <Link
                  href="/scripts"
                  className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                >
                  Scripts
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
