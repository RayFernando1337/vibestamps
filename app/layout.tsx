import GhibliBackground from "@/components/ui/ghibli-background";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Doto, Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const doto = Doto({
  variable: "--font-doto",
  weight: "900",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vibestamps | Timestamp Generator for YouTube",
  description:
    "Vibestamps helps you upload a .srt file to generate meaningful timestamps for YouTube videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} ${doto.variable} antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <GhibliBackground />
            <Header />
            <main className="container py-4">
              {children}
            </main>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
