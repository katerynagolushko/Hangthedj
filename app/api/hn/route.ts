import { fallbackHnProfile, HN_FALLBACK, profileFromHn, type HnAccount, type HnItem } from "@/lib/hn";

async function lookupUser(raw: string) {
  const handle = raw.replace(/^@/, "").trim().slice(0, 30);
  if (!/^[A-Za-z0-9_-]{1,30}$/.test(handle)) return Response.json({ source: "missing", profile: null });
  try {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(handle)}.json`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("upstream");
    const account = (await response.json()) as HnAccount | null;
    if (!account || typeof account !== "object" || !account.id) return Response.json({ source: "missing", profile: null });
    const ids = Array.isArray(account.submitted) ? account.submitted.slice(0, 8) : [];
    const items = (
      await Promise.all(
        ids.map(async (id) => {
          try {
            const itemResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
              signal: AbortSignal.timeout(4000),
              cache: "no-store",
            });
            if (!itemResponse.ok) return null;
            return (await itemResponse.json()) as HnItem | null;
          } catch {
            return null;
          }
        }),
      )
    ).filter((item): item is HnItem => Boolean(item));
    return Response.json({ source: "live", profile: profileFromHn(handle, account, items) });
  } catch {
    return Response.json({ source: "fallback", profile: fallbackHnProfile(handle) });
  }
}

export async function GET(request: Request) {
  const user = new URL(request.url).searchParams.get("user");
  if (user?.trim()) return lookupUser(user);
  const query = new URL(request.url).searchParams.get("q")?.slice(0, 120) || "startup community";
  try {
    const response = await fetch(
      `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=4&query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(4000), cache: "no-store" },
    );
    if (!response.ok) throw new Error("upstream");
    const payload = (await response.json()) as {
      hits?: { title?: string; url?: string | null; story_text?: string; objectID?: string; points?: number; author?: string }[];
    };
    const hits = (payload.hits ?? [])
      .filter((hit) => typeof hit.title === "string" && hit.title.trim())
      .slice(0, 4)
      .map((hit) => ({
        title: hit.title!.trim(),
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID ?? ""}`,
        points: typeof hit.points === "number" ? hit.points : 0,
        author: hit.author || "hn",
      }));
    if (!hits.length) return Response.json({ source: "fallback", hits: HN_FALLBACK });
    return Response.json({ source: "live", hits });
  } catch {
    return Response.json({ source: "fallback", hits: HN_FALLBACK });
  }
}
