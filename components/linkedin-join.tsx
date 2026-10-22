"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session";
import { btn, chip, field } from "@/components/ui";
import { communityBySlug } from "@/lib/demo";

const CHIPS = [
  { label: "Role", value: "Founder" },
  { label: "Company", value: "Hang" },
  { label: "Skills", value: "Simulations, GTM" },
  { label: "Communities", value: "Corgi Community, Founders Den" },
];

export function LinkedInJoin({
  communitySlug,
  redirectTo,
}: {
  communitySlug?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { session, update } = useSession();
  const [url, setUrl] = useState("https://www.linkedin.com/in/jamie-okonkwo");
  const [phase, setPhase] = useState<"form" | "reading" | "done">("form");
  const [shown, setShown] = useState(0);
  const community = communitySlug ? communityBySlug(communitySlug) : undefined;

  useEffect(() => {
    if (phase !== "reading") return;
    if (shown >= CHIPS.length) {
      const timer = window.setTimeout(() => setPhase("done"), 400);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setShown((value) => value + 1), 550);
    return () => window.clearTimeout(timer);
  }, [phase, shown]);

  function start() {
    const joined = communitySlug && !session.joined.includes(communitySlug) ? [...session.joined, communitySlug] : session.joined;
    update({
      linkedin: url.trim() || "https://www.linkedin.com/in/jamie-okonkwo",
      onboarded: true,
      joined,
      firstName: "Jamie",
    });
    setShown(0);
    setPhase("reading");
  }

  return (
    <div className="rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-[0_8px_24px_rgba(27,31,59,0.06)]">
      <h2 className="text-2xl font-bold">Paste your LinkedIn</h2>
      <p className="mt-1 text-sm text-[#6B6B6B]">
        {community ? `Join ${community.name}. One field. No other questions.` : "One field. Your agent reads it. Nothing else to fill in."}
      </p>
      {phase === "form" ? (
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            start();
          }}
        >
          <input className={field} value={url} onChange={(event) => setUrl(event.target.value)} aria-label="LinkedIn URL" />
          <button type="submit" className={btn}>
            {community ? "Join with LinkedIn" : "Read my profile"}
          </button>
        </form>
      ) : null}
      {phase !== "form" ? <p className="mt-4 text-sm font-medium">Reading your profile</p> : null}
      {shown > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.slice(0, shown).map((item) => (
            <span key={item.label} className={chip}>
              <span className="text-[#6B6B6B]">{item.label}</span> {item.value}
            </span>
          ))}
        </div>
      ) : null}
      {phase === "done" ? (
        <button type="button" className={`${btn} mt-4`} onClick={() => router.push(redirectTo ?? "/c/corgi")}>
          Continue
        </button>
      ) : null}
      <p className="mt-3 text-xs text-[#6B6B6B]">Stays in this browser. We don&apos;t call LinkedIn.</p>
    </div>
  );
}
