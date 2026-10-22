"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Page } from "@/components/chrome";
import { useSession, useViewer } from "@/components/session";
import { btn, btnGhost } from "@/components/ui";
import { eventById, matchesFor, portrait, roleCompany } from "@/lib/demo";

export function MatchesView() {
  const router = useRouter();
  const viewer = useViewer();
  const { session, update } = useSession();
  const matches = useMemo(() => matchesFor(viewer), [viewer]);
  const [index, setIndex] = useState(0);
  const [justPaired, setJustPaired] = useState(false);
  const match = matches[index];

  function connect() {
    if (!match) return;
    const paired = match.percent >= 90;
    if (paired && !session.pairs.includes(match.other.id)) {
      update({ pairs: [...session.pairs, match.other.id] });
    }
    setJustPaired(paired);
  }

  function next() {
    setJustPaired(false);
    setIndex((value) => Math.min(matches.length, value + 1));
  }

  if (!match) {
    return (
      <Page>
        <h1 className="text-4xl font-bold">That&apos;s the room.</h1>
        <p className="mt-2 text-[#6B6B6B]">You&apos;ve seen everyone in this demo. The map is still there.</p>
        <button type="button" className={`${btn} mt-6`} onClick={() => router.push("/map")}>
          Back to the map
        </button>
      </Page>
    );
  }

  const { role, company } = roleCompany(match.other.headline);
  const event = match.other.events.map((id) => eventById(id)?.title).find(Boolean);
  const paired = session.pairs.includes(match.other.id) || justPaired;

  return (
    <Page>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">People near you</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">
            {index + 1} of {matches.length}. If they connect back, you&apos;re a pair.
          </p>
        </div>
      </div>
      <SwipeCard
        key={match.other.id}
        onPass={next}
        onConnect={() => {
          connect();
        }}
      >
        <article className="overflow-hidden rounded-xl border border-[#E4E0D8] bg-white shadow-[0_12px_32px_rgba(27,31,59,0.08)]">
          <div className="relative h-80 bg-[#E7E2DA]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={portrait(match.other.id)} alt="" className="h-full w-full object-cover" />
            {paired ? (
              <span className="absolute top-3 left-3 rounded-lg bg-[#1B1F3B] px-2 py-1 text-xs font-medium text-white">
                Pair
              </span>
            ) : null}
          </div>
          <div className="p-4">
            <h2 className="text-2xl font-bold">{match.other.name}</h2>
            <p className="text-sm text-[#6B6B6B]">
              {role}
              {company ? ` · ${company}` : ""}
            </p>
            <p className="mt-2 text-sm font-medium text-[#FF5A24]">
              {match.percent}% · clicked {match.hits}/{match.total}
            </p>
            <p className="mt-1 text-sm">{match.synergy}</p>
            {event ? <p className="mt-1 text-sm text-[#6B6B6B]">They&apos;ll be at {event}</p> : null}
            {paired ? (
              <p className="mt-2 text-sm text-[#22C27A]">Both of you said yes. You&apos;re a pair.</p>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className={btn} onClick={connect}>
                Connect
              </button>
              <button
                type="button"
                className={btnGhost}
                onClick={() => router.push(`/simulate?with=${match.other.id}`)}
              >
                View simulation
              </button>
            </div>
            <button type="button" className="mt-3 text-sm text-[#6B6B6B]" onClick={next}>
              Not this one
            </button>
          </div>
        </article>
      </SwipeCard>
    </Page>
  );
}

function SwipeCard({
  children,
  onPass,
  onConnect,
}: {
  children: React.ReactNode;
  onPass: () => void;
  onConnect: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 180], [-8, 8]);

  return (
    <motion.div
      className="mt-5"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onConnect();
        else if (info.offset.x < -120) onPass();
      }}
    >
      {children}
    </motion.div>
  );
}
