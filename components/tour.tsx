"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { useSession } from "@/components/session";
import { btn, chip, chipOn, field } from "@/components/ui";
import { communities, getDemoUser, GOAL_LABEL } from "@/lib/demo";

const ROLES = ["Founder", "Operator", "Investor", "Freelancer", "Engineer", "Designer"];
const TOTAL = 7;

export function Tour({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { save } = useSession();
  const demo = getDemoUser();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(demo.name.split(" ")[0]);
  const [role, setRole] = useState("Founder");
  const [goals, setGoals] = useState<string[]>(demo.goals);
  const [linkedin, setLinkedin] = useState(demo.linkedin ?? "https://www.linkedin.com/in/jamie-okonkwo");
  const [offers, setOffers] = useState(demo.offers);
  const [needs, setNeeds] = useState(demo.needs);
  const [picked, setPicked] = useState<string[]>(demo.communities);
  const [error, setError] = useState("");

  function toggle(list: string[], value: string, set: (next: string[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function skip() {
    if (onClose) onClose();
    else router.push("/");
  }

  function finish() {
    save({
      firstName: firstName.trim() || demo.name.split(" ")[0],
      role,
      linkedin: linkedin.trim(),
      about: demo.about ?? "",
      goals,
      offers: offers.trim(),
      needs: needs.trim(),
      communities: picked,
      onboarded: true,
      pairs: [],
      hangingOut: false,
    });
    router.push("/meeting");
  }

  function next() {
    if (step === 0 && firstName.trim().length < 2) {
      setError("A first name is enough.");
      return;
    }
    if (step === 1 && !role) {
      setError("Pick one. You can change it later.");
      return;
    }
    if (step === 2 && goals.length === 0) {
      setError("Pick at least one reason you're here.");
      return;
    }
    if (step === 3 && linkedin.trim().length < 8) {
      setError("Paste a LinkedIn URL, even a rough one.");
      return;
    }
    if (step === 4 && offers.trim().length < 4) {
      setError("One concrete thing you can offer.");
      return;
    }
    if (step === 5 && needs.trim().length < 4) {
      setError("What would make the walk across the room worth it?");
      return;
    }
    if (step === 6 && picked.length === 0) {
      setError("Pick a room you're actually in.");
      return;
    }
    setError("");
    if (step === 6) finish();
    else setStep((value) => value + 1);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1B1F3B]/45 p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-[#F8F6F2] shadow-[0_20px_60px_rgba(27,31,59,0.2)]">
        <header className="flex items-center justify-between gap-3 bg-[#1B1F3B] px-4 py-3 text-white">
          <Logo light />
          <p className="text-sm">
            {step + 1} / {TOTAL}
          </p>
          <button type="button" onClick={skip} className="text-sm text-white/80 hover:text-white">
            Skip
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {step === 0 ? (
            <label className="grid gap-3">
              <span className="text-2xl font-bold">What should we call you?</span>
              <input className={field} value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </label>
          ) : null}
          {step === 1 ? (
            <div>
              <h2 className="text-2xl font-bold">I am a</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {ROLES.map((item) => (
                  <button key={item} type="button" className={role === item ? chipOn : chip} onClick={() => setRole(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {step === 2 ? (
            <div>
              <h2 className="text-2xl font-bold">What are you here for?</h2>
              <p className="mt-1 text-sm text-[#6B6B6B]">Pick any that are true this month.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(GOAL_LABEL).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={goals.includes(id) ? chipOn : chip}
                    onClick={() => toggle(goals, id, setGoals)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {step === 3 ? (
            <label className="grid gap-3">
              <span className="text-2xl font-bold">Paste your LinkedIn</span>
              <span className="text-sm text-[#6B6B6B]">Your agent reads it. We don&apos;t. It stays in this browser.</span>
              <input className={field} value={linkedin} onChange={(event) => setLinkedin(event.target.value)} />
            </label>
          ) : null}
          {step === 4 ? (
            <label className="grid gap-3">
              <span className="text-2xl font-bold">What can you actually help with?</span>
              <textarea className={`${field} min-h-28`} value={offers} onChange={(event) => setOffers(event.target.value)} />
            </label>
          ) : null}
          {step === 5 ? (
            <label className="grid gap-3">
              <span className="text-2xl font-bold">What are you hoping someone has?</span>
              <textarea className={`${field} min-h-28`} value={needs} onChange={(event) => setNeeds(event.target.value)} />
            </label>
          ) : null}
          {step === 6 ? (
            <div>
              <h2 className="text-2xl font-bold">Which rooms are you in?</h2>
              <p className="mt-1 text-sm text-[#6B6B6B]">Communities, not every group chat you muted.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {communities.map((community) => (
                  <button
                    key={community.slug}
                    type="button"
                    className={picked.includes(community.slug) ? chipOn : chip}
                    onClick={() => toggle(picked, community.slug, setPicked)}
                  >
                    {community.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {error ? <p className="mt-4 text-sm text-[#FF5A24]">{error}</p> : null}
        </div>
        <footer className="flex gap-3 border-t border-[#E4E0D8] px-5 py-4">
          <button
            type="button"
            className="rounded-[10px] border border-[#E4E0D8] bg-white px-4 py-2.5 text-sm"
            onClick={() => {
              setError("");
              if (step === 0) skip();
              else setStep((value) => value - 1);
            }}
          >
            Back
          </button>
          <button type="button" className={`${btn} flex-1`} onClick={next}>
            {step === 6 ? "Meet people" : "Next"}
          </button>
        </footer>
      </div>
    </div>
  );
}
