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
