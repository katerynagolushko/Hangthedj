"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Page } from "@/components/chrome";
import { useViewer } from "@/components/session";
import { btn, btnGhost, card } from "@/components/ui";
import {
  buildMatch,
  communityName,
  events as seedEvents,
  formatWhen,
  peopleAt,
  personById,
  type HangEvent,
  type Profile,
} from "@/lib/demo";

type ListedEvent = HangEvent & { source: "seed" | "luma"; attendees: Profile[] };

const LUMA: ListedEvent[] = [
  {
    id: "luma-1",
    title: "Operator Dinner",
    date: "2026-11-12",
    venue: "Hackney",
    source: "luma",
    attendees: ["p6", "p11", "p1", "p2"].map((id) => personById(id)!),
  },
  {
    id: "luma-2",
    title: "Sunday Builders Walk",
    date: "2026-11-15",
    venue: "Victoria Park",
    source: "luma",
    attendees: ["p3", "p7", "p9", "p12"].map((id) => personById(id)!),
  },
];

export function EventsView() {
  const viewer = useViewer();
  const [imported, setImported] = useState(false);
  const [importing, setImporting] = useState(false);
  const [phase, setPhase] = useState("");

  const events = useMemo(() => {
    const base: ListedEvent[] = seedEvents.map((event) => ({
      ...event,
      source: "seed",
      attendees: peopleAt(event.id).filter((person) => person.id !== viewer.id),
    }));
    return imported ? [...base, ...LUMA] : base;
  }, [imported, viewer.id]);

  const upcoming = events.filter((event) => event.id !== "e4").sort((a, b) => a.date.localeCompare(b.date));
  const coworking = events.find((event) => event.id === "e4");
  const missed = peopleAt("e1")
    .filter((person) => !person.isTeam)
    .map((person) => buildMatch(viewer, person))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4);

  function importLuma() {
    if (importing || imported) return;
    setImporting(true);
    const phases = ["Connecting to Luma…", "Found 2 upcoming events…", "Adding guests…"];
    let index = 0;
    setPhase(phases[0]);
    const timer = setInterval(() => {
      index += 1;
      if (index >= phases.length) {
        clearInterval(timer);
        setImporting(false);
        setImported(true);
        setPhase("");
        return;
      }
      setPhase(phases[index]);
    }, 700);
  }

  return (
    <Page wide>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Go where the click is. Each card is people your agent would actually meet, with the
            sentence to open on.
          </p>
        </div>
        <button type="button" className={imported ? btnGhost : btn} onClick={importLuma} disabled={importing || imported}>
          {imported ? "Imported from Luma" : importing ? phase : "Import from Luma"}
        </button>
      </div>
      {importing ? <p className="mt-3 text-sm text-neutral-600">{phase}</p> : null}
      {imported ? (
        <p className="mt-3 text-sm text-neutral-600">Added 2 events from a mocked Luma account. Nothing left this browser.</p>
      ) : null}

      <Section title="Before you go">
        <div className="grid gap-3">
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} viewerId={viewer.id} />
          ))}
        </div>
      </Section>

      {coworking ? (
        <Section title="At the coworking spot">
          <EventCard event={coworking} viewerId={viewer.id} note={communityName("corgi")} />
        </Section>
      ) : null}

      <Section title="People you missed">
        <article className={`${card} p-4`}>
          <p className="text-sm text-neutral-500">Last Tuesday · Founders Den standup</p>
          <h2 className="mt-1 text-lg font-semibold">Four people your agent would have stopped for</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {missed.map((match) => (
              <li key={match.other.id} className="flex gap-3">
                <Avatar person={match.other} />
                <div>
                  <p className="text-sm font-medium">
                    {match.other.name} · {match.percent}%
                  </p>
                  <p className="text-sm text-neutral-600">{match.synergy}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/simulate" className={`${btnGhost} mt-4`}>
            Replay one of them
          </Link>
        </article>
      </Section>
    </Page>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function EventCard({
  event,
  viewerId,
  note,
}: {
  event: ListedEvent;
  viewerId: string;
  note?: string;
}) {
  const viewer = personById(viewerId);
  const ranked = viewer
    ? event.attendees
        .filter((person) => !person.isTeam && person.id !== viewerId)
        .map((person) => buildMatch(viewer, person))
        .filter((match) => match.percent >= 80)
        .sort((a, b) => b.percent - a.percent)
    : [];
  const top = ranked[0];

  return (
    <article className={`${card} p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">
            {formatWhen(event.date)} · {event.venue}
            {event.source === "luma" ? " · Luma" : ""}
            {note ? ` · ${note}` : ""}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{event.title}</h3>
        </div>
        <p className="text-sm text-neutral-700">
          {ranked.length} {ranked.length === 1 ? "person" : "people"} you&apos;d click with
        </p>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex -space-x-2">
          {ranked.slice(0, 5).map((match) => (
            <Avatar key={match.other.id} person={match.other} className="h-8 w-8 ring-2 ring-white" />
          ))}
        </div>
        <p className="text-sm text-neutral-600">
          {ranked
            .slice(0, 3)
            .map((match) => match.other.name.split(" ")[0])
            .join(", ") || "No strong clicks on this list"}
        </p>
      </div>
      {top ? <p className="mt-3 text-sm leading-relaxed text-neutral-700">{top.icebreaker}</p> : null}
    </article>
  );
}
