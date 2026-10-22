"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { Page } from "@/components/chrome";
import { useViewer } from "@/components/session";
import { btn } from "@/components/ui";
import { buildPattern, matchesFor } from "@/lib/demo";

export function MeetingView() {
  const router = useRouter();
  const viewer = useViewer();
  const matches = useMemo(() => matchesFor(viewer).slice(0, 8), [viewer]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (tick >= 10) return;
    const timer = setTimeout(() => setTick((value) => value + 1), 240);
    return () => clearTimeout(timer);
  }, [tick]);

  const featured = matches[0];
  const featuredHits = featured
    ? buildPattern(featured.other.id, Math.round((featured.hits / 50) * 10), 10)
        .slice(0, tick)
        .filter(Boolean).length
    : 0;

  return (
    <Page>
      <p className="text-sm text-[#6B6B6B]">Your agent is meeting people</p>
      <h1 className="mt-2 text-4xl font-bold">The quiet part.</h1>
      <p className="mt-2 max-w-lg text-[#6B6B6B]">
        You don&apos;t have to talk yet. {viewer.name.split(" ")[0]}&apos;s agent is running short
        conversations and only keeping the ones where both sides want the meeting.
      </p>
      {featured ? (
        <p className="mt-5 text-lg">
          Clicked in <span className="font-semibold text-[#FF5A24]">{featuredHits} of {Math.max(tick, 1)}</span>{" "}
          simulations with {featured.other.name.split(" ")[0]}.
        </p>
      ) : null}
      <ul className="mt-6 grid gap-3">
        {matches.map((match) => {
          const pattern = buildPattern(match.other.id, Math.round((match.hits / 50) * 10), 10);
          const hits = pattern.slice(0, tick).filter(Boolean).length;
          return (
            <li key={match.other.id} className="flex items-center gap-3 rounded-xl border border-[#E4E0D8] bg-white px-3 py-2.5">
              <Avatar person={match.other} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{match.other.name}</p>
                <p className="text-xs text-[#6B6B6B]">{hits}/10 so far</p>
              </div>
              <div className="flex gap-1">
                {pattern.map((hit, index) => {
                  const shown = index < tick;
                  return (
                    <span
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        !shown ? "bg-[#E4E0D8]" : hit ? "bg-[#22C27A]" : "bg-[#C8C2B8]"
                      }`}
                    />
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      {tick >= 10 && featured ? (
        <p className="mt-5 text-sm text-[#6B6B6B]">
          1,000 simulations. You two kept choosing each other.
        </p>
      ) : null}
      <button type="button" className={`${btn} mt-6`} onClick={() => router.push("/matches")}>
        {tick >= 10 ? "See your matches" : "Skip ahead"}
      </button>
    </Page>
  );
}
