import { HN_FALLBACK } from "@/lib/hn";

export async function GET(request: Request) {
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
