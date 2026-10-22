import seedJson from "@/data/seed.json";
import teamJson from "@/data/team.json";
import synergiesJson from "@/data/synergies.json";
import transcriptsJson from "@/data/transcripts.json";

export type Profile = {
  id: string;
  name: string;
  headline: string;
  goals: string[];
  offers: string;
  needs: string;
  communities: string[];
  events: string[];
  linkedin?: string;
  about?: string;
  role?: string;
  isTeam?: boolean;
  isPrimary?: boolean;
  avatar: number;
};

export type Community = {
  slug: string;
  name: string;
  type: string;
  blurb: string;
  accent: string;
  count: number;
  mark: string;
};
export type HangEvent = { id: string; title: string; date: string; venue: string };

export type Line = { side: "a" | "b"; text: string };

export type Match = {
  other: Profile;
  hits: number;
  total: number;
  percent: number;
  fullHits: number;
  synergy: string;
  detail: string;
  icebreaker: string;
  transcript: Line[];
};

type Crafted = {
  hits: number;
  synergy: string;
  detail: string;
  icebreaker: string;
};

const AVATARS: Record<string, number> = {
  "team-jamie": 60,
  "team-sam": 11,
  "team-noor": 26,
  p1: 47,
  p2: 12,
  p3: 45,
  p4: 15,
  p5: 44,
  p6: 33,
  p7: 25,
  p8: 68,
  p9: 32,
  p10: 52,
  p11: 49,
  p12: 59,
  p13: 28,
  p14: 39,
};

export const GOAL_LABEL: Record<string, string> = {
  fundraising: "Fundraising",
  hiring: "Hiring",
  job_hunting: "Job hunting",
  investing: "Investing",
  cofounder: "Cofounder",
  customers: "Customers",
};

const BRAND: Record<string, Omit<Community, "slug" | "name" | "type">> = {
  "signal-room": {
    blurb: "People shipping models in London. Demos over decks.",
    accent: "#3C4FBF",
    count: 812,
    mark: "SR",
  },
  "founders-den": {
    blurb: "Early-stage founders who would rather meet than post.",
    accent: "#FF5A24",
    count: 640,
    mark: "FD",
  },
  corgi: {
    blurb: "A Clerkenwell cafe community. About 100 regulars, desks, and the occasional investor.",
    accent: "#C46B3A",
    count: 100,
    mark: "CO",
  },
  outpost: {
    blurb: "Hardware builders and the investors who still visit the workshop.",
    accent: "#0F6E56",
    count: 140,
    mark: "OP",
  },
  "angel-row": {
    blurb: "Angels and scouts who still take the meeting.",
    accent: "#1B1F3B",
    count: 190,
    mark: "AR",
  },
};

const seed = seedJson as {
  communities: { slug: string; name: string; type: string }[];
  events: HangEvent[];
  profiles: Omit<Profile, "avatar" | "isTeam" | "isPrimary">[];
};

const team = teamJson as {
  members: Omit<Profile, "avatar">[];
};

const craftedById = synergiesJson as Record<string, Crafted>;
const transcripts = transcriptsJson as Record<string, Line[]>;

function asProfile(
  raw: Omit<Profile, "avatar">,
  extra?: Partial<Profile>,
): Profile {
  return {
    ...raw,
    avatar: AVATARS[raw.id] ?? 15,
    goals: [...raw.goals],
    communities: [...raw.communities],
    events: [...raw.events],
    ...extra,
  };
}

export const communities: Community[] = seed.communities.map((community) => ({
  ...community,
  ...(BRAND[community.slug] ?? {
    blurb: community.type,
    accent: "#1B1F3B",
    count: 80,
    mark: community.name.slice(0, 2).toUpperCase(),
  }),
}));
export const events: HangEvent[] = seed.events;

const PEOPLE: Profile[] = [
  ...team.members.map((member) =>
    asProfile(member, { isTeam: true, isPrimary: Boolean(member.isPrimary) }),
  ),
  ...seed.profiles.map((profile) => asProfile(profile)),
];

