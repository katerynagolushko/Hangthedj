"use client";

import dynamic from "next/dynamic";
import { approxWalk, approximateSpot, getDemoUser, meetupFor, portrait, type Match } from "@/lib/demo";

const LondonMap = dynamic(() => import("@/components/london-map").then((mod) => mod.LondonMap), { ssr: false });

export function MeetSheet({
  viewerId,
  match,
  onClose,
}: {
  viewerId: string;
  match: Match;
  onClose: () => void;
}) {
  const meetup = meetupFor(getDemoUser(), match.other);
  const you = approximateSpot(viewerId);
  const them = approximateSpot(match.other.id);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1B1F3B]/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[#E4E0D8] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm text-[#6B6B6B]">Meet nearby</p>
            <p className="font-medium">{meetup.line}</p>
          </div>
          <button type="button" className="text-sm text-[#6B6B6B]" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="h-72">
          <LondonMap
            zoom={14}
            center={[meetup.lat, meetup.lng]}
            markers={[
              { id: viewerId, name: "You", photo: portrait(viewerId), lat: you.lat, lng: you.lng, area: you.area, detail: "Approximate pin" },
              { id: match.other.id, name: match.other.name, photo: portrait(match.other.id), lat: them.lat, lng: them.lng, area: them.area, distance: approxWalk(viewerId, match.other.id) },
              { id: "place", name: meetup.place, photo: "", lat: meetup.lat, lng: meetup.lng, area: meetup.place, variant: "place", detail: "Public place, not a home address" },
            ]}
          />
        </div>
        <p className="px-4 py-3 text-xs text-[#6B6B6B]">Approximate area only. We never share an exact location.</p>
      </div>
    </div>
  );
}
