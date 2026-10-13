"use client";

import { useId, useState } from "react";
import { DemoFrame } from "../demo-frame";

/**
 * Drag-to-compare redesign illustration. Uses a native range input, so it is
 * keyboard and screen-reader operable. Content is a generic wireframe, labelled
 * as an illustration — real before/after work is shown only in case studies.
 */
export function BeforeAfterDemo() {
  const [pos, setPos] = useState(50);
  const id = useId();

  return (
    <DemoFrame title="Before / after" illustrative>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl select-none">
        <Before />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <After />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-px bg-paper"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink shadow-lg">
            <svg viewBox="0 0 20 20" className="size-4" fill="none">
              <path
                d="M7 6 3 10l4 4M13 6l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <span className="absolute top-3 left-3 rounded-full bg-ink/80 px-2.5 py-1 font-mono text-[0.62rem] tracking-wide text-paper uppercase">
          Before
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-paper px-2.5 py-1 font-mono text-[0.62rem] tracking-wide text-ink uppercase">
          After
        </span>
        <label htmlFor={id} className="sr-only">
          Compare before and after redesign
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-paper/55">
        Drag to compare a cluttered layout with a clear one: a single message, an obvious next step
        and room to breathe.
      </p>
    </DemoFrame>
  );
}

function Before() {
  return (
    <svg
      viewBox="0 0 400 300"
      className="absolute inset-0 h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="300" fill="#2a2a29" />
      <rect x="0" y="0" width="400" height="34" fill="#3a3a38" />
      {[12, 70, 128, 186, 244, 302].map((x) => (
        <rect key={x} x={x} y="13" width="46" height="8" rx="2" fill="#6f6e69" />
      ))}
      <rect x="0" y="34" width="400" height="20" fill="#55544f" />
      <rect x="20" y="64" width="360" height="90" fill="#4a4945" />
      <text x="200" y="112" textAnchor="middle" fill="#a9a8a2" fontSize="13" fontFamily="serif">
        WELCOME TO OUR WEBSITE!!!
      </text>
      {[20, 140, 260].map((x) => (
        <g key={x}>
          <rect x={x} y="166" width="110" height="60" fill="#3f3e3b" />
          <rect x={x + 8} y="174" width="94" height="5" fill="#6f6e69" />
          <rect x={x + 8} y="184" width="80" height="5" fill="#6f6e69" />
          <rect x={x + 8} y="194" width="88" height="5" fill="#6f6e69" />
        </g>
      ))}
      <rect x="20" y="236" width="360" height="5" fill="#55544f" />
      <rect x="20" y="248" width="300" height="5" fill="#55544f" />
      <rect x="20" y="260" width="330" height="5" fill="#55544f" />
      <rect x="300" y="272" width="80" height="16" fill="#6f6e69" />
    </svg>
  );
}

function After() {
  return (
    <svg
      viewBox="0 0 400 300"
      className="absolute inset-0 h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="300" fill="#f6f5f1" />
      <rect x="24" y="20" width="40" height="8" rx="4" fill="#0b0b0b" />
      <rect x="300" y="16" width="76" height="16" rx="8" fill="#0b0b0b" />
      <rect x="24" y="64" width="210" height="18" rx="3" fill="#0b0b0b" />
      <rect x="24" y="88" width="160" height="18" rx="3" fill="#0b0b0b" />
      <rect x="24" y="118" width="190" height="6" rx="3" fill="#a9a8a2" />
      <rect x="24" y="130" width="150" height="6" rx="3" fill="#a9a8a2" />
      <rect x="24" y="150" width="96" height="24" rx="12" fill="#0b0b0b" />
      <rect x="128" y="150" width="84" height="24" rx="12" fill="none" stroke="#0b0b0b" />
      <rect x="250" y="60" width="126" height="118" rx="16" fill="#0b0b0b" />
      <path
        d="M266 156 l24 -22 l18 12 l28 -30 l24 -10"
        fill="none"
        stroke="#f6f5f1"
        strokeWidth="2"
      />
      {[24, 144, 264].map((x) => (
        <g key={x}>
          <rect x={x} y="200" width="112" height="76" rx="14" fill="#ffffff" stroke="#e6e4df" />
          <rect x={x + 12} y="214" width="50" height="6" rx="3" fill="#0b0b0b" />
          <rect x={x + 12} y="228" width="84" height="4" rx="2" fill="#a9a8a2" />
          <rect x={x + 12} y="238" width="70" height="4" rx="2" fill="#a9a8a2" />
        </g>
      ))}
    </svg>
  );
}
