Make the demo look stunning. It does NOT need a real backend: load seed.json locally and fake the matching engine.

- Dark theme, neon gradient accents (violet → pink), glassmorphism cards, Framer Motion everywhere.
- Hero: "998 out of 1,000 simulations said you should meet."
- "Simulation" screen: a grid of 50 tiny tiles flipping one by one (green = click, grey = no click) with a live counter climbing to e.g. "47/50 — 94% match". Then a big reveal card with confetti.
- Replay a simulated chat between two agents with a typing animation (pre-written transcripts in a JSON file).
- Network graph (react-force-graph) of all people + communities, with glowing edges for top matches, nodes pulsing for "going to the same event".
- Event cards: "3 people you'd click with are going" with stacked avatars (use https://i.pravatar.cc or initials).
- Organiser view: drag-and-drop CSV, fake progress bar "Importing 214 members… deduping… 38 cross-community matches found", then the dashboard with animated counters.
- The demo user's (our team's) profiles must always get the highest scores (90%+); hardcode it.
