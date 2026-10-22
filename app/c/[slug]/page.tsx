"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { SearchView } from "@/components/search-view";

function CommunityInner() {
  const params = useParams();
  return <SearchView slug={String(params.slug ?? "corgi")} />;
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#6B6B6B]">Loading the community…</div>}>
      <CommunityInner />
    </Suspense>
  );
}
