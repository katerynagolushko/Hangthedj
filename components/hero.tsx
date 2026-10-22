"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { communities } from "@/lib/demo";

export function Hero() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-12">
      <Logo />
      <p className="mt-10 text-sm font-medium text-[#FF5A24]">The knowledge layer for your community</p>
      <h1 className="mt-3 text-5xl leading-[0.95] font-bold">
        Every member, <span className="text-[#FF5A24]">one question</span> away.
      </h1>
      <p className="mt-4 max-w-lg text-lg text-[#6B6B6B]">
        You join through a community you already belong to. A lead approves your profile. Then you ask, in text or out loud, and the right person shows up.
      </p>
      <ul className="mt-8 grid gap-3">
        {communities.map((community) => (
          <li key={community.slug}>
            <Link
              href={`/join?community=${community.slug}`}
              className="flex items-center justify-between rounded-xl border border-[#E4E0D8] bg-white px-4 py-3"
            >
              <span>
                <span className="block font-medium">{community.name}</span>
                <span className="block text-sm text-[#6B6B6B]">{community.blurb}</span>
              </span>
              <span className="text-sm font-medium text-[#FF5A24]">Join</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-[#6B6B6B]">Demo profiles are fictional. Your profile stays in this browser.</p>
    </div>
  );
}
