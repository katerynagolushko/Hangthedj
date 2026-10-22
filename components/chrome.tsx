"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

const LINKS = [
  { href: "/c/corgi", label: "Ask" },
  { href: "/inbox", label: "Chats" },
  { href: "/organiser", label: "Organiser" },
];

export function Nav() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <header className="sticky top-0 z-40 border-b border-[#E4E0D8] bg-[#F0ECE6]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="Hang home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm">
          {LINKS.map((link) => {
            const active = pathname === link.href || (link.href === "/c/corgi" && pathname.startsWith("/c/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-2.5 py-1.5 whitespace-nowrap ${
                  active ? "bg-[#1B1F3B] text-white" : "text-[#6B6B6B] hover:text-[#1B1F3B]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/join" className="hidden text-sm font-medium text-[#1B1F3B] sm:inline">
          Join
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/map") return null;
  return (
    <footer className="px-5 py-6 text-center text-xs leading-relaxed text-[#6B6B6B]">
      Demo profiles are fictional. Your notes stay in this browser. The placeholder team in
      data/team.json always scores 90%+.
    </footer>
  );
}

export function Page({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className={`mx-auto w-full px-4 py-8 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>{children}</main>
  );
}
