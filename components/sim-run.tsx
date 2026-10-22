"use client";

import { useEffect, useRef, useState } from "react";
import { getDemoUser, hash, meetupFor, GOAL_LABEL, type Match } from "@/lib/demo";
import { btn, btnGhost } from "@/components/ui";

const COLS = 50;
const ROWS = 20;
const N = COLS * ROWS;

const SNIPS: [string, string, boolean][] = [
  ["you need a GTM lead for robotics?", "yes, and I have 2 logistics pilots.", true],
  ["is this just a coffee?", "no. I only count a meeting with a trade.", false],
  ["are you actually hiring?", "founding engineer, not a contractor.", true],
  ["pre-seed, or are you browsing?", "I write cheques when the room is specific.", true],
  ["cofounder or advisor?", "cofounder. I don't do vague jam sessions.", true],
  ["can you intro a customer?", "one pilot, then we talk.", false],
  ["London this month?", "yes. Clerkenwell or the Thursday night.", true],
  ["should we meet?", "only if both of us name the trade.", false],
];

function yesMap(seed: string, qualified: number) {
  const flags = new Uint8Array(N);
  for (let i = 0; i < qualified && i < N; i += 1) flags[i] = 1;
  let state = hash(seed) || 1;
  for (let i = N - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 16807) + 11) >>> 0;
    const j = state % (i + 1);
    const swap = flags[i];
    flags[i] = flags[j];
    flags[j] = swap;
  }
  return flags;
}

function cellState(elapsed: number, index: number, yes: Uint8Array) {
  const delay = ((index % COLS) / COLS) * 1400 + (Math.floor(index / COLS) / ROWS) * 400;
  if (elapsed < delay) return 0;
  if (elapsed < delay + 1600) return 1;
  if (elapsed < delay + 2800) return 2;
  return yes[index] ? 3 : 4;
}

