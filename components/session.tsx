"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getDemoUser, type Profile } from "@/lib/demo";

export type CreatedCommunity = { slug: string; name: string; blurb: string };

export type Session = {
  firstName: string;
  role: string;
  linkedin: string;
  hn: string;
  about: string;
  goals: string[];
  offers: string;
  needs: string;
  communities: string[];
  onboarded: boolean;
  pairs: string[];
  hangingOut: boolean;
  joined: string[];
  blocked: string[];
  reported: string[];
  asked: string[];
  intros: string[];
  created: CreatedCommunity | null;
  approval: "none" | "pending" | "approved" | "rejected";
  homeCommunity: string;
  title: string;
  company: string;
  employment: string;
  skills: string;
  lookingFor: string[];
  decisions: Record<string, "accepted" | "declined">;
  threads: Record<string, { side: "you" | "them"; text: string }[]>;
};

const EMPTY: Session = {
  firstName: "",
  role: "",
  linkedin: "",
  hn: "",
  about: "",
  goals: [],
  offers: "",
  needs: "",
  communities: [],
  onboarded: false,
  pairs: [],
  hangingOut: false,
  joined: [],
  blocked: [],
  reported: [],
  asked: [],
  intros: [],
  created: null,
  approval: "none",
  homeCommunity: "",
  title: "",
  company: "",
  employment: "",
  skills: "",
  lookingFor: [],
  decisions: {},
  threads: {},
};

const KEY = "hang-demo-session";

const SessionContext = createContext<{
  session: Session;
  save: (next: Partial<Session>) => void;
  update: (partial: Partial<Session>) => void;
} | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(EMPTY);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Session>;
      setSession({
        ...EMPTY,
        ...parsed,
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        communities: Array.isArray(parsed.communities) ? parsed.communities : [],
        pairs: Array.isArray(parsed.pairs) ? parsed.pairs : [],
        joined: Array.isArray(parsed.joined) ? parsed.joined : [],
        blocked: Array.isArray(parsed.blocked) ? parsed.blocked : [],
        reported: Array.isArray(parsed.reported) ? parsed.reported : [],
        asked: Array.isArray(parsed.asked) ? parsed.asked : [],
        intros: Array.isArray(parsed.intros) ? parsed.intros : [],
        created: parsed.created && typeof parsed.created === "object" ? parsed.created : null,
        approval: parsed.approval === "pending" || parsed.approval === "approved" || parsed.approval === "rejected" ? parsed.approval : "none",
        homeCommunity: typeof parsed.homeCommunity === "string" ? parsed.homeCommunity : "",
        title: typeof parsed.title === "string" ? parsed.title : "",
        company: typeof parsed.company === "string" ? parsed.company : "",
        employment: typeof parsed.employment === "string" ? parsed.employment : "",
        skills: typeof parsed.skills === "string" ? parsed.skills : "",
        lookingFor: Array.isArray(parsed.lookingFor) ? parsed.lookingFor : [],
        hn: typeof parsed.hn === "string" ? parsed.hn : "",
        decisions: parsed.decisions && typeof parsed.decisions === "object" ? parsed.decisions : {},
        threads: parsed.threads && typeof parsed.threads === "object" ? parsed.threads : {},
      });
    } catch {
      /* demo session is optional */
    }
  }, []);

  function persist(next: Session) {
    setSession(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  function save(next: Partial<Session>) {
    setSession((current) => {
      const merged = { ...current, ...next };
      localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    });
  }

  function update(partial: Partial<Session>) {
    setSession((current) => {
      const next = { ...current, ...partial };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <SessionContext.Provider value={{ session, save, update }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

export function useViewer(): Profile {
  const { session } = useSession();
  const base = getDemoUser();
  if (!session.onboarded) return base;
  const first = session.firstName.trim();
  const rest = base.name.split(" ").slice(1).join(" ");
  return {
    ...base,
    name: first ? `${first}${rest ? ` ${rest}` : ""}` : base.name,
    linkedin: session.linkedin || base.linkedin,
    about: session.about || base.about,
    goals: session.goals.length ? session.goals : base.goals,
    offers: session.offers || base.offers,
    needs: session.needs || base.needs,
    communities: [...base.communities, ...session.joined.filter((slug) => !base.communities.includes(slug))],
    role: session.role || base.role,
  };
}