const DEMO = PEOPLE.find((person) => person.isPrimary) ?? PEOPLE[0];

export function getDemoUser() {
  return DEMO;
}

export function allPeople() {
  return PEOPLE;
}

export function personById(id: string) {
  return PEOPLE.find((person) => person.id === id);
}

export function communityName(slug: string) {
  return communities.find((community) => community.slug === slug)?.name ?? slug;
}

export function formatWhen(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function buildPattern(seedKey: string, hits: number, total = 50) {
  const pattern = Array.from({ length: total }, (_, index) => index < hits);
  let state = hash(seedKey) || 1;
  for (let i = pattern.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 16807) + 11) >>> 0;
    const j = state % (i + 1);
    const swap = pattern[i];
    pattern[i] = pattern[j];
    pattern[j] = swap;
  }
  return pattern;
}

function tokens(value: string) {
  const stop = new Set(["with", "from", "that", "this", "your", "have", "into"]);
  return value
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((word) => word.length > 3 && !stop.has(word));
}

function overlap(left: string, right: string) {
  const rightTokens = new Set(tokens(right));
  return tokens(left).filter((word) => rightTokens.has(word)).length;
}

function algorithmicHits(a: Profile, b: Profile) {
  let score = 28 + (hash(`${a.id}|${b.id}`) % 15);
  const pairs: [string, string, number][] = [
    ["fundraising", "investing", 16],
    ["investing", "fundraising", 16],
    ["hiring", "job_hunting", 16],
    ["job_hunting", "hiring", 16],
    ["cofounder", "cofounder", 12],
    ["customers", "customers", 6],
    ["hiring", "cofounder", 8],
    ["cofounder", "hiring", 8],
  ];
  for (const [goalA, goalB, weight] of pairs) {
    if (a.goals.includes(goalA) && b.goals.includes(goalB)) score += weight;
  }
  score += Math.min(10, overlap(a.offers, b.needs) * 3);
  score += Math.min(10, overlap(b.offers, a.needs) * 3);
  const percent = Math.max(22, Math.min(86, score));
  return Math.round((percent / 100) * 50);
}

export function hitsBetween(a: Profile, b: Profile) {
  if (a.id === b.id) return 0;
  if (a.isTeam && b.isTeam) return 48;
  if (a.isTeam || b.isTeam) {
    const otherId = a.isTeam ? b.id : a.id;
    if (a.isPrimary || b.isPrimary) return craftedById[otherId]?.hits ?? 46;
    return 45 + (hash(`${a.id}:${b.id}`) % 5);
  }
  return Math.min(44, algorithmicHits(a, b));
}

function synergyLabel(a: Profile, b: Profile) {
  const pairs: [string, string, string][] = [
    ["fundraising", "investing", "Fundraising × Investing"],
    ["investing", "fundraising", "Fundraising × Investing"],
    ["hiring", "job_hunting", "Hiring × Job hunting"],
    ["job_hunting", "hiring", "Hiring × Job hunting"],
    ["cofounder", "cofounder", "Cofounder"],
    ["hiring", "cofounder", "Hiring × Cofounder"],
    ["cofounder", "hiring", "Hiring × Cofounder"],
    ["customers", "customers", "Customers"],
  ];
  for (const [goalA, goalB, label] of pairs) {
    if (a.goals.includes(goalA) && b.goals.includes(goalB)) return label;
  }
  return "A specific trade";
}

function fallbackCopy(self: Profile, other: Profile, synergy: string) {
  const first = other.name.split(" ")[0];
  return {
    synergy,
    detail: `${self.name.split(" ")[0]} offers ${self.offers}. ${first} needs ${other.needs}. The agents only counted a meeting when both sides could name that trade.`,
    icebreaker: `${first} — both agents landed on ${synergy.toLowerCase()}. Open with ${self.offers.split(",")[0]}, not a generic hello.`,
  };
}

