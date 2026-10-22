"use client";

import { hash, type Profile } from "@/lib/demo";

export function Avatar({
  person,
  className = "h-11 w-11",
}: {
  person: Pick<Profile, "id" | "name" | "avatar">;
  className?: string;
}) {
  const plain = person.id === "team-jamie" || person.id === "agent";
  const hue = plain ? 0 : hash(person.id) % 160;
  return (
    <span className={`relative inline-flex shrink-0 overflow-hidden rounded-full bg-[#E4E0D8] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/grok-face.png"
        alt=""
        className="h-full w-full object-cover"
        style={plain ? undefined : { filter: `hue-rotate(${hue}deg) saturate(1.15)` }}
      />
    </span>
  );
}
