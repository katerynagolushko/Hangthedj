"use client";

import { Avatar } from "@/components/avatar";
import { card, chip } from "@/components/ui";
import { GOAL_LABEL, type Match, type Profile } from "@/lib/demo";

export function MatchCard({ self, match }: { self: Profile; match: Match }) {
  return (
    <article className={`${card} p-5 sm:p-6`}>
      <p className="text-sm font-medium text-[#22C27A]">Both agents want to meet</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-5xl font-semibold tracking-tight">
            {match.percent}
            <span className="text-2xl font-medium text-neutral-400">%</span>
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {match.hits}/{match.total} — {match.percent}% match
          </p>
        </div>
        <div className="flex -space-x-2">
          <Avatar person={self} className="h-12 w-12 ring-2 ring-white" />
          <Avatar person={match.other} className="h-12 w-12 ring-2 ring-white" />
        </div>
      </div>
      <p className="mt-4 text-sm text-neutral-500">
        {self.name.split(" ")[0]} and {match.other.name}
      </p>
      <h3 className="mt-1 text-xl font-semibold">{match.synergy}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {match.other.goals.map((goal) => (
          <span key={goal} className={chip}>
            {GOAL_LABEL[goal] ?? goal}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-neutral-700">{match.detail}</p>
      <blockquote className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-800">
        <span className="mb-1 block text-xs font-medium text-neutral-500">Icebreaker</span>
        {match.icebreaker}
      </blockquote>
      <p className="mt-4 text-xs text-neutral-500">
        Scaled up, that is {match.fullHits.toLocaleString("en-GB")} of 1,000 simulations. This
        preview ran 50.
      </p>
    </article>
  );
}
