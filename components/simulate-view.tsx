"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Page } from "@/components/chrome";
import { MatchCard } from "@/components/match-card";
import { ReplayChat } from "@/components/replay-chat";
import { useViewer } from "@/components/session";
import { SimGrid } from "@/components/sim-grid";
import { btnGhost, card } from "@/components/ui";
import { buildPattern, matchesFor, type Line } from "@/lib/demo";

type LiveVerdict = {
  bothWantToMeet: boolean;
  synergy: string;
  icebreaker: string;
  summary: string;
};

type LiveResult = {
  source: "live" | "fallback";
  reason?: string;
  lines: Line[];
  verdict?: LiveVerdict;
};

export function SimulateView() {
  const user = useViewer();
  const viewerKey = `${user.id}|${user.name}|${user.goals.join(",")}|${user.offers}|${user.needs}`;
  const userRef = useRef(user);
  userRef.current = user;
  const matches = useMemo(() => matchesFor(userRef.current), [viewerKey]);
  const [selectedId, setSelectedId] = useState(matches[0]?.other.id ?? "");
  const [runId, setRunId] = useState(0);
  const [seen, setSeen] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [live, setLive] = useState(false);
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null);
  const [liveState, setLiveState] = useState<"idle" | "loading" | "ready">("idle");

  const match = matches.find((item) => item.other.id === selectedId) ?? matches[0];
  const transcriptRef = useRef(match?.transcript ?? []);
  transcriptRef.current = match?.transcript ?? [];

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("with");
    if (id && matches.some((item) => item.other.id === id)) setSelectedId(id);
    // Only the first paint should honour ?with=, so a later match refresh cannot restart the run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pattern = useMemo(
    () => (match ? buildPattern(`${match.other.id}:${runId}`, match.hits) : []),
    [match?.other.id, match?.hits, runId],
  );
  const greens = pattern.slice(0, seen).filter(Boolean).length;
  const livePercent = Math.round((greens / 50) * 100);
  const running = seen > 0 && seen < 50;

  useEffect(() => {
    if (!revealed || !live || !match) {
      setLiveState("idle");
      setLiveResult(null);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8500);
    setLiveState("loading");
    setLiveResult(null);
    fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        profileId: match.other.id,
        viewer: {
          name: user.name,
          about: user.about,
          goals: user.goals,
          offers: user.offers,
          needs: user.needs,
        },
      }),
    })
      .then((response) => response.json())
      .then((data: LiveResult) => {
        if (cancelled) return;
        if (Array.isArray(data.lines) && data.lines.length > 0) setLiveResult(data);
        else setLiveResult({ source: "fallback", reason: "error", lines: transcriptRef.current });
      })
      .catch(() => {
        if (cancelled) return;
        setLiveResult({ source: "fallback", reason: "timeout", lines: transcriptRef.current });
      })
      .finally(() => {
        if (cancelled) return;
        clearTimeout(timer);
        setLiveState("ready");
      });
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [revealed, live, match?.other.id, runId, user.name, user.about, user.goals, user.offers, user.needs]);

  function pick(id: string) {
    setRevealed(false);
    setSeen(0);
    setLiveResult(null);
    setSelectedId(id);
    setRunId((value) => value + 1);
  }

  if (!match) return null;

  const scripted = renameLines(match.transcript, "Jamie", user.name.split(" ")[0]);
  const lines = live && liveResult?.lines?.length ? renameLines(liveResult.lines, "Jamie", user.name.split(" ")[0]) : scripted;
  const caption =
    !live
      ? "Scripted chat"
      : liveState === "loading"
        ? "Asking the agents. If this takes more than a few seconds, you'll get the scripted one."
        : liveResult?.source === "live"
          ? "Live chat"
          : liveResult?.reason === "no_key"
            ? "Scripted chat. Add ANTHROPIC_API_KEY on the server to go live."
            : "Scripted chat. The live one didn't make it back in time.";

  return (
    <Page wide>
      <p className="text-sm text-[#6B6B6B]">50 simulations in this preview. A full run is 1,000.</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="max-w-3xl text-4xl font-bold">
          {user.name.split(" ")[0]}&apos;s agent is talking to {match.other.name.split(" ")[0]}&apos;s.
        </h1>
        <button type="button" disabled={running} onClick={() => pick(match.other.id)} className={btnGhost}>
          Replay
        </button>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm text-[#6B6B6B]">
        <input
          type="checkbox"
          className="mt-1"
          checked={live}
          onChange={(event) => {
            setLive(event.target.checked);
            setLiveResult(null);
          }}
        />
        <span>
          Live simulation. The key stays on the server. If it&apos;s missing, fails, or takes more than 8
          seconds, you still get the scripted chat. The score doesn&apos;t change.
        </span>
      </label>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {matches.map((item) => {
          const active = item.other.id === match.other.id;
          return (
            <button
              key={item.other.id}
              type="button"
              onClick={() => pick(item.other.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-2 py-1 pr-3 text-left text-sm ${
                active ? "border-[#1B1F3B] bg-[#1B1F3B] text-white" : "border-[#E4E0D8] bg-white"
              }`}
            >
              <Avatar person={item.other} className="h-7 w-7" />
              <span>{item.other.name.split(" ")[0]}</span>
              <span className={active ? "text-white/70" : "text-[#FF5A24]"}>{item.percent}%</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid items-center gap-6 lg:grid-cols-[200px_1fr]">
        <div>
          <p className="text-6xl font-bold">
            {livePercent}
            <span className="text-2xl text-[#6B6B6B]">%</span>
          </p>
          <p className="mt-2 text-sm">
            {greens}/50 {seen >= 50 ? `clicked` : "and climbing"}
          </p>
          <p className="mt-1 text-xs text-[#6B6B6B]">{seen}/50 finished</p>
        </div>
        <div className={`${card} p-4`}>
          <SimGrid
            key={`${match.other.id}:${runId}`}
            pattern={pattern}
            onProgress={setSeen}
            onDone={() => setRevealed(true)}
          />
        </div>
      </div>

      {revealed ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <MatchCard self={user} match={match} />
          <div>
            <p className="mb-2 text-sm text-[#6B6B6B]">{caption}</p>
            {live && liveResult?.source === "live" && liveResult.verdict ? (
              <p className="mb-2 text-sm">
                Verdict: {liveResult.verdict.bothWantToMeet ? "both want the meeting" : "not a mutual yes"}
                {" · "}
                {liveResult.verdict.synergy}
              </p>
            ) : null}
            {live && liveState === "loading" ? (
              <p className={`${card} p-4 text-sm`}>Writing a short conversation…</p>
            ) : (
              <ReplayChat
                key={`${match.other.id}-${runId}-${liveResult?.source ?? "script"}`}
                lines={lines}
                selfName={user.name.split(" ")[0]}
                otherName={match.other.name.split(" ")[0]}
              />
            )}
          </div>
        </div>
      ) : null}
    </Page>
  );
}

function renameLines(lines: Line[], from: string, to: string) {
  if (!to || from === to) return lines;
  return lines.map((line) => ({ ...line, text: line.text.replaceAll(from, to) }));
}
