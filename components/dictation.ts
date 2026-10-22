type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
};

export function dictate(options: {
  fallback: string;
  onPartial: (text: string) => void;
  onDone: (text: string, source: "live" | "fallback") => void;
}) {
  const speech = window as Window & { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  const Ctor = speech.SpeechRecognition ?? speech.webkitSpeechRecognition;
  let cancelled = false;

  const fake = () => {
    const words = options.fallback.split(" ");
    let index = 0;
    const timer = window.setInterval(() => {
      if (cancelled) {
        window.clearInterval(timer);
        return;
      }
      index += 1;
      const text = words.slice(0, index).join(" ");
      options.onPartial(text);
      if (index >= words.length) {
        window.clearInterval(timer);
        options.onDone(options.fallback, "fallback");
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  };

  if (!Ctor) return fake();

  try {
    const rec = new Ctor();
    rec.lang = "en-GB";
    rec.interimResults = true;
    let settled = false;
    rec.onresult = (event) => {
      const text = Array.from(event.results)
        .map((row) => row[0].transcript)
        .join(" ")
        .trim();
      options.onPartial(text);
      const last = event.results[event.results.length - 1];
      if (last?.isFinal && text) {
        settled = true;
        options.onDone(text, "live");
      }
    };
    rec.onerror = () => {
      if (!settled) fake();
    };
    rec.start();
    return () => {
      cancelled = true;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    };
  } catch {
    return fake();
  }
}
