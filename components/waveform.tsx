export function Waveform({ live }: { live: boolean }) {
  return (
    <span className="flex h-8 items-end gap-1" aria-hidden>
      {[8, 16, 24, 14, 20].map((height, index) => (
        <span
          key={index}
          className={`w-1 rounded-full bg-[#FF5A24] ${live ? "animate-pulse" : "opacity-40"}`}
          style={{ height: live ? height : 6, animationDelay: `${index * 90}ms` }}
        />
      ))}
    </span>
  );
}
