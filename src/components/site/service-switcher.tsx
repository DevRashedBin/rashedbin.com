"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type SwitcherTab = { key: string; label: string; index: string };

/**
 * WAI-ARIA tabs. Panels are rendered on the server and passed in, so all
 * service content is present in the HTML; only visibility changes here.
 */
export function ServiceSwitcher({
  tabs,
  panels,
}: {
  tabs: SwitcherTab[];
  panels: React.ReactNode[];
}) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusTab(i: number) {
    const next = (i + tabs.length) % tabs.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const keys: Record<string, () => void> = {
      ArrowDown: () => focusTab(i + 1),
      ArrowRight: () => focusTab(i + 1),
      ArrowUp: () => focusTab(i - 1),
      ArrowLeft: () => focusTab(i - 1),
      Home: () => focusTab(0),
      End: () => focusTab(tabs.length - 1),
    };
    const fn = keys[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.8fr)_2fr] lg:gap-10">
      <div
        role="tablist"
        aria-label="Services"
        aria-orientation="vertical"
        className="-mx-4 flex snap-x [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0"
      >
        {tabs.map((tab, i) => {
          const selected = i === active;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "flex shrink-0 snap-start items-center gap-3 rounded-full border px-4 py-2.5 text-left text-sm transition-colors duration-200 lg:rounded-2xl lg:px-5 lg:py-4 lg:text-base",
                selected
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/10 bg-white hover:border-ink/30",
              )}
            >
              <span
                className={cn("font-mono text-[0.7rem]", selected ? "text-paper/60" : "text-stone")}
              >
                {tab.index}
              </span>
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {panels.map((panel, i) => (
        <div
          key={tabs[i].key}
          role="tabpanel"
          id={`${baseId}-panel-${i}`}
          aria-labelledby={`${baseId}-tab-${i}`}
          hidden={i !== active}
          tabIndex={0}
          className="focus-visible:outline-offset-8"
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
