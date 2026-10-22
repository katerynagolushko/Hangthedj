"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ThreadView } from "@/components/thread-view";

function ThreadInner() {
  const params = useParams();
  return <ThreadView id={String(params.id ?? "")} />;
}

export default function ThreadPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#6B6B6B]">Loading the chat…</div>}>
      <ThreadInner />
    </Suspense>
  );
}
