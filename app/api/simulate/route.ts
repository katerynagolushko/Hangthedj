import { buildMatch, getDemoUser, personById, type Line } from "@/lib/demo";

type Verdict = {
  bothWantToMeet: boolean;
  synergy: string;
  icebreaker: string;
  summary: string;
};

const TIMEOUT_MS = 8000;

export async function POST(request: Request) {
  let profileId = "";
  let viewerPatch: {
    name?: string;
    about?: string;
    goals?: string[];
    offers?: string;
    needs?: string;
  } = {};

  try {
    const body = await request.json();
    profileId = typeof body?.profileId === "string" ? body.profileId : "";
    const viewer = body?.viewer ?? {};
    viewerPatch = {
      name: clip(viewer.name, 80),
      about: clip(viewer.about, 500),
      offers: clip(viewer.offers, 400),
      needs: clip(viewer.needs, 400),
      goals: Array.isArray(viewer.goals)
        ? viewer.goals.filter((goal: unknown) => typeof goal === "string").slice(0, 8)
        : [],
    };
  } catch {
    return Response.json({ error: "Send a profile id." }, { status: 400 });
  }

  const other = personById(profileId);
  const base = getDemoUser();
  if (!other || other.id === base.id) {
    return Response.json({ error: "Unknown profile." }, { status: 400 });
  }

  const self = {
    ...base,
    name: viewerPatch.name || base.name,
    about: viewerPatch.about || base.about,
    offers: viewerPatch.offers || base.offers,
    needs: viewerPatch.needs || base.needs,
    goals: viewerPatch.goals?.length ? viewerPatch.goals : base.goals,
  };
  const scripted = buildMatch(self, other);
  const fallback = {
    source: "fallback" as const,
    lines: scripted.transcript,
    verdict: {
      bothWantToMeet: scripted.percent >= 90,
      synergy: scripted.synergy,
      icebreaker: scripted.icebreaker,
      summary: scripted.detail,
    },
  };

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json({ ...fallback, reason: "no_key" });
  }

  try {
    const live = await Promise.race([
      askAnthropic(key, self, other),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS);
      }),
    ]);
    return Response.json({ source: "live", lines: live.lines, verdict: live.verdict });
  } catch (error) {
    const reason = error instanceof Error && error.message === "timeout" ? "timeout" : "error";
    return Response.json({ ...fallback, reason });
  }
}

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function askAnthropic(
  key: string,
  self: ReturnType<typeof getDemoUser>,
  other: NonNullable<ReturnType<typeof personById>>,
) {
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: `Simulate one short agent-to-agent chat about whether these two humans should meet in real life.

Human A (side "a"): ${self.name}. ${self.headline}. Goals: ${self.goals.join(", ")}. Offers: ${self.offers}. Needs: ${self.needs}.
Human B (side "b"): ${other.name}. ${other.headline}. Goals: ${other.goals.join(", ")}. Offers: ${other.offers}. Needs: ${other.needs}.

Rules:
- 6 short lines, alternating, starting with a.
- Plain speech. A concrete synergy: hiring, job hunting, fundraising, investing, cofounder, or customers.
- End with both agents saying if they want the meeting.
- Return only JSON:
{"lines":[{"side":"a","text":"..."}],"verdict":{"bothWantToMeet":true,"synergy":"...","icebreaker":"...","summary":"..."}}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) throw new Error("upstream");
  const payload = (await response.json()) as {
    content?: { type?: string; text?: string }[];
  };
  const text = payload.content?.find((block) => block.type === "text")?.text ?? "";
  return parseLive(text);
}

function parseLive(text: string): { lines: Line[]; verdict: Verdict } {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("bad json");
  const parsed = JSON.parse(raw.slice(start, end + 1)) as {
    lines?: { side?: string; text?: string }[];
    verdict?: Partial<Verdict>;
  };
  const lines = (parsed.lines ?? [])
    .filter((line) => (line.side === "a" || line.side === "b") && typeof line.text === "string")
    .slice(0, 8)
    .map((line) => ({ side: line.side as "a" | "b", text: line.text!.trim().slice(0, 400) }))
    .filter((line) => line.text.length > 0);
  const verdict = parsed.verdict ?? {};
  if (lines.length < 2 || typeof verdict.bothWantToMeet !== "boolean") throw new Error("bad json");
  return {
    lines,
    verdict: {
      bothWantToMeet: verdict.bothWantToMeet,
      synergy: clip(verdict.synergy, 80) || "A specific trade",
      icebreaker: clip(verdict.icebreaker, 280) || lines[lines.length - 1].text,
      summary: clip(verdict.summary, 400) || "",
    },
  };
}
