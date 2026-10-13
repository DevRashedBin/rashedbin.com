import { DemoFrame } from "../demo-frame";

/**
 * Core Web Vitals thresholds as published by Google (web.dev/vitals).
 * These are the official "good / needs improvement / poor" boundaries,
 * not measurements of any client site.
 */
const metrics = [
  {
    key: "LCP",
    name: "Largest Contentful Paint",
    good: "≤ 2.5 s",
    ni: "≤ 4.0 s",
    poor: "> 4.0 s",
    target: 0.24,
  },
  {
    key: "INP",
    name: "Interaction to Next Paint",
    good: "≤ 200 ms",
    ni: "≤ 500 ms",
    poor: "> 500 ms",
    target: 0.2,
  },
  {
    key: "CLS",
    name: "Cumulative Layout Shift",
    good: "≤ 0.1",
    ni: "≤ 0.25",
    poor: "> 0.25",
    target: 0.18,
  },
];

export function VitalsDemo() {
  return (
    <DemoFrame title="What Google measures">
      <ul className="flex flex-col gap-6">
        {metrics.map((m) => (
          <li key={m.key}>
            <div className="mb-2.5 flex items-baseline justify-between gap-4">
              <span className="flex items-baseline gap-3">
                <span className="font-mono text-sm font-medium">{m.key}</span>
                <span className="hidden text-xs text-paper/55 sm:inline">{m.name}</span>
              </span>
              <span className="font-mono text-[0.7rem] text-paper/55">target {m.good}</span>
            </div>
            <div className="relative">
              <div className="flex h-2.5 gap-1 overflow-hidden rounded-full">
                <span className="w-[40%] rounded-l-full bg-paper" />
                <span className="w-[30%] bg-paper/40" />
                <span className="w-[30%] rounded-r-full bg-paper/15" />
              </div>
              <span
                aria-hidden
                className="reveal absolute -top-1.5 h-5.5 w-0.5 rounded bg-paper shadow-[0_0_0_3px_#0b0b0b]"
                style={{ left: `${m.target * 100}%` }}
              />
            </div>
            <div className="mt-2 grid grid-cols-[40%_30%_30%] font-mono text-[0.65rem] text-paper/50">
              <span>Good</span>
              <span>Needs work</span>
              <span>Poor</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs leading-relaxed text-paper/50">
        Thresholds from Google&rsquo;s Core Web Vitals guidance, measured at the 75th percentile of
        real visits.
      </p>
    </DemoFrame>
  );
}
