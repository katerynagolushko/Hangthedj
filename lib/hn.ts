export type HnStory = { title: string; url: string; points: number; author: string };

export const HN_FALLBACK: HnStory[] = [
  {
    title: "Show HN: A small robotics SDK",
    url: "https://news.ycombinator.com/item?id=41822011",
    points: 186,
    author: "mira_builds",
  },
  {
    title: "Who is hiring? (October 2026)",
    url: "https://news.ycombinator.com/item?id=41710002",
    points: 412,
    author: "whoishiring",
  },
  {
    title: "Who wants to be hired? (October 2026)",
    url: "https://news.ycombinator.com/item?id=41710088",
    points: 290,
    author: "whoishiring",
  },
  {
    title: "Ask HN: How do community leads introduce members?",
    url: "https://news.ycombinator.com/item?id=41655210",
    points: 74,
    author: "cafe_ops",
  },
];

export type HnPerson = {
  handle: string;
  name: string;
  thread: string;
  itemTitle: string;
  why: string;
  href: string;
};

const PEOPLE: HnPerson[] = [
  {
    handle: "mira_builds",
    name: "Mira Chen",
    thread: "Show HN",
    itemTitle: "Show HN: robotics SDK",
    why: "Posted the SDK and asked for a hardware investor, not a job.",
    href: "https://news.ycombinator.com/item?id=41822011",
  },
  {
    handle: "devon_hire",
    name: "Devon Blake",
    thread: "Who is hiring?",
    itemTitle: "Who is hiring? — warehouse robotics, London",
    why: "Hiring a founding engineer. The post names the stack and the salary.",
    href: "https://news.ycombinator.com/item?id=41710002",
  },
  {
    handle: "sam_wants",
    name: "Sam Iqbal",
    thread: "Who wants to be hired?",
    itemTitle: "Who wants to be hired? — staff ML, open to cofound",
    why: "Wants a commercial cofounder. Explicitly not another staff job.",
    href: "https://news.ycombinator.com/item?id=41710088",
  },
  {
    handle: "lina_b2c",
    name: "Lina Park",
    thread: "Show HN",
    itemTitle: "Show HN: ten-minute B2C feedback booth",
    why: "Runs short consumer tests. Useful if you want feedback, not a pitch.",
    href: "https://news.ycombinator.com/item?id=41900421",
  },
];

export function hnPeople(query: string) {
  const q = query.toLowerCase();
  if (q.includes("robot") || q.includes("investor") || q.includes("hardware")) return [PEOPLE[0], PEOPLE[1]];
  if (q.includes("job") || q.includes("hire")) return [PEOPLE[2], PEOPLE[1]];
  if (q.includes("feedback") || q.includes("app") || q.includes("b2c")) return [PEOPLE[3], PEOPLE[2]];
  if (q.includes("cofounder") || q.includes("co-founder")) return [PEOPLE[2], PEOPLE[0]];
  return PEOPLE.slice(0, 2);
}

export type HnJoinProfile = {
  handle: string;
  name: string;
  title: string;
  company: string;
  employment: string;
  skills: string;
  lookingFor: string[];
  karma: number | null;
  about: string;
  posts: string[];
  comments: string[];
};

export type HnAccount = { id?: string; karma?: number; about?: string; submitted?: number[] };
export type HnItem = { title?: string; text?: string };

const JOIN_FALLBACKS: Record<string, HnJoinProfile> = {
  jamie: {
    handle: "jamie",
    name: "Jamie Okonkwo",
    title: "Founder",
    company: "Hang",
    employment: "Founder",
    skills: "Builds community tools in London",
    lookingFor: ["Feedback", "Investors"],
    karma: 1842,
    about: "builds community tools in London",
    posts: ["Show HN: robotics SDK"],
    comments: ["hired from a cafe, not a job board"],
  },
  mira_builds: {
    handle: "mira_builds",
    name: "Mira Chen",
    title: "Founder",
    company: "Independent",
    employment: "Founder",
    skills: "Hardware and a small robotics SDK",
    lookingFor: ["Investors"],
    karma: 186,
    about: "Building a robotics SDK. Looking for a hardware investor.",
    posts: ["Show HN: robotics SDK"],
    comments: [],
  },
  devon_hire: {
    handle: "devon_hire",
    name: "Devon Blake",
    title: "Founder",
    company: "Independent",
    employment: "Founder",
    skills: "Warehouse robotics, hiring a founding engineer",
    lookingFor: ["Hires"],
    karma: 412,
    about: "Hiring a founding engineer in London.",
    posts: ["Who is hiring? — warehouse robotics, London"],
    comments: [],
  },
  sam_wants: {
    handle: "sam_wants",
    name: "Sam Iqbal",
    title: "Engineer",
    company: "Independent",
    employment: "Between roles",
    skills: "Staff ML, open to cofound",
    lookingFor: ["Co-founders", "Jobs"],
    karma: 290,
    about: "Staff ML engineer, open to a commercial cofounder.",
    posts: ["Who wants to be hired? — staff ML, open to cofound"],
    comments: [],
  },
  lina_b2c: {
    handle: "lina_b2c",
    name: "Lina Park",
    title: "Founder",
    company: "Independent",
    employment: "Founder",
    skills: "Short consumer tests and B2C feedback",
    lookingFor: ["Feedback"],
    karma: 74,
    about: "Runs short consumer tests.",
    posts: ["Show HN: ten-minute B2C feedback booth"],
    comments: [],
  },
};

