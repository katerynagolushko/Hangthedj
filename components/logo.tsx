export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1B1F3B]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5A24]" />
      </span>
      <span className={`font-display text-lg font-bold tracking-tight ${light ? "text-white" : "text-[#1B1F3B]"}`}>
        Hang
      </span>
    </span>
  );
}