export function SimRun({
  match,
  onAccept,
  onDecline,
}: {
  match: Match;
  onAccept: (match: Match) => void;
  onDecline: (id: string) => void;
}) {
  const target = Math.max(900, Math.min(990, match.fullHits || 947));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [talking, setTalking] = useState(0);
  const [qualified, setQualified] = useState(0);
  const [done, setDone] = useState(false);
  const [lines, setLines] = useState<{ n: number; a: string; b: string; yes: boolean }[]>([]);
  const [replay, setReplay] = useState(false);
  const place = meetupFor(getDemoUser(), match.other).line;
  const synergies = [
    match.synergy,
    match.other.goals[0] ? GOAL_LABEL[match.other.goals[0]] ?? match.other.goals[0] : "A specific trade",
    "A next step, not a coffee",
  ];

  useEffect(() => {
    const start = performance.now();
    const timer = window.setInterval(() => {
      const t = Math.min(6000, performance.now() - start);
      setElapsed(t);
      setTalking(Math.min(1000, Math.round((t / 1500) * 1000)));
      setQualified(Math.min(target, Math.round((t / 6000) * target)));
      if (t >= 6000) {
        setDone(true);
        window.clearInterval(timer);
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [target]);

  useEffect(() => {
    let i = 0;
    const timer = window.setInterval(() => {
      if (i >= 12) {
        window.clearInterval(timer);
        return;
      }
      const snip = SNIPS[i % SNIPS.length];
      const n = (hash(`${match.other.id}:${i}`) % 900) + 40;
      setLines((current) => [{ n, a: snip[0], b: snip[1], yes: snip[2] }, ...current].slice(0, 6));
      i += 1;
    }, 450);
    return () => window.clearInterval(timer);
  }, [match.other.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const surface = canvas;
    const ctx = surface.getContext("2d");
    if (!ctx) return;
    const yes = yesMap(match.other.id, target);
    const last = new Uint8Array(N);
    const img = new Image();
    img.src = "/grok-face.png";
    let youFace: CanvasImageSource | null = null;
    let themFace: CanvasImageSource | null = null;
    const hue = hash(match.other.id) % 140;

    function paintFaces() {
      if (!img.complete || !img.naturalWidth) return;
      const size = 32;
      const a = document.createElement("canvas");
      a.width = size;
      a.height = size;
      a.getContext("2d")?.drawImage(img, 0, 0, size, size);
      youFace = a;
      const b = document.createElement("canvas");
      b.width = size;
      b.height = size;
      const g = b.getContext("2d");
      if (g) {
        g.filter = `hue-rotate(${hue}deg) saturate(1.2)`;
        g.drawImage(img, 0, 0, size, size);
      }
      themFace = b;
    }

    function drawCell(index: number, state: number) {
      if (!ctx) return;
      const cell = surface.width / COLS;
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      const x = col * cell;
      const y = row * cell;
      const fill = ["#E7E2DA", "#C8C2B8", "#FF5A24", "#22C27A", "#E7E2DA"][state];
      ctx.fillStyle = fill;
      ctx.fillRect(x + 0.5, y + 0.5, cell - 1.2, cell - 1.2);
      if (state === 0 || !youFace || !themFace) return;
      const r = cell * 0.22;
      const spots = [
        [0.34, youFace],
        [0.66, themFace],
      ] as const;
      for (const [cx, face] of spots) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + cell * cx, y + cell * 0.55, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(face, x + cell * cx - r, y + cell * 0.55 - r, r * 2, r * 2);
        ctx.restore();
      }
      if (state === 4) {
        ctx.strokeStyle = "rgba(27,31,59,0.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 3);
        ctx.lineTo(x + cell - 4, y + cell - 4);
        ctx.moveTo(x + cell - 4, y + 3);
        ctx.lineTo(x + 3, y + cell - 4);
        ctx.stroke();
      }
    }

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(6000, now - start);
      if (youFace === null && img.complete) {
        paintFaces();
        last.fill(255);
      }
      for (let i = 0; i < N; i += 1) {
        const state = cellState(t, i, yes);
        if (state !== last[i]) {
          last[i] = state;
          drawCell(i, state);
        }
      }
      if (t < 6000) frame = requestAnimationFrame(tick);
    };
    img.onload = () => {
      paintFaces();
      last.fill(255);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [match.other.id, target]);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#F0ECE6] text-[#1B1F3B] lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6">
        <p className="text-sm text-[#6B6B6B]">Simulating your match with {match.other.name.split(" ")[0]}</p>
        <div className="mt-2 flex flex-wrap gap-6">
          <p className="text-sm">
            Agents in conversation <span className="text-2xl font-bold">{talking.toLocaleString("en-GB")}</span>
          </p>
          <p className="text-sm">
            Qualified <span className="text-2xl font-bold text-[#FF5A24]">{qualified.toLocaleString("en-GB")}</span>
          </p>
          <p className="text-sm">
            <span className="text-2xl font-bold">{(elapsed / 1000).toFixed(1)}s</span>
          </p>
        </div>
        <canvas ref={canvasRef} width={1000} height={400} className="mt-4 h-auto w-full max-w-5xl rounded-xl bg-[#E7E2DA]" />
        <p className="mt-2 text-xs text-[#6B6B6B]">Grey is still talking. Orange is qualifying. Green means both agents said yes. A faint cross is a no.</p>
      </div>
      <aside className="w-full shrink-0 border-t border-[#E4E0D8] bg-white p-4 lg:w-[380px] lg:border-t-0 lg:border-l">
        {done ? (
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              {target.toLocaleString("en-GB")} of 1,000 simulations: you should meet.
            </h2>
            <p className="mt-4 text-sm font-medium">Top synergies</p>
            <ul className="mt-2 grid gap-1 text-sm">
              {synergies.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-medium">Best icebreaker</p>
            <p className="mt-1 text-sm text-[#6B6B6B]">{match.icebreaker}</p>
            <p className="mt-4 text-sm font-medium">Suggested place</p>
            <p className="mt-1 text-sm">{place}</p>
            <p className="mt-3 text-xs text-[#6B6B6B]">They won&apos;t know if you pass.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={btn} onClick={() => onAccept(match)}>
                Accept
              </button>
              <button type="button" className={btnGhost} onClick={() => onDecline(match.other.id)}>
                Decline
              </button>
              <button type="button" className={btnGhost} onClick={() => setReplay(true)}>
                Replay a simulation
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium">Live simulations</p>
            <ul className="mt-3 grid gap-3">
              {lines.map((line) => (
                <li key={line.n} className="rounded-xl bg-[#F8F6F2] p-3 text-sm">
                  <p className="text-xs text-[#6B6B6B]">
                    #{line.n} · {line.yes ? "both said yes" : "no"}
                  </p>
                  <p className="mt-1">Agent A: {line.a}</p>
                  <p>Agent B: {line.b}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
      {replay ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#1B1F3B]/40 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4">
            <p className="font-medium">Simulation #{(hash(match.other.id) % 900) + 40}</p>
            <ul className="mt-3 grid gap-2">
              {match.transcript.map((line, index) => (
                <li key={index} className={`rounded-xl px-3 py-2 text-sm ${line.side === "a" ? "bg-[#F8F6F2]" : "bg-[#FFF1EC]"}`}>
                  {line.side === "a" ? "Your agent" : `${match.other.name.split(" ")[0]}'s agent`}: {line.text}
                </li>
              ))}
            </ul>
            <button type="button" className={`${btnGhost} mt-4`} onClick={() => setReplay(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