function fallbackTranscript(self: Profile, other: Profile, detail: string, icebreaker: string): Line[] {
  return [
    {
      side: "a",
      text: `I'm ${self.name}'s agent. Goals: ${self.goals.map((goal) => GOAL_LABEL[goal] ?? goal).join(", ")}. Need: ${self.needs}.`,
    },
    {
      side: "b",
      text: `I'm ${other.name}'s agent. ${other.headline}. Offering ${other.offers}. Looking for ${other.needs}.`,
    },
    { side: "a", text: detail },
    { side: "b", text: "That is specific enough. I will not count a meeting that is only networking." },
    { side: "a", text: `${self.name}'s side wants the meeting.` },
    { side: "b", text: `${other.name}'s side wants the meeting. Use this: ${icebreaker}` },
  ];
}

export function buildMatch(self: Profile, other: Profile): Match {
  const hits = hitsBetween(self, other);
  const percent = Math.round((hits / 50) * 100);
  const crafted = self.isPrimary ? craftedById[other.id] : undefined;
  const generated = fallbackCopy(self, other, synergyLabel(self, other));
  const synergy = crafted?.synergy ?? generated.synergy;
  const detail = crafted?.detail ?? generated.detail;
  const icebreaker = crafted?.icebreaker ?? generated.icebreaker;
  const scripted = self.isPrimary ? transcripts[other.id] : undefined;
  return {
    other,
    hits,
    total: 50,
    percent,
    fullHits: Math.round((hits / 50) * 1000),
    synergy,
    detail,
    icebreaker,
    transcript: scripted ?? fallbackTranscript(self, other, detail, icebreaker),
  };
}

export function matchesFor(self: Profile) {
  return PEOPLE.filter((person) => person.id !== self.id && !person.isTeam)
    .map((person) => buildMatch(self, person))
    .sort((a, b) => b.hits - a.hits || a.other.name.localeCompare(b.other.name));
}

export function peopleAt(eventId: string) {
  return PEOPLE.filter((person) => person.events.includes(eventId));
}

const PORTRAITS: Record<string, string> = {
  "team-jamie": "https://randomuser.me/api/portraits/men/32.jpg",
  "team-sam": "https://randomuser.me/api/portraits/men/45.jpg",
  "team-noor": "https://randomuser.me/api/portraits/women/28.jpg",
  p1: "https://randomuser.me/api/portraits/women/44.jpg",
  p2: "https://randomuser.me/api/portraits/men/52.jpg",
  p3: "https://randomuser.me/api/portraits/women/65.jpg",
  p4: "https://randomuser.me/api/portraits/men/22.jpg",
  p5: "https://randomuser.me/api/portraits/women/47.jpg",
  p6: "https://randomuser.me/api/portraits/men/36.jpg",
  p7: "https://randomuser.me/api/portraits/women/68.jpg",
  p8: "https://randomuser.me/api/portraits/men/11.jpg",
  p9: "https://randomuser.me/api/portraits/women/21.jpg",
  p10: "https://randomuser.me/api/portraits/men/58.jpg",
  p11: "https://randomuser.me/api/portraits/women/33.jpg",
  p12: "https://randomuser.me/api/portraits/men/15.jpg",
  p13: "https://randomuser.me/api/portraits/women/17.jpg",
  p14: "https://randomuser.me/api/portraits/women/63.jpg",
};

