"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { JoinForm } from "@/components/join-form";

function JoinInner() {
  const params = useSearchParams();
  return <JoinForm initialSlug={params.get("community") ?? "corgi"} />;
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#6B6B6B]">Loading the form…</div>}>
      <JoinInner />
    </Suspense>
  );
}
