"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { useSession } from "@/components/session";
import { btn, btnGhost } from "@/components/ui";

const SEED_PENDING = [
  { id: "pending-lena", name: "Lena Ortiz", title: "Designer", company: "Northwind", community: "Corgi Community" },
  { id: "pending-chris", name: "Chris Adeyemi", title: "Engineer", company: "Fieldnote", community: "Corgi Community" },
];

export function OrganiserView() {
  const { session, update } = useSession();
  const [queue, setQueue] = useState(SEED_PENDING);
  const [decided, setDecided] = useState<{ name: string; status: "Approved" | "Rejected" }[]>([]);
  const lead = "Claudia Voss";

  function settle(name: string, status: "Approved" | "Rejected", id?: string) {
    setDecided((current) => [{ name, status }, ...current]);
    if (id) setQueue((current) => current.filter((person) => person.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-[#6B6B6B]">Organiser · {lead}</p>
      <h1 className="mt-1 text-4xl font-bold">Pending profiles</h1>
      <p className="mt-2 text-sm text-[#6B6B6B]">Members join through the community. You approve each profile.</p>
      <ul className="mt-6 grid gap-3">
        {session.approval === "pending" ? (
          <li className="rounded-xl border border-[#E4E0D8] bg-white p-4">
            <div className="flex items-center gap-3">
              <Avatar person={{ id: "team-jamie", name: session.firstName || "Jamie", avatar: 0 }} />
              <div>
                <p className="font-medium">{session.firstName || "Jamie"} {session.company ? `· ${session.company}` : ""}</p>
                <p className="text-sm text-[#6B6B6B]">
                  {session.title || "Founder"} · {session.employment || "Founder"} · {session.skills || "Simulations"}
                </p>
                <p className="text-xs text-[#6B6B6B]">{session.linkedin}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className={btn} onClick={() => update({ approval: "approved" })}>
                Approve
              </button>
              <button type="button" className={btnGhost} onClick={() => update({ approval: "rejected" })}>
                Reject
              </button>
            </div>
          </li>
        ) : null}
        {queue.map((person) => (
          <li key={person.id} className="rounded-xl border border-[#E4E0D8] bg-white p-4">
            <div className="flex items-center gap-3">
              <Avatar person={{ id: person.id, name: person.name, avatar: 0 }} />
              <div>
                <p className="font-medium">{person.name}</p>
                <p className="text-sm text-[#6B6B6B]">
                  {person.title} · {person.company} · {person.community}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className={btn} onClick={() => settle(person.name, "Approved", person.id)}>
                Approve
              </button>
              <button type="button" className={btnGhost} onClick={() => settle(person.name, "Rejected", person.id)}>
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
      {session.approval === "approved" ? <p className="mt-4 text-sm text-[#22C27A]">Jamie is approved.</p> : null}
      {decided.length ? (
        <ul className="mt-4 text-sm text-[#6B6B6B]">
          {decided.map((item) => (
            <li key={item.name}>
              {item.name}: {item.status}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Questions answered" value={String(18 + session.asked.length)} />
        <Stat label="Members joined" value={session.approval === "approved" ? "101" : "100"} />
        <Stat label="Profiles complete" value="86%" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E4E0D8] bg-white p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-[#6B6B6B]">{label}</p>
    </div>
  );
}
