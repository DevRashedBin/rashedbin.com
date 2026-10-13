import { DemoFrame } from "../demo-frame";

const layers = [
  { label: "Monitoring", r: 150 },
  { label: "Backups", r: 115 },
  { label: "Updates", r: 80 },
  { label: "Hardening", r: 45 },
];

export function SecurityLayersDemo() {
  return (
    <DemoFrame title="Layers of protection">
      <div className="grid items-center gap-6 sm:grid-cols-[1.1fr_1fr]">
        <svg
          viewBox="0 0 320 320"
          role="img"
          aria-label="Concentric layers of protection around a website: hardening, updates, backups and monitoring"
          className="mx-auto w-full max-w-[300px]"
        >
          {layers.map((l, i) => (
            <g key={l.label}>
              <circle
                cx="160"
                cy="160"
                r={l.r}
                fill="none"
                stroke="#f6f5f1"
                strokeOpacity={0.15 + i * 0.15}
                strokeWidth="1.5"
                strokeDasharray={i === 0 ? "4 6" : undefined}
              />
              <text
                x="160"
                y={160 - l.r + 16}
                textAnchor="middle"
                fill="rgba(246,245,241,0.6)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                {l.label.toUpperCase()}
              </text>
            </g>
          ))}
          <circle cx="160" cy="160" r="22" fill="#f6f5f1" />
          <circle
            cx="160"
            cy="160"
            r="30"
            fill="none"
            stroke="#f6f5f1"
            strokeOpacity="0.5"
            className="anim-pulse"
          />
          <path
            d="M152 160.5 158 166.5 169 154"
            fill="none"
            stroke="#0b0b0b"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            r="4"
            fill="#f6f5f1"
            className="anim-travel motion-only"
            style={{
              offsetPath: 'path("M160 10 a150 150 0 1 1 -0.1 0")',
              ["--duration" as string]: "9s",
            }}
          />
        </svg>
        <ul className="flex flex-col gap-3 text-sm">
          {[
            ["Hardening", "Roles, logins, permissions, headers"],
            ["Updates", "Tested before going live"],
            ["Backups", "Off-site, restore-tested"],
            ["Monitoring", "Uptime and integrity checks"],
          ].map(([t, d]) => (
            <li
              key={t}
              className="reveal rounded-2xl border border-paper/10 bg-paper/[0.04] px-4 py-3"
            >
              <span className="block font-medium">{t}</span>
              <span className="block text-xs text-paper/55">{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </DemoFrame>
  );
}
