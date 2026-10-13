import { DemoFrame } from "../demo-frame";

const rows = [
  { url: "/", before: "Indexed", after: "Indexed" },
  { url: "/services/", before: "Duplicate", after: "Canonical set" },
  { url: "/services/seo?ref=nav", before: "Duplicate", after: "Consolidated" },
  { url: "/old-offer/", before: "404", after: "301 → /services/" },
  { url: "/blog/guide/", before: "Blocked", after: "Indexed" },
];

export function CrawlIndexDemo() {
  return (
    <DemoFrame title="Crawl & index check" illustrative>
      <div className="overflow-hidden rounded-2xl border border-paper/10">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-paper/10 bg-paper/[0.04] px-4 py-2.5 font-mono text-[0.62rem] tracking-[0.12em] text-paper/50 uppercase">
          <span>URL</span>
          <span>Before</span>
          <span>After</span>
        </div>
        <ul>
          {rows.map((r) => (
            <li
              key={r.url}
              className="reveal grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 border-b border-paper/[0.07] px-4 py-3 font-mono text-[0.72rem] last:border-0"
            >
              <span className="truncate text-paper/85">{r.url}</span>
              <span
                className={
                  r.before === "Indexed"
                    ? "text-paper/70"
                    : "text-paper/40 line-through decoration-paper/30"
                }
              >
                {r.before}
              </span>
              <span className="flex items-center gap-1.5 text-paper">
                <span className="size-1.5 shrink-0 rounded-full bg-paper" />
                <span className="truncate">{r.after}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center font-mono text-[0.65rem] text-paper/60">
        {["robots.txt", "sitemap.xml", "schema"].map((t) => (
          <span key={t} className="rounded-full border border-paper/15 py-1.5">
            {t} ✓
          </span>
        ))}
      </div>
    </DemoFrame>
  );
}
