import type { Metadata } from "next";
import { IBM_Plex_Sans, Syne } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Footer, Nav } from "@/components/chrome";
import { SessionProvider } from "@/components/session";

const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm",
});

export const metadata: Metadata = {
  title: "Hang — the knowledge layer for your community",
  description: "Join through your community, get approved, and ask for the person you need.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#F0ECE6] font-sans text-[#1B1F3B]">
        <SessionProvider>
          <Suspense fallback={<div className="h-14 border-b border-[#E4E0D8] bg-[#F0ECE6]" />}>
            <Nav />
          </Suspense>
          <div className="flex-1">{children}</div>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </SessionProvider>
      </body>
    </html>
  );
}
