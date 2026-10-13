/**
 * Hero diagram: how a business website turns a visitor into an enquiry.
 * Pure SVG + CSS. Motion (travelling dots, pulses) runs only when the user
 * has not requested reduced motion; the static state is complete on its own.
 */

const stages = [
  { x: 60, label: "Search", sub: "Finds you" },
  { x: 190, label: "Visit", sub: "Lands fast" },
  { x: 320, label: "Trust", sub: "Understands" },
  { x: 450, label: "Enquire", sub: "Gets in touch" },
];

const PATH = "M60 330 C 120 330, 130 300, 190 300 S 260 260, 320 260 S 400 210, 450 200";

export function ConversionFlow() {
  return (
    <figure className="relative overflow-hidden rounded-[var(--radius-panel)] bg-ink text-paper">
      <div aria-hidden className="absolute inset-0 grid-lines opacity-60" />
      <svg
        viewBox="0 0 520 420"
        role="img"
        aria-labelledby="flow-title flow-desc"
        className="relative block h-auto w-full"
      >
        <title id="flow-title">From search to enquiry</title>
        <desc id="flow-desc">
          A visitor finds the website through search, lands on a fast page, builds trust, and sends
          an enquiry.
        </desc>

        {/* Browser window */}
        <g transform="translate(40 32)">
          <rect width="440" height="132" rx="18" fill="#161616" stroke="rgba(246,245,241,0.14)" />
          <circle cx="22" cy="20" r="4" fill="rgba(246,245,241,0.3)" />
          <circle cx="36" cy="20" r="4" fill="rgba(246,245,241,0.2)" />
          <circle cx="50" cy="20" r="4" fill="rgba(246,245,241,0.12)" />
          <rect x="72" y="12" width="200" height="16" rx="8" fill="rgba(246,245,241,0.07)" />
          <text
            x="84"
            y="24"
            fill="rgba(246,245,241,0.55)"
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            yourbusiness.com
          </text>
          <rect x="22" y="48" width="190" height="14" rx="4" fill="rgba(246,245,241,0.85)" />
          <rect x="22" y="68" width="150" height="14" rx="4" fill="rgba(246,245,241,0.85)" />
          <rect x="22" y="92" width="120" height="6" rx="3" fill="rgba(246,245,241,0.25)" />
          <rect x="22" y="104" width="96" height="18" rx="9" fill="#f6f5f1" />
          <rect
            x="250"
            y="46"
            width="168"
            height="76"
            rx="12"
            fill="rgba(246,245,241,0.06)"
            stroke="rgba(246,245,241,0.12)"
          />
          <path
            d="M262 108 L 300 84 L 330 96 L 368 66 L 406 58"
            fill="none"
            stroke="rgba(246,245,241,0.6)"
            strokeWidth="1.5"
            className="reveal-draw"
            style={{ ["--dash" as string]: 180 }}
          />
        </g>

        {/* Journey path */}
        <path
          d={PATH}
          fill="none"
          stroke="rgba(246,245,241,0.18)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />
        <path
          d={PATH}
          fill="none"
          stroke="#f6f5f1"
          strokeWidth="1.5"
          className="reveal-draw"
          style={{ ["--dash" as string]: 460 }}
        />

        {[0, 2, 4].map((delay) => (
          <circle
            key={delay}
            r="3.5"
            fill="#f6f5f1"
            className="anim-travel motion-only"
            style={{ offsetPath: `path("${PATH}")`, ["--delay" as string]: `${delay}s` }}
          />
        ))}

        {stages.map((s, i) => {
          const y = [330, 300, 260, 200][i];
          const last = i === stages.length - 1;
          return (
            <g key={s.label}>
              {last && (
                <circle
                  cx={s.x}
                  cy={y}
                  r="14"
                  fill="none"
                  stroke="#f6f5f1"
                  strokeOpacity="0.5"
                  className="anim-pulse"
                />
              )}
              <circle
                cx={s.x}
                cy={y}
                r={last ? 9 : 6}
                fill={last ? "#f6f5f1" : "#0b0b0b"}
                stroke="#f6f5f1"
                strokeWidth="1.5"
              />
              <text
                x={s.x}
                y={y + 28}
                textAnchor="middle"
                fill="#f6f5f1"
                fontSize="12"
                fontWeight="500"
              >
                {s.label}
              </text>
              <text
                x={s.x}
                y={y + 42}
                textAnchor="middle"
                fill="rgba(246,245,241,0.5)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                {s.sub}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Notification card */}
      <div className="relative mx-4 mb-4 flex items-center gap-3 rounded-2xl border border-paper/15 bg-paper/[0.06] p-3 backdrop-blur sm:absolute sm:right-6 sm:bottom-6 sm:m-0 sm:w-72">
        <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-paper text-ink">
          <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
            <path
              d="M3 6.5 10 11l7-4.5M4 4.5h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">New enquiry received</span>
          <span className="block truncate font-mono text-[0.7rem] text-paper/55">
            Website redesign · added to CRM
          </span>
        </span>
      </div>
    </figure>
  );
}
