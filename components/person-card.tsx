"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { useSession } from "@/components/session";
import { btn, btnGhost } from "@/components/ui";
import { approxWalk, communityName, getDemoUser, meetupFor, roleCompany, type Match } from "@/lib/demo";

export function PersonCard({
  match,
  viewerId,
  holdContact = false,
  onMeet,
}: {
  match: Match;
  viewerId: string;
  holdContact?: boolean;
  onMeet?: (match: Match) => void;
}) {
  const { session, update } = useSession();
  const { role, company } = roleCompany(match.other.headline);
  const paired = session.pairs.includes(match.other.id);
  const blocked = session.blocked.includes(match.other.id);
  const reported = session.reported.includes(match.other.id);
  const meetup = meetupFor(getDemoUser(), match.other);
  const showContact = paired && !holdContact;

  if (blocked) {
    return <p className="rounded-xl border border-[#E4E0D8] bg-white px-4 py-3 text-sm text-[#6B6B6B]">Blocked {match.other.name}.</p>;
  }

  function connect() {
    if (holdContact || match.percent < 90) return;
    if (!session.pairs.includes(match.other.id)) update({ pairs: [...session.pairs, match.other.id] });
  }

  return (
    <article className="rounded-xl border border-[#E4E0D8] bg-white p-4 shadow-[0_8px_24px_rgba(27,31,59,0.06)]">
      <div className="flex gap-3">
        <Avatar person={match.other} className="h-16 w-16" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold">{match.other.name}</h3>
            {paired ? <span className="rounded-lg bg-[#1B1F3B] px-2 py-0.5 text-xs text-white">Pair</span> : null}
          </div>
          <p className="text-sm text-[#6B6B6B]">
            {role}
            {company ? ` · ${company}` : ""}
          </p>
          <p className="text-sm font-medium text-[#FF5A24]">
            {match.percent}% · clicked {match.hits}/50
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm">{match.synergy}</p>
      <p className="mt-1 text-xs text-[#6B6B6B]">Why this match: {match.detail}</p>
      <p className="mt-1 text-xs text-[#FF5A24]">{approxWalk(viewerId, match.other.id)} · {meetup.line}</p>
      <p className="mt-1 text-xs text-[#6B6B6B]">{match.other.communities.map(communityName).join(", ")}</p>
      {showContact ? (
        <p className="mt-2 text-sm">Contact: linkedin.com/in/{match.other.id}-demo</p>
      ) : (
        <p className="mt-2 text-xs text-[#6B6B6B]">Contact stays hidden until you both opt in.</p>
      )}
      {reported ? <p className="mt-1 text-xs text-[#FF5A24]">Reported. A community manager can see this.</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={connect}>
          {paired ? "Paired" : "Connect"}
        </button>
        <Link href={`/simulate?with=${match.other.id}`} className={btnGhost}>
          View simulation
        </Link>
        {onMeet ? (
          <button type="button" className={btnGhost} onClick={() => onMeet(match)}>
            Meet nearby
          </button>
        ) : null}
        <button
          type="button"
          className="text-sm text-[#6B6B6B]"
          onClick={() => update({ blocked: [...session.blocked, match.other.id] })}
        >
          Block
        </button>
        <button
          type="button"
          className="text-sm text-[#6B6B6B]"
          onClick={() => update({ reported: [...session.reported, match.other.id] })}
        >
          Report
        </button>
      </div>
    </article>
  );
}
