"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { dictate } from "@/components/dictation";
import { MeetSheet } from "@/components/meet-sheet";
import { Waveform } from "@/components/waveform";
import { useSession } from "@/components/session";
import { btn, btnGhost, field } from "@/components/ui";
import { hnPeople, type HnStory } from "@/lib/hn";
import {
  askCommunity,
  communityBySlug,
  communityName,
  getDemoUser,
  promptsFor,
  roleCompany,
  type Match,
  type WarmPath,
} from "@/lib/demo";

const ALREADY_IN = new Set(["p3", "p5", "p6", "p9", "p1", "p7"]);

function leadName(slug: string) {
  if (slug === "outpost") return "Samira Shah";
  if (slug === "corgi") return "Claudia Voss";
  if (slug === "angel-row") return "Samira Shah";
  return "the community lead";
}

type Result = { inside: { match: Match }[]; outside: { match: Match }[]; warm: WarmPath | null };

export function SearchView({ slug }: { slug: string }) {
  const router = useRouter();
  const { session, update } = useSession();
  const community = communityBySlug(slug);
  const viewer = getDemoUser();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [meet, setMeet] = useState<Match | null>(null);
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState("");
  const [stories, setStories] = useState<HnStory[]>([]);
  const [storySource, setStorySource] = useState<"live" | "fallback" | "">("");

  function run(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    setText(trimmed);
    setNote("");
    const asked = askCommunity(viewer, slug, trimmed);
    setResult({
      inside: asked.inside.map((row) => ({ match: row.match })),
      outside: asked.outside.map((row) => ({ match: row.match })),
      warm: asked.warm,
    });
    update({ asked: [...session.asked, trimmed] });
    fetch(`/api/hn?q=${encodeURIComponent(trimmed)}`)
      .then((response) => response.json())
      .then((data: { source?: "live" | "fallback"; hits?: HnStory[] }) => {
        setStories(Array.isArray(data.hits) ? data.hits : []);
        setStorySource(data.source === "live" ? "live" : "fallback");
      })
      .catch(() => {
        setStories([]);
        setStorySource("fallback");
      });
  }

  function listen() {
    setListening(true);
    setNote("");
    dictate({
      fallback: "I need a robotics hardware investor",
      onPartial: setText,
      onDone: (spoken, source) => {
        setListening(false);
        if (source === "fallback") setNote("No mic here. Typed a sample line instead.");
        run(spoken);
      },
    });
  }

  function accept(match: Match) {
    const decisions = { ...session.decisions, [match.other.id]: "accepted" as const };
    const mutual = ALREADY_IN.has(match.other.id);
    const threads = { ...session.threads };
    if (mutual) {
      threads[match.other.id] = [
        { side: "them", text: `I'm in. ${match.synergy} seems like the actual reason to talk.` },
        { side: "you", text: "Same. Let's keep it specific." },
      ];
    }
    update({ decisions, threads });
    if (mutual) router.push(`/thread/${match.other.id}`);
  }

  function decline(id: string) {
    update({ decisions: { ...session.decisions, [id]: "declined" } });
    setNote("Passed. They won't know if you pass.");
  }

  const name = community?.name ?? "this community";
  const approval = session.homeCommunity === slug ? session.approval : "none";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center gap-3">
        <Avatar person={{ id: "agent", name: "Ask", avatar: 0 }} className="h-12 w-12" />
        <div>
          <p className="text-sm text-[#6B6B6B]">Ask {name}</p>
          <h1 className="text-3xl font-bold">Who do you need?</h1>
        </div>
      </div>
      {approval === "pending" ? (
        <p className="mt-4 rounded-xl border border-[#E4E0D8] bg-white px-4 py-3 text-sm">
          Pending approval by {leadName(slug)}.
        </p>
      ) : null}
      {approval === "approved" ? (
        <p className="mt-4 rounded-xl border border-[#E4E0D8] bg-white px-4 py-3 text-sm text-[#22C27A]">Approved.</p>
      ) : null}
      {approval === "rejected" ? (
        <p className="mt-4 rounded-xl border border-[#E4E0D8] bg-white px-4 py-3 text-sm">
          {leadName(slug)} has not approved this profile.
        </p>
      ) : null}
      <div className="mt-6 flex flex-col items-center">
        <button
          type="button"
          onClick={listen}
          aria-label="Speak your question"
          className={`grid h-24 w-24 place-items-center rounded-full bg-[#1B1F3B] text-white shadow-[0_10px_24px_rgba(27,31,59,0.18)] ${
            listening ? "ring-8 ring-[#FF5A24]/40" : ""
          }`}
        >
          <Waveform live={listening} />
        </button>
        <p className="mt-3 text-sm text-[#6B6B6B]">{listening ? "Listening" : "Ask out loud"}</p>
        <p className="mt-1 min-h-7 text-center text-lg">{text || "The transcript shows up here."}</p>
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          run(text);
        }}
      >
        <input className={field} value={text} placeholder={`Or type it`} onChange={(event) => setText(event.target.value)} />
        <button type="submit" className={btn}>
          Ask
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {promptsFor(slug).map((prompt) => (
          <button key={prompt} type="button" className={btnGhost} onClick={() => run(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
      {note ? <p className="mt-3 text-sm text-[#6B6B6B]">{note}</p> : null}
      {result ? <HnStrip query={text} stories={stories} source={storySource} /> : null}
      {result?.warm ? (
        <WarmPathBlock
          path={result.warm}
          communityName={name}
          onMeet={setMeet}
          onAccept={accept}
          onDecline={decline}
          decision={session.decisions[result.warm.target.other.id]}
          onIntro={() => setDraft(introText(name, result.warm!))}
        />
      ) : null}
      {result && !result.warm ? (
        <>
          <Section title={`In ${name}`}>
            {result.inside.length === 0 ? <p className="text-sm text-[#6B6B6B]">Nobody here fits.</p> : null}
            {result.inside.map((row) => (
              <MatchRow
                key={row.match.other.id}
                match={row.match}
                decision={session.decisions[row.match.other.id]}
                onAccept={accept}
                onDecline={decline}
                onMeet={setMeet}
              />
            ))}
          </Section>
          <Section title="Across communities">
            {result.outside.map((row) => (
              <MatchRow
                key={row.match.other.id}
                match={row.match}
                decision={session.decisions[row.match.other.id]}
                onAccept={accept}
                onDecline={decline}
                onMeet={setMeet}
              />
            ))}
          </Section>
        </>
      ) : null}
      {meet ? <MeetSheet viewerId={viewer.id} match={meet} onClose={() => setMeet(null)} /> : null}
      {draft ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1B1F3B]/40 p-4">
          <form
            className="w-full max-w-lg rounded-xl bg-white p-4"
            onSubmit={(event) => {
              event.preventDefault();
              update({ intros: [...session.intros, draft] });
              setDraft("");
              setToast("Intro request sent to Claudia");
              window.setTimeout(() => setToast(""), 2500);
            }}
          >
            <p className="font-medium">Ask Claudia for an intro</p>
            <textarea className={`${field} mt-3 h-40`} value={draft} onChange={(event) => setDraft(event.target.value)} />
            <div className="mt-3 flex gap-2">
              <button type="submit" className={btn}>
                Send
              </button>
              <button type="button" className={btnGhost} onClick={() => setDraft("")}>
                Close
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {toast ? <p className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#1B1F3B] px-4 py-2 text-sm text-white">{toast}</p> : null}
      <p className="mt-6 text-xs text-[#6B6B6B]">
        <Link href="/inbox" className="underline">
          Open chats
        </Link>
        . Contact details stay hidden until you both accept.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-3 grid gap-3">{children}</div>
    </section>
  );
}

function MatchRow({
  match,
  decision,
  onAccept,
  onDecline,
  onMeet,
}: {
  match: Match;
  decision?: "accepted" | "declined";
  onAccept: (match: Match) => void;
  onDecline: (id: string) => void;
  onMeet: (match: Match) => void;
}) {
  if (decision === "declined") return null;
  const { role, company } = roleCompany(match.other.headline);
  const mutual = decision === "accepted" && ALREADY_IN.has(match.other.id);
  const waiting = decision === "accepted" && !mutual;
  return (
    <article className="rounded-xl border border-[#E4E0D8] bg-white p-4">
      <div className="flex gap-3">
        <Avatar person={match.other} className="h-14 w-14" />
        <div>
          <p className="font-bold">{match.other.name}</p>
          <p className="text-sm text-[#6B6B6B]">
            {role}
            {company ? ` · ${company}` : ""}
          </p>
          <p className="text-sm text-[#FF5A24]">
            {match.percent}% · clicked {match.hits}/50
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm">{match.synergy}</p>
      <p className="mt-1 text-xs text-[#6B6B6B]">Why this match: {match.icebreaker}</p>
      <p className="mt-1 text-xs text-[#6B6B6B]">{match.other.communities.map(communityName).join(" · ")}</p>
      <p className="mt-2 text-xs text-[#6B6B6B]">They won&apos;t know if you pass.</p>
      {waiting ? <p className="mt-2 text-sm">Pending. They have not accepted yet.</p> : null}
      {mutual ? <p className="mt-2 text-sm text-[#22C27A]">You both accepted.</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => onAccept(match)}>
          Accept
        </button>
        <button type="button" className={btnGhost} onClick={() => onDecline(match.other.id)}>
          Decline
        </button>
        <button type="button" className={btnGhost} onClick={() => onMeet(match)}>
          Meet nearby
        </button>
      </div>
    </article>
  );
}

function WarmPathBlock({
  path,
  communityName: name,
  onMeet,
  onAccept,
  onDecline,
  decision,
  onIntro,
}: {
  path: WarmPath;
  communityName: string;
  onMeet: (match: Match) => void;
  onAccept: (match: Match) => void;
  onDecline: (id: string) => void;
  decision?: "accepted" | "declined";
  onIntro: () => void;
}) {
  return (
    <section className="mt-6 rounded-xl border border-[#E4E0D8] bg-white p-4">
      <p className="font-medium">Nobody in {name} fits, but here&apos;s the warmest way in.</p>
      <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
        <PathStep name="You" detail="Member" id="team-jamie" />
        <PathStep name={path.manager.name.split(" ")[0]} detail={`${name} lead`} id={path.manager.id} />
        <PathStep name={path.partnerManager.name.split(" ")[0]} detail={communityName(path.partnerCommunity)} id={path.partnerManager.id} />
        <PathStep name={path.target.other.name.split(" ")[0]} detail={roleCompany(path.target.other.headline).role} id={path.target.other.id} />
      </ol>
      <p className="mt-3 text-sm text-[#FF5A24]">{path.strength}</p>
      <button type="button" className={`${btn} mt-3`} onClick={onIntro}>
        Ask {path.manager.name.split(" ")[0]} for an intro
      </button>
      <p className="mt-2 text-xs text-[#6B6B6B]">Their contact stays hidden until they opt in.</p>
      <div className="mt-4">
        <MatchRow match={path.target} decision={decision} onAccept={onAccept} onDecline={onDecline} onMeet={onMeet} />
      </div>
    </section>
  );
}

function PathStep({ name, detail, id }: { name: string; detail: string; id: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg bg-[#F8F6F2] px-2 py-2">
      <Avatar person={{ id, name, avatar: 0 }} className="h-9 w-9" />
      <span>
        <span className="block font-medium">{name}</span>
        <span className="block text-xs text-[#6B6B6B]">{detail}</span>
      </span>
    </li>
  );
}

function HnStrip({ query, stories, source }: { query: string; stories: HnStory[]; source: string }) {
  const people = hnPeople(query);
  return (
    <>
      <Section title="From Hacker News">
        {people.map((person) => (
          <article key={person.handle} className="rounded-xl border border-[#E4E0D8] bg-white p-4">
            <p className="text-xs text-[#FF5A24]">{person.thread}</p>
            <p className="mt-1 font-medium">
              {person.name} <span className="text-[#6B6B6B]">({person.handle})</span>
            </p>
            <a href={person.href} className="mt-1 block text-sm underline" target="_blank" rel="noreferrer">
              {person.itemTitle}
            </a>
            <p className="mt-2 text-sm text-[#6B6B6B]">Why they fit: {person.why}</p>
            <p className="mt-1 text-xs text-[#6B6B6B]">Fictional HN regular. The link is styled like an item, not a live profile.</p>
          </article>
        ))}
      </Section>
      <Section title="Related on HN">
        {stories.length === 0 ? <p className="text-sm text-[#6B6B6B]">Looking up stories…</p> : null}
        {stories.map((story) => (
          <a key={story.url} href={story.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-[#E4E0D8] bg-[#F8F6F2] px-4 py-3">
            <span className="block text-sm font-medium">{story.title}</span>
            <span className="mt-1 block text-xs text-[#6B6B6B]">
              {story.points} points · {story.author} · news.ycombinator.com
              {source === "fallback" ? " · saved list" : ""}
            </span>
          </a>
        ))}
      </Section>
    </>
  );
}

function introText(community: string, path: WarmPath) {
  const first = path.manager.name.split(" ")[0];
  return `Hi ${first},\n\nI'm in ${community}. Nobody here fits, and you co-hosted 3 events with ${path.partnerManager.name.split(" ")[0]} at ${communityName(path.partnerCommunity)}.\n\nCould you intro me to ${path.target.other.name}? Please don't share their contact unless they opt in.\n\nJamie`;
}