export function stripHnText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayHnName(handle: string) {
  const parts = handle.split(/[_\-.]+/).filter(Boolean);
  if (!parts.length) return handle;
  return parts.map((part) => (part.length <= 2 ? part : part.charAt(0).toUpperCase() + part.slice(1))).join(" ");
}

function roleFromText(text: string) {
  const lower = text.toLowerCase();
  if (/\bco-?founder\b|\bfounder\b/.test(lower)) return { title: "Founder", employment: "Founder" };
  if (/\bstudent\b/.test(lower)) return { title: "Student", employment: "Student" };
  if (/\bfreelance|\bconsultant\b/.test(lower)) return { title: "Freelancer", employment: "Part-time" };
  if (/\bengineer\b/.test(lower)) return { title: "Engineer", employment: "Full-time" };
  if (/\bdesigner\b/.test(lower)) return { title: "Designer", employment: "Full-time" };
  return { title: "Builder", employment: "Full-time" };
}

export function profileFromHn(handle: string, user: HnAccount, items: HnItem[]): HnJoinProfile {
  const about = stripHnText(user.about || "").slice(0, 180);
  const posts = items
    .map((item) => item.title?.trim())
    .filter((title): title is string => Boolean(title))
    .slice(0, 2);
  const commentTexts = items
    .filter((item) => !item.title && item.text)
    .map((item) => stripHnText(item.text || ""))
    .filter(Boolean);
  const comments = commentTexts.slice(0, 1).map((text) => text.slice(0, 140));
  const signal = about || commentTexts[0]?.slice(0, 280) || "";
  const role = roleFromText(signal);
  const companyMatch = signal.match(/\b(?:at|@)\s+([A-Z][\w&.'’-]+(?:\s+[A-Z][\w&.'’-]+){0,3})/);
  const company = companyMatch ? companyMatch[1].replace(/[.,]$/, "").trim() : "Independent";
  const lower = signal.toLowerCase();
  const lookingFor: string[] = [];
  if (/\bjob\b|open to work|looking for a role/.test(lower)) lookingFor.push("Jobs");
  if (/\bco-?founder\b/.test(lower)) lookingFor.push("Co-founders");
  if (/\binvestor\b|\braising\b|\bseed\b/.test(lower)) lookingFor.push("Investors");
  if (/\bfeedback\b/.test(lower)) lookingFor.push("Feedback");
  if (/\bhiring\b|\bhire\b/.test(lower)) lookingFor.push("Hires");
  if (/\bcowork/.test(lower)) lookingFor.push("Co-working spaces");
  const id = user.id || handle;
  return {
    handle: id,
    name: displayHnName(id),
    title: role.title,
    company,
    employment: role.employment,
    skills: about || (posts[0] ? `Posted: ${posts[0]}`.slice(0, 180) : commentTexts[0]?.slice(0, 180) || "Active on Hacker News"),
    lookingFor,
    karma: typeof user.karma === "number" ? user.karma : null,
    about,
    posts,
    comments,
  };
}

export function fallbackHnProfile(handle: string): HnJoinProfile {
  const known = JOIN_FALLBACKS[handle.toLowerCase()];
  if (known) return known;
  return {
    handle,
    name: displayHnName(handle),
    title: "Builder",
    company: "Independent",
    employment: "Full-time",
    skills: "Builds in public on Hacker News",
    lookingFor: ["Feedback"],
    karma: null,
    about: "",
    posts: [],
    comments: [],
  };
}
