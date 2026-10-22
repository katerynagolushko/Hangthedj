"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function SimGrid({
  pattern,
  pace = 85,
  loop = false,
  onProgress,
  onDone,
}: {
  pattern: boolean[];
  pace?: number;
  loop?: boolean;
  onProgress?: (seen: number) => void;
  onDone?: () => void;
}) {
  const [seen, setSeen] = useState(0);
  const onProgressRef = useRef(onProgress);
  const onDoneRef = useRef(onDone);
  onProgressRef.current = onProgress;
  onDoneRef.current = onDone;

  useEffect(() => {
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      if (index >= pattern.length) {
        onDoneRef.current?.();
        if (!loop) return;
        timer = setTimeout(() => {
          if (cancelled) return;
          index = 0;
          setSeen(0);
          onProgressRef.current?.(0);
          timer = setTimeout(tick, pace);
        }, 1700);
        return;
      }
      index += 1;
      setSeen(index);
      onProgressRef.current?.(index);
      if (index >= pattern.length) {
        onDoneRef.current?.();
        if (!loop) return;
        timer = setTimeout(() => {
          if (cancelled) return;
          index = 0;
          setSeen(0);
          onProgressRef.current?.(0);
          timer = setTimeout(tick, pace);
        }, 1700);
        return;
      }
      timer = setTimeout(tick, pace);
    };

    timer = setTimeout(tick, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pattern, pace, loop]);

  return (
    <div className="grid grid-cols-10 gap-1.5 sm:gap-2" aria-hidden>
      {pattern.map((hit, index) => {
        const flipped = index < seen;
        return (
          <div key={`${index}-${hit ? "y" : "n"}`} className="aspect-square" style={{ perspective: 700 }}>
            <motion.div
              className="relative h-full w-full"
              animate={{ rotateX: flipped ? 180 : 0 }}
              transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className={`absolute inset-0 rounded border border-neutral-200 bg-neutral-100 ${
                  index === seen ? "ring-2 ring-neutral-400" : ""
                }`}
                style={{ backfaceVisibility: "hidden" }}
              />
              <div
                className={`absolute inset-0 rounded ${hit ? "bg-emerald-600" : "bg-neutral-300"}`}
                style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
              />
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
