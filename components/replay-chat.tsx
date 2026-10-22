"use client";

import { useEffect, useRef, useState } from "react";
import type { Line } from "@/lib/demo";
import { btnGhost, card } from "@/components/ui";

export function ReplayChat({
  lines,
  selfName,
  otherName,
}: {
  lines: Line[];
  selfName: string;
  otherName: string;
}) {
  const [cursor, setCursor] = useState(0);
  const [chars, setChars] = useState(0);
  const [mode, setMode] = useState<"dots" | "type" | "done">("dots");
  const [run, setRun] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCursor(0);
    setChars(0);
    setMode(lines.length ? "dots" : "done");
  }, [run, lines]);

  useEffect(() => {
    if (mode === "done") return;
    const line = lines[cursor];
    if (!line) {
      setMode("done");
      return;
    }
    if (mode === "dots") {
      const timer = setTimeout(() => setMode("type"), 480);
      return () => clearTimeout(timer);
    }
    if (chars < line.text.length) {
      const timer = setTimeout(() => setChars((count) => count + 1), 11);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setCursor((value) => value + 1);
      setChars(0);
      setMode("dots");
    }, 360);
    return () => clearTimeout(timer);
  }, [mode, chars, cursor, lines]);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [cursor, chars, mode]);

  const finished = lines.slice(0, cursor);
  const current = mode === "done" ? undefined : lines[cursor];

  return (
    <section className={`${card} flex min-h-[420px] flex-col p-4 sm:p-5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-500">Replay</p>
          <h3 className="text-lg font-semibold">Agents only</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setCursor(lines.length);
              setMode("done");
            }}
            className={`${btnGhost} px-3 py-1.5`}
          >
            Skip
          </button>
          <button type="button" onClick={() => setRun((value) => value + 1)} className={`${btnGhost} px-3 py-1.5`}>
            Replay chat
          </button>
        </div>
      </div>
      <div ref={scroller} className="flex max-h-[460px] flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {finished.map((line, index) => (
          <Bubble key={`${run}-${index}`} line={line} text={line.text} selfName={selfName} otherName={otherName} />
        ))}
        {current ? (
          <Bubble
            line={current}
            text={mode === "type" ? current.text.slice(0, chars) : ""}
            dots={mode === "dots"}
            selfName={selfName}
            otherName={otherName}
          />
        ) : null}
        {mode === "done" ? (
          <p className="pt-2 text-center text-xs font-medium text-[#22C27A]">Both sides asked to meet</p>
        ) : null}
      </div>
    </section>
  );
}

function Bubble({
  line,
  text,
  dots = false,
  selfName,
  otherName,
}: {
  line: Line;
  text: string;
  dots?: boolean;
  selfName: string;
  otherName: string;
}) {
  const mine = line.side === "a";
  const name = mine ? `${selfName}'s agent` : `${otherName}'s agent`;
  return (
    <div className={`flex ${mine ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[88%] ${mine ? "" : "text-right"}`}>
        <p className="mb-1 text-xs text-neutral-500">{name}</p>
        <div
          className={`rounded-lg px-3 py-2 text-left text-sm leading-relaxed text-neutral-800 ${
            mine ? "bg-[#F8F6F2]" : "bg-[#FFF1EC]"
          }`}
        >
          {dots ? <TypingDots /> : text}
          {!dots && text.length < line.text.length ? (
            <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-neutral-500" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex h-5 items-center gap-1" aria-label="Typing">
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-500" />
      ))}
    </span>
  );
}
