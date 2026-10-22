# Hang: the knowledge layer for startup communities

Hang helps community members find the right person inside their community, and beyond it, in seconds.

Communities and community managers onboard their members. Members say what they need, by voice or text, and Hang suggests the best people to meet, Tinder-style.

## How it works

1. **Join through your community.** Each community has its own page. Members join with their LinkedIn and, optionally, their Hacker News username. A community lead approves each profile.
2. **Ask for what you need.** Members ask by voice or text, for example "a technical co-founder", "a job in AI" or "feedback on my app".
3. **Get matched.** Hang searches your own community first and then partner communities. If nobody fits, it finds the warmest introduction path through community managers.
4. **Accept or decline.** A chat opens only when both people accept. The other person is never told about a decline.
5. **Meet up.** Hang suggests a nearby place or an event you're both going to. At events, people can connect by QR code.

## Profiles

Each profile has a name, LinkedIn, job title, company, employment status, skills and what the member is looking for.

## Safety

- Double opt-in before any chat opens.
- Profiles are approved by the community lead.
- Only approximate location is shared.
- Members can block and report.
- Every match comes with a "why this match" explanation.

## Tech

- Next.js, Tailwind CSS and Framer Motion.
- Demo data is seeded on the client.
- The optional `/api/simulate` route uses `ANTHROPIC_API_KEY` and falls back to scripted output.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Built at a hackathon with Cursor and Grok Bot.
