"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { dictate } from "@/components/dictation";
import { Waveform } from "@/components/waveform";
import { useSession } from "@/components/session";
import { btn, field } from "@/components/ui";
import { personById } from "@/lib/demo";

export function ThreadView({ id }: { id: string }) {
  const { session, update } = useSession();
  const person = personById(id);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const lines = session.threads[id] ?? [];

  if (!person) return <p className="p-6">That chat is not in this demo.</p>;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col px-4 py-6">
      <Link href="/inbox" className="text-sm text-[#6B6B6B]">
        Chats
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <Avatar person={person} className="h-12 w-12" />
        <div>
          <h1 className="text-2xl font-bold">{person.name}</h1>
          <p className="text-sm text-[#22C27A]">You both accepted. This chat stays in the app.</p>
        </div>
      </div>
      <div className="mt-6 flex flex-1 flex-col gap-2">
        {lines.map((line, index) => (
          <p
            key={index}
            className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
              line.side === "you" ? "ml-auto bg-[#1B1F3B] text-white" : "bg-white"
            }`}
          >
            {line.text}
          </p>
        ))}
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = text.trim();
          if (!next) return;
          update({ threads: { ...session.threads, [id]: [...lines, { side: "you", text: next }] } });
          setText("");
        }}
      >
        <button
          type="button"
          aria-label="Speak a message"
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1B1F3B] ${listening ? "ring-4 ring-[#FF5A24]/40" : ""}`}
          onClick={() => {
            setListening(true);
            dictate({
              fallback: "Can we meet at Corgi on Friday?",
              onPartial: setText,
              onDone: (spoken) => {
                setListening(false);
                setText(spoken);
              },
            });
          }}
        >
          <Waveform live={listening} />
        </button>
        <input className={field} value={text} onChange={(event) => setText(event.target.value)} placeholder="Message" />
        <button type="submit" className={btn}>
          Send
        </button>
      </form>
    </div>
  );
}

export function Inbox() {
  const { session } = useSession();
  const ids = Object.keys(session.threads);
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-4xl font-bold">Chats</h1>
      <p className="mt-2 text-sm text-[#6B6B6B]">A chat opens only after you both accept.</p>
      <ul className="mt-6 grid gap-3">
        {ids.length === 0 ? <li className="text-sm text-[#6B6B6B]">No chats yet. Accept a match first.</li> : null}
        {ids.map((id) => {
          const person = personById(id);
          if (!person) return null;
          const last = session.threads[id]?.at(-1)?.text ?? "";
          return (
            <li key={id}>
              <Link href={`/thread/${id}`} className="flex items-center gap-3 rounded-xl border border-[#E4E0D8] bg-white p-3">
                <Avatar person={person} />
                <span>
                  <span className="block font-medium">{person.name}</span>
                  <span className="block text-sm text-[#6B6B6B]">{last}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
