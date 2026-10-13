import { DemoFrame } from "../demo-frame";

const tokens = [
  ["Heading font", "Geist · 600"],
  ["Primary colour", "#0B0B0B"],
  ["Button radius", "999px"],
  ["Section spacing", "96 / 64 px"],
];

export function EditableBlocksDemo() {
  return (
    <DemoFrame title="Global styles → every page">
      <div className="grid gap-5 sm:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-paper/12 bg-paper/[0.04] p-4">
          <p className="mb-3 font-mono text-[0.62rem] tracking-[0.12em] text-paper/50 uppercase">
            Site settings
          </p>
          <ul className="flex flex-col gap-2.5">
            {tokens.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-paper/65">{k}</span>
                <span className="rounded-md bg-paper/10 px-2 py-0.5 font-mono text-[0.65rem]">
                  {v}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2" aria-hidden>
          {["Header template", "Hero", "Services grid", "Call to action", "Footer template"].map(
            (b, i) => (
              <div
                key={b}
                className="anim-highlight flex items-center justify-between rounded-xl border border-paper/12 px-3 py-2.5"
                style={{ animationDelay: `${i * 0.6}s` }}
              >
                <span className="text-xs text-paper/80">{b}</span>
                <span className="font-mono text-[0.6rem] text-paper/40">
                  {i === 0 || i === 4 ? "global" : "block"}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
      <p className="mt-5 text-xs leading-relaxed text-paper/55">
        Change a setting once and every page that uses it updates — so pages stay consistent as the
        site grows.
      </p>
    </DemoFrame>
  );
}