const SPOTS: Record<string, { lat: number; lng: number; area: string }> = {
  "team-jamie": { lat: 51.5234, lng: -0.0838, area: "Shoreditch" },
  "team-sam": { lat: 51.5309, lng: -0.123, area: "King's Cross" },
  "team-noor": { lat: 51.5231, lng: -0.108, area: "Clerkenwell" },
  p1: { lat: 51.5268, lng: -0.0795, area: "Shoreditch" },
  p2: { lat: 51.5316, lng: -0.1254, area: "King's Cross" },
  p3: { lat: 51.5242, lng: -0.1062, area: "Clerkenwell" },
  p4: { lat: 51.5257, lng: -0.0874, area: "Old Street" },
  p5: { lat: 51.5152, lng: -0.0916, area: "City of London" },
  p6: { lat: 51.5204, lng: -0.1048, area: "Farringdon" },
  p7: { lat: 51.5276, lng: -0.0758, area: "Shoreditch" },
  p8: { lat: 51.5178, lng: -0.0822, area: "Liverpool Street" },
  p9: { lat: 51.5218, lng: -0.1114, area: "Clerkenwell" },
  p10: { lat: 51.5261, lng: -0.0911, area: "Old Street" },
  p11: { lat: 51.5182, lng: -0.1096, area: "Holborn" },
  p12: { lat: 51.5294, lng: -0.1188, area: "King's Cross" },
  p13: { lat: 51.5236, lng: -0.1084, area: "Clerkenwell" },
  p14: { lat: 51.5248, lng: -0.0862, area: "Old Street" },
};

export function portrait(id: string) {
  return PORTRAITS[id] ?? `https://i.pravatar.cc/300?u=${encodeURIComponent(id)}`;
}

export function spotFor(id: string) {
  return SPOTS[id] ?? { lat: 51.515, lng: -0.09, area: "London" };
}

export function eventById(id: string) {
  return events.find((event) => event.id === id);
}

export function roleCompany(headline: string) {
  const [role, rest] = headline.split(",");
  const company = rest?.split("(")[0]?.trim() ?? "";
  return { role: role?.trim() || headline, company };
}

export function approximateSpot(id: string) {
  const spot = spotFor(id);
  const jitter = hash(`${id}:approx`);
  return {
    ...spot,
    lat: spot.lat + ((jitter % 100) - 50) / 9000,
    lng: spot.lng + (((jitter >>> 8) % 100) - 50) / 9000,
  };
}

export function approxWalk(fromId: string, toId: string) {
  const a = spotFor(fromId);
  const b = spotFor(toId);
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.sqrt(h));
  const mins = Math.max(5, Math.round(km / 0.08 / 5) * 5);
  return `about ${mins} min away`;
}

export function distanceLabel(fromId: string, toId: string) {
  const a = spotFor(fromId);
  const b = spotFor(toId);
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.sqrt(h));
  if (km < 1) return `${Math.max(80, Math.round(km * 1000))}m`;
  return `${km.toFixed(1)}km`;
}

export function communityBySlug(slug: string) {
  return communities.find((community) => community.slug === slug);
}

export function membersOf(slug: string) {
  return PEOPLE.filter((person) => person.communities.includes(slug));
}

const VENUES: Record<string, { lat: number; lng: number }> = {
  e1: { lat: 51.5262, lng: -0.0788 },
  e2: { lat: 51.5318, lng: -0.1245 },
  e3: { lat: 51.5258, lng: -0.0876 },
  e4: { lat: 51.5232, lng: -0.1078 },
};

const CORGI = { name: "Corgi Cafe", lat: 51.5245, lng: -0.1032 };

export type Meetup = {
  line: string;
  place: string;
  lat: number;
  lng: number;
};

export function meetupFor(self: Profile, other: Profile): Meetup {
  const shared = self.events.find((id) => other.events.includes(id));
  if (shared) {
    const event = eventById(shared);
    const spot = VENUES[shared] ?? { lat: 51.52, lng: -0.09 };
    const day = event
      ? new Date(`${event.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" })
      : "Thu";
    return {
      line: `You're both going to ${event?.title ?? "the same night"}, ${day}`,
      place: event?.venue ?? "London",
      lat: spot.lat,
      lng: spot.lng,
    };
  }
  return {
    line: "You're both 10 min from Corgi Cafe, free Fri 3pm",
    place: CORGI.name,
    lat: CORGI.lat,
    lng: CORGI.lng,
  };
}

const MANAGER_IDS = new Set(["p13", "p14"]);

