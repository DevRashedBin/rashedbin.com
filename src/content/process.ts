/** The working process shown on the homepage and About page. */
export const processSteps = [
  {
    key: "discover",
    title: "Discover",
    duration: "Day 1–3",
    body: "A short consultation to understand your business, customers and goals. You get a written scope and fixed quote.",
  },
  {
    key: "plan",
    title: "Plan",
    duration: "Week 1",
    body: "Sitemap, page structure and wireframes, agreed before any visual design starts.",
  },
  {
    key: "build",
    title: "Design & build",
    duration: "Weeks 2–5",
    body: "Design and development on a private staging link, with progress updates you can follow.",
  },
  {
    key: "launch",
    title: "Launch",
    duration: "Launch week",
    body: "Final QA across devices, performance and SEO checks, then a carefully managed go-live.",
  },
  {
    key: "support",
    title: "Support",
    duration: "Ongoing",
    body: "Handover walkthrough, post-launch fixes, and optional maintenance if you want it.",
  },
] as const;

/** Durations above are typical for a new business website; smaller jobs move faster. */
export const processNote =
  "Timelines shown are typical for a new business website. Fixes and optimisation projects are usually much shorter.";
