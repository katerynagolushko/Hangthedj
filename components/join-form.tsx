"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dictate } from "@/components/dictation";
import { Waveform } from "@/components/waveform";
import { useSession } from "@/components/session";
import { btn, btnGhost, chip, chipOn, field } from "@/components/ui";
import { communities, communityBySlug } from "@/lib/demo";
import type { HnJoinProfile } from "@/lib/hn";

const LOOKING = ["Jobs", "Co-founders", "Co-working spaces", "Feedback", "Investors", "Hires"];
const EMPLOYMENT = ["Founder", "Full-time", "Part-time", "Between roles", "Student"];

export function JoinForm({ initialSlug = "corgi" }: { initialSlug?: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [slug, setSlug] = useState(initialSlug);
  const [name, setName] = useState("Jamie Okonkwo");
  const [provider, setProvider] = useState<"linkedin" | "hn">("linkedin");
  const [linkedin, setLinkedin] = useState("https://www.linkedin.com/in/jamie-okonkwo");
  const [hn, setHn] = useState("jamie");
  const [hnPhase, setHnPhase] = useState<"idle" | "reading" | "done">("idle");
  const [hnProfile, setHnProfile] = useState<HnJoinProfile | null>(null);
  const [hnNote, setHnNote] = useState("");
  const hnRequest = useRef(0);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceLine, setVoiceLine] = useState("");
  const [title, setTitle] = useState("Founder");
  const [company, setCompany] = useState("Hang");
  const [employment, setEmployment] = useState("Founder");
  const [skills, setSkills] = useState("Community products, simulations");
  const [lookingFor, setLookingFor] = useState<string[]>(["Feedback", "Investors"]);
  const community = communityBySlug(slug);
  const lead = slug === "outpost" ? "Samira Shah" : slug === "corgi" ? "Claudia Voss" : "the community lead";

  function toggle(item: string) {
    setLookingFor((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  }

  function applyHn(profile: HnJoinProfile) {
    setHnProfile(profile);
    setHn(profile.handle);
    setName(profile.name);
    setTitle(profile.title);
    setCompany(profile.company);
    setEmployment(profile.employment);
    setSkills(profile.skills);
    setLookingFor(profile.lookingFor);
  }

  async function readHn(raw = hn): Promise<HnJoinProfile | null> {
    const handle = raw.trim().replace(/^@/, "");
    if (!handle) return null;
    const requestId = ++hnRequest.current;
    setHn(handle);
    setHnPhase("reading");
    setHnNote("");
    try {
      const response = await fetch(`/api/hn?user=${encodeURIComponent(handle)}`);
      const data = (await response.json()) as { source?: string; profile?: HnJoinProfile | null };
      if (requestId !== hnRequest.current) return null;
      if (!response.ok || !data.profile) {
        setHnProfile(null);
        setHnPhase("idle");
        setHnNote(`No Hacker News user named ${handle}.`);
        return null;
      }
      applyHn(data.profile);
      setHnPhase("done");
      setHnNote(data.source === "fallback" ? "Hacker News didn't respond. Filled a starter profile." : "");
      return data.profile;
    } catch {
      if (requestId !== hnRequest.current) return null;
      setHnPhase("idle");
      setHnNote("Couldn't reach Hacker News.");
      return null;
    }
  }

  function chooseProvider(next: "linkedin" | "hn") {
    setProvider(next);
    if (next === "hn" && hn.trim()) void readHn(hn);
  }

  function fillByVoice() {
    setVoiceOn(true);
    setVoiceLine("");
    dictate({
      fallback: "I'm a founder at Hang. Skills are community products and simulations. I'm looking for feedback and investors.",
      onPartial: setVoiceLine,
      onDone: (spoken) => {
        setVoiceOn(false);
        setVoiceLine(spoken);
        const lower = spoken.toLowerCase();
        if (lower.includes("founder")) {
          setTitle("Founder");
          setEmployment("Founder");
        }
        const companyMatch = spoken.match(/at ([A-Z][\w&. ]{1,40})/);
        if (companyMatch) setCompany(companyMatch[1].replace(/\.$/, "").trim());
        const skillsMatch = spoken.match(/skills are ([^.]+)/i);
        if (skillsMatch) setSkills(skillsMatch[1].trim());
        const wanted = LOOKING.filter((item) => lower.includes(item.toLowerCase().replace(/s$/, "").slice(0, 6)));
        if (wanted.length) setLookingFor(wanted);
      },
    });
  }

  return (
    <form
      className="mx-auto max-w-xl px-4 py-8"
      onSubmit={async (event) => {
        event.preventDefault();
        const handle = hn.trim().replace(/^@/, "");
        let nextName = name;
        let nextTitle = title;
        let nextCompany = company;
        let nextEmployment = employment;
        let nextSkills = skills;
        let nextLooking = lookingFor;
        let nextAbout = "";
        let nextHandle = handle;
        if (provider === "hn") {
          if (!handle) return;
          const already = hnProfile && hnProfile.handle.toLowerCase() === handle.toLowerCase() && hnPhase === "done";
          if (!already) {
            const profile = await readHn(handle);
            if (!profile) return;
            nextName = profile.name;
            nextTitle = profile.title;
            nextCompany = profile.company;
            nextEmployment = profile.employment;
            nextSkills = profile.skills;
            nextLooking = profile.lookingFor;
            nextAbout = profile.about;
            nextHandle = profile.handle;
          } else if (hnProfile?.about) {
            nextAbout = hnProfile.about;
          }
        }
        update({
          onboarded: true,
          firstName: nextName.trim().split(" ")[0] || "Jamie",
          linkedin: provider === "linkedin" ? linkedin : "",
          hn: provider === "hn" ? nextHandle : "",
          title: nextTitle,
          company: nextCompany,
          employment: nextEmployment,
          skills: nextSkills,
          lookingFor: nextLooking,
          role: nextTitle,
          ...(nextAbout ? { about: nextAbout } : {}),
          homeCommunity: slug,
          joined: [slug],
          approval: "pending",
        });
        router.push(`/c/${slug}`);
      }}
    >
      <p className="text-sm text-[#FF5A24]">Join {community?.name ?? "a community"}</p>
      <h1 className="mt-2 text-4xl font-bold">Your profile</h1>
      <p className="mt-2 text-sm text-[#6B6B6B]">
        {community?.name ?? "The community"} reviews this before you can ask around. {lead} approves new members.
      </p>
      <label className="mt-5 block text-sm">Community</label>
      <select className={`${field} mt-1`} value={slug} onChange={(event) => setSlug(event.target.value)}>
        {communities.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.name}
          </option>
        ))}
      </select>
      <label className="mt-3 block text-sm">Name</label>
      <input className={`${field} mt-1`} value={name} onChange={(event) => setName(event.target.value)} required />
      <p className="mt-4 text-sm">Join with</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <button type="button" className={`${provider === "linkedin" ? btn : btnGhost} w-full`} aria-pressed={provider === "linkedin"} onClick={() => chooseProvider("linkedin")}>
          Continue with LinkedIn
        </button>
        <button type="button" className={`${provider === "hn" ? btn : btnGhost} w-full`} aria-pressed={provider === "hn"} onClick={() => chooseProvider("hn")}>
          Continue with Hacker News
        </button>
      </div>
      {provider === "linkedin" ? (
        <label className="mt-3 block text-sm">
          LinkedIn URL
          <input className={`${field} mt-1`} value={linkedin} onChange={(event) => setLinkedin(event.target.value)} aria-label="LinkedIn URL" required />
        </label>
      ) : (
        <label className="mt-3 block text-sm">
          Hacker News username
          <input
            className={`${field} mt-1`}
            value={hn}
            onChange={(event) => {
              hnRequest.current += 1;
              setHn(event.target.value);
              setHnPhase("idle");
              setHnProfile(null);
              setHnNote("");
            }}
            placeholder="jamie"
            aria-label="Hacker News username"
            required
          />
        </label>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {provider === "hn" ? (
          <button type="button" className={btnGhost} onClick={() => void readHn()} disabled={!hn.trim() || hnPhase === "reading"}>
            {hnPhase === "reading" ? "Reading your HN" : "Fill profile from Hacker News"}
          </button>
        ) : null}
        <button type="button" className={btnNavyMic()} onClick={fillByVoice}>
          <Waveform live={voiceOn} />
          Fill my profile by voice
        </button>
      </div>
      {voiceLine ? <p className="mt-2 text-sm text-[#6B6B6B]">Heard: {voiceLine}</p> : null}
      {hnNote ? <p className="mt-2 text-sm text-[#6B6B6B]">{hnNote}</p> : null}
      {provider === "hn" && hnPhase !== "idle" ? (
        <div className="mt-3 rounded-xl border border-[#E4E0D8] bg-[#F8F6F2] p-3">
          <p className="text-sm font-medium">{hnPhase === "reading" ? "Reading your HN" : `HN · ${hnProfile?.handle || hn}`}</p>
          {hnPhase === "done" && hnProfile ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {hnProfile.karma != null ? <span className={chip}>Karma {hnProfile.karma.toLocaleString("en-US")}</span> : null}
              {hnProfile.about ? <span className={chip}>About: {hnProfile.about}</span> : null}
              {hnProfile.posts.map((post) => (
                <span key={post} className={chip}>
                  Posted {post}
                </span>
              ))}
              {hnProfile.comments.map((comment) => (
                <span key={comment} className={chip}>
                  Comment: {comment}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#6B6B6B]">Karma, about, and the posts you actually wrote.</p>
          )}
        </div>
      ) : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Job title
          <input className={`${field} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label className="text-sm">
          Company
          <input className={`${field} mt-1`} value={company} onChange={(event) => setCompany(event.target.value)} required />
        </label>
      </div>
      <label className="mt-3 block text-sm">Employment status</label>
      <select className={`${field} mt-1`} value={employment} onChange={(event) => setEmployment(event.target.value)}>
        {EMPLOYMENT.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <label className="mt-3 block text-sm">Skills</label>
      <input className={`${field} mt-1`} value={skills} onChange={(event) => setSkills(event.target.value)} />
      <p className="mt-4 text-sm">I&apos;m looking for</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {LOOKING.map((item) => (
          <button key={item} type="button" className={lookingFor.includes(item) ? chipOn : chip} onClick={() => toggle(item)}>
            {item}
          </button>
        ))}
      </div>
      <button type="submit" className={`${btn} mt-6`}>
        Submit for approval
      </button>
    </form>
  );
}

function btnNavyMic() {
  return "inline-flex items-center gap-2 rounded-[10px] bg-[#1B1F3B] px-4 py-2.5 text-sm font-medium text-white";
}