function fitScore(person: Profile, text: string) {
  const lower = text.toLowerCase();
  const blob = `${person.headline} ${person.offers} ${person.needs} ${person.goals.join(" ")}`.toLowerCase();
  if (lower.includes("investor") || (lower.includes("robot") && lower.includes("hardware"))) {
    const robotics = blob.includes("robot") || blob.includes("hardware");
    const cheque = person.goals.includes("investing");
    if (lower.includes("investor") && !cheque) return 0;
    if ((lower.includes("robot") || lower.includes("hardware")) && !robotics) return 0;
    return (cheque ? 3 : 0) + (robotics ? 4 : 0);
  }
  let score = 0;
  if (lower.includes("job") && person.goals.includes("hiring")) score += 5;
  if ((lower.includes("feedback") || lower.includes("b2c") || lower.includes("app")) && (person.goals.includes("customers") || blob.includes("design") || blob.includes("growth"))) score += 4;
  if ((lower.includes("rais") || lower.includes("pre-seed") || lower.includes("seed")) && person.goals.includes("investing")) score += 5;
  if (lower.includes("cofounder") || lower.includes("co-founder")) {
    if (person.goals.includes("cofounder")) score += 5;
  }
  if (score === 0 && lower.length > 0) {
    const words = lower.split(/[^a-z0-9]+/).filter((word) => word.length > 4);
    if (words.some((word) => blob.includes(word))) score += 1;
  }
  return score;
}

export type WarmPath = {
  manager: Profile;
  partnerManager: Profile;
  partnerCommunity: string;
  target: Match;
  strength: string;
};

export function askCommunity(self: Profile, slug: string, text: string) {
  const pool = PEOPLE.filter((person) => person.id !== self.id && !person.isTeam && !MANAGER_IDS.has(person.id));
  const ranked = pool
    .map((person) => ({ person, match: buildMatch(self, person), fit: fitScore(person, text) }))
    .sort((a, b) => b.fit - a.fit || b.match.hits - a.match.hits);
  const inside = ranked.filter((row) => row.person.communities.includes(slug) && row.fit > 0).slice(0, 3);
  const outside = ranked.filter((row) => !row.person.communities.includes(slug) && row.fit > 0).slice(0, 3);
  let warm: WarmPath | null = null;
  if (inside.length === 0) {
    const manager = personById(slug === "outpost" ? "p14" : "p13");
    const targetRow = ranked.find((row) => !row.person.communities.includes(slug) && row.fit > 0) ?? ranked.find((row) => !row.person.communities.includes(slug));
    if (manager && targetRow) {
      const partnerCommunity = targetRow.person.communities.includes("outpost")
        ? "outpost"
        : (targetRow.person.communities.find((item) => item !== slug) ?? "outpost");
      let partnerManager = personById(partnerCommunity === "outpost" || partnerCommunity === "angel-row" ? "p14" : "p13");
      if (partnerManager?.id === manager.id) partnerManager = personById(manager.id === "p14" ? "p13" : "p14");
      if (partnerManager) {
        warm = {
          manager,
          partnerManager,
          partnerCommunity,
          target: targetRow.match,
          strength: "Warm: managers co-hosted 3 events",
        };
      }
    }
  }
  return { inside, outside: inside.length ? outside : [], warm };
}

export function promptsFor(slug: string) {
  if (slug === "corgi") {
    return [
      "who can give feedback on my B2C app?",
      "I need a robotics hardware investor",
      "Find me a cofounder",
    ];
  }
  return ["I'm looking for a job", "I'm raising a pre-seed", "Find me a cofounder"];
}

export function crossCommunityPairs(limit = 6) {
  const pool = PEOPLE.filter((person) => !person.isTeam);
  const pairs: { a: Profile; b: Profile; match: Match }[] = [];
  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      const a = pool[i];
      const b = pool[j];
      const shared = a.communities.some((slug) => b.communities.includes(slug));
      if (shared) continue;
      const match = buildMatch(a, b);
      if (match.percent >= 70) pairs.push({ a, b, match });
    }
  }
  return pairs.sort((left, right) => right.match.hits - left.match.hits).slice(0, limit);
}
