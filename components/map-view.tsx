"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useSession, useViewer } from "@/components/session";
import { btn } from "@/components/ui";
import { allPeople, buildMatch, distanceLabel, eventById, portrait, spotFor } from "@/lib/demo";

const LondonMap = dynamic(() => import("@/components/london-map").then((mod) => mod.LondonMap), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#E7E2DA]" />,
});

export function MapView() {
  const viewer = useViewer();
  const { session, update } = useSession();
  const you = spotFor(viewer.id);

  const goalKey = viewer.goals.join(",");
  const markers = useMemo(() => {
    const people = allPeople().filter((person) => person.id !== viewer.id && !person.isTeam);
    const list = people.map((person) => {
      const spot = spotFor(person.id);
      const match = buildMatch(viewer, person);
      const event = person.events.map((id) => eventById(id)?.title).find(Boolean);
      return {
        id: person.id,
        name: person.name,
        photo: portrait(person.id),
        lat: spot.lat,
        lng: spot.lng,
        area: spot.area,
        score: `${match.percent}% · ${match.synergy}`,
        detail: event ? `At ${event}` : match.icebreaker,
        distance: distanceLabel(viewer.id, person.id),
      };
    });
    if (session.hangingOut) {
      list.push({
        id: viewer.id,
        name: "You",
        photo: portrait(viewer.id),
        lat: you.lat,
        lng: you.lng,
        area: you.area,
        score: "You're live",
        detail: "Rough pin. It turns off when you stop.",
        distance: "",
      });
    }
    return list;
    // viewer fields are listed; the object itself is a new reference each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalKey, session.hangingOut, viewer.id, viewer.name, viewer.offers, viewer.needs, you.area, you.lat, you.lng]);

  return (
    <div className="relative h-[calc(100vh-57px)] min-h-[560px]">
      <LondonMap markers={markers} center={[you.lat, you.lng]} zoom={13} />
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <button
            type="button"
            className={`${btn} shadow-[0_10px_24px_rgba(255,90,36,0.35)]`}
            onClick={() => update({ hangingOut: !session.hangingOut })}
          >
            <span className={`mr-2 inline-block h-2 w-2 rounded-full ${session.hangingOut ? "bg-white" : "bg-[#22C27A]"}`} />
            {session.hangingOut ? "Stop" : "I'm free to hang out"}
          </button>
          <p className="rounded-lg bg-white/95 px-3 py-1 text-center text-xs text-[#6B6B6B] shadow-sm">
            Rough pin for this hangout only. No background tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
