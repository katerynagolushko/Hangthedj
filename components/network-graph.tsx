"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Page } from "@/components/chrome";
import { useViewer } from "@/components/session";
import { card } from "@/components/ui";
import {
  allPeople,
  buildMatch,
  communities,
  type Profile,
} from "@/lib/demo";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-neutral-500">Loading the graph…</p>,
}) as ComponentType<Record<string, unknown>>;

type GNode = {
  id: string;
  name: string;
  kind: "person" | "community";
  sameEvent?: boolean;
  isPrimary?: boolean;
  person?: Profile;
};

type GLink = { source: string; target: string; kind: "member" | "match" };

export function NetworkGraph() {
  const viewer = useViewer();
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [selected, setSelected] = useState<GNode | null>(null);

  useEffect(() => {
    const node = wrap.current;
    if (!node) return;
    const measure = () => setWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    const people = allPeople();
    const nodes: GNode[] = [
      ...communities.map((community) => ({
        id: `c:${community.slug}`,
        name: community.name,
        kind: "community" as const,
      })),
      ...people.map((person) => ({
        id: person.id,
        name: person.name,
        kind: "person" as const,
        isPrimary: person.isPrimary,
        sameEvent: person.events.some((eventId) => viewer.events.includes(eventId)),
        person,
      })),
    ];
    const links: GLink[] = [];
    for (const person of people) {
      for (const slug of person.communities) {
        links.push({ source: person.id, target: `c:${slug}`, kind: "member" });
      }
    }
    for (const person of people) {
      if (person.id === viewer.id || person.isTeam) continue;
      const match = buildMatch(viewer, person);
      if (match.percent >= 90) {
        links.push({ source: viewer.id, target: person.id, kind: "match" });
      }
    }
    return { nodes, links };
  }, [viewer]);

  const detail =
    selected?.kind === "person" && selected.person && selected.person.id !== viewer.id
      ? buildMatch(viewer, selected.person)
      : null;

  return (
    <Page wide>
      <h1 className="text-3xl font-semibold tracking-tight">Network</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        People, the communities they belong to, and the matches above 90%. A ring means they are
        going to an event you are going to.
      </p>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-600">
        <span>Black dot: community</span>
        <span>Grey dot: person</span>
        <span>Green ring: same event as you</span>
        <span>Green line: 90%+ match</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div ref={wrap} className={`${card} overflow-hidden`}>
          <ForceGraph2D
            graphData={data}
            width={width}
            height={560}
            backgroundColor="#ffffff"
            nodeRelSize={4}
            linkColor={(link: GLink) => (link.kind === "match" ? "#166534" : "#d4d4d4")}
            linkWidth={(link: GLink) => (link.kind === "match" ? 2 : 0.6)}
            cooldownTicks={90}
            onNodeClick={(node: GNode) => setSelected(node)}
            nodeLabel={(node: GNode) => node.name}
            nodeCanvasObject={(node: GNode & { x?: number; y?: number }, ctx: CanvasRenderingContext2D, scale: number) => {
              if (node.x == null || node.y == null) return;
              const radius = node.kind === "community" ? 7 : 4.5;
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
              ctx.fillStyle = node.kind === "community" ? "#171717" : node.isPrimary ? "#166534" : "#737373";
              ctx.fill();
              if (node.sameEvent && node.kind === "person") {
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 3, 0, Math.PI * 2);
                ctx.strokeStyle = "#166534";
                ctx.lineWidth = 1.25;
                ctx.stroke();
              }
              ctx.font = `${11 / scale}px Outfit, sans-serif`;
              ctx.fillStyle = "#171717";
              ctx.textAlign = "left";
              ctx.fillText(node.name, node.x + radius + 3, node.y + 3);
            }}
            nodePointerAreaPaint={(node: GNode & { x?: number; y?: number }, color: string, ctx: CanvasRenderingContext2D) => {
              if (node.x == null || node.y == null) return;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
              ctx.fill();
            }}
          />
        </div>
        <aside className={`${card} p-4`}>
          {!selected ? <p className="text-sm text-neutral-600">Click a dot to read the relationship.</p> : null}
          {selected?.kind === "community" ? (
            <div>
              <p className="text-xs text-neutral-500">Community</p>
              <h2 className="mt-1 text-lg font-semibold">{selected.name}</h2>
            </div>
          ) : null}
          {selected?.kind === "person" && selected.person ? (
            <div>
              <p className="text-xs text-neutral-500">{selected.person.role ?? selected.person.headline}</p>
              <h2 className="mt-1 text-lg font-semibold">{selected.person.name}</h2>
              <p className="mt-2 text-sm text-neutral-600">{selected.person.headline}</p>
              {selected.person.id === viewer.id ? (
                <p className="mt-3 text-sm text-neutral-700">This is the demo user. Swap data/team.json before the live demo.</p>
              ) : null}
              {detail ? (
                <div className="mt-3 text-sm">
                  <p className="font-medium">{detail.percent}% · {detail.synergy}</p>
                  <p className="mt-2 leading-relaxed text-neutral-700">{detail.icebreaker}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </Page>
  );
}
