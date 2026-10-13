import { DemoFrame } from "../demo-frame";

/** Sitemap → wireframe → finished page: how a new website is planned and built. */
export function BlueprintDemo() {
  return (
    <DemoFrame title="Plan → wireframe → build">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stage n="01" label="Sitemap">
          <svg viewBox="0 0 140 110" className="w-full" aria-hidden>
            <rect x="52" y="6" width="36" height="16" rx="4" fill="#f6f5f1" />
            {[14, 52, 90].map((x) => (
              <g key={x}>
                <path
                  d={`M70 22 V40 H${x + 18} V54`}
                  fill="none"
                  stroke="rgba(246,245,241,0.5)"
                  className="reveal-draw"
                  style={{ ["--dash" as string]: 90 }}
                />
                <rect
                  x={x}
                  y="54"
                  width="36"
                  height="14"
                  rx="4"
                  fill="none"
                  stroke="rgba(246,245,241,0.6)"
                />
              </g>
            ))}
            {[14, 52].map((x) => (
              <g key={x}>
                <path d={`M${x + 18} 68 V86`} stroke="rgba(246,245,241,0.35)" />
                <rect
                  x={x + 4}
                  y="86"
                  width="28"
                  height="12"
                  rx="3"
                  fill="none"
                  stroke="rgba(246,245,241,0.35)"
                />
              </g>
            ))}
          </svg>
        </Stage>
        <Stage n="02" label="Wireframe">
          <svg viewBox="0 0 140 110" className="w-full" aria-hidden>
            <rect
              x="8"
              y="6"
              width="124"
              height="98"
              rx="8"
              fill="none"
              stroke="rgba(246,245,241,0.5)"
              strokeDasharray="3 3"
            />
            <rect x="18" y="16" width="60" height="6" rx="3" fill="rgba(246,245,241,0.5)" />
            <rect x="18" y="28" width="44" height="6" rx="3" fill="rgba(246,245,241,0.5)" />
            <rect
              x="18"
              y="40"
              width="30"
              height="9"
              rx="4.5"
              fill="none"
              stroke="rgba(246,245,241,0.6)"
            />
            <path
              d="M88 16h34v34H88z M88 16l34 34 M122 16 88 50"
              fill="none"
              stroke="rgba(246,245,241,0.35)"
            />
            {[18, 56, 94].map((x) => (
              <rect
                key={x}
                x={x}
                y="62"
                width="30"
                height="32"
                rx="4"
                fill="none"
                stroke="rgba(246,245,241,0.4)"
              />
            ))}
          </svg>
        </Stage>
        <Stage n="03" label="Finished page">
          <svg viewBox="0 0 140 110" className="w-full" aria-hidden>
            <rect x="8" y="6" width="124" height="98" rx="8" fill="#f6f5f1" />
            <rect x="18" y="16" width="62" height="7" rx="2" fill="#0b0b0b" />
            <rect x="18" y="27" width="46" height="7" rx="2" fill="#0b0b0b" />
            <rect x="18" y="40" width="30" height="9" rx="4.5" fill="#0b0b0b" />
            <rect x="88" y="16" width="34" height="34" rx="6" fill="#1c1c1b" />
            <path d="M93 42 l8 -8 l6 5 l10 -12" fill="none" stroke="#f6f5f1" strokeWidth="1.5" />
            {[18, 56, 94].map((x) => (
              <rect key={x} x={x} y="62" width="30" height="32" rx="5" fill="#e6e4df" />
            ))}
          </svg>
        </Stage>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-paper/55">
        Structure is agreed before visual design, so every page has a job and a clear next step.
      </p>
    </DemoFrame>
  );
}

function Stage({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <div className="reveal flex flex-col gap-3 rounded-2xl border border-paper/10 bg-paper/[0.03] p-3">
      <div className="flex items-center justify-between font-mono text-[0.62rem] tracking-[0.12em] text-paper/55 uppercase">
        <span>{label}</span>
        <span>{n}</span>
      </div>
      {children}
    </div>
  );
}
