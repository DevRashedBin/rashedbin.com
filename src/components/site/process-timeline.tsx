import { processNote, processSteps } from "@/content/process";

export function ProcessTimeline({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  const muted = tone === "ink" ? "text-paper/55" : "text-stone";
  return (
    <div>
      <ol className="relative grid gap-0 lg:grid-cols-5 lg:gap-6">
        {/* Desktop connector */}
        <span
          aria-hidden
          className="absolute top-[1.375rem] right-0 left-0 hidden h-px bg-current/20 lg:block"
        />
        <span
          aria-hidden
          className="reveal-fill absolute top-[1.375rem] right-0 left-0 hidden h-px bg-current lg:block"
        />
        {processSteps.map((step, i) => (
          <li
            key={step.key}
            className="reveal relative grid grid-cols-[auto_1fr] gap-5 pb-10 last:pb-0 lg:block lg:pb-0"
          >
            {/* Mobile connector */}
            {i < processSteps.length - 1 && (
              <span
                aria-hidden
                className="absolute top-12 bottom-0 left-[1.375rem] w-px bg-current/20 lg:hidden"
              />
            )}
            <span
              className={`relative z-10 grid size-11 place-items-center rounded-full border border-current/30 font-mono text-xs ${tone === "ink" ? "bg-ink" : "bg-paper"}`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="lg:mt-6">
              <p className={`font-mono text-[0.7rem] tracking-[0.12em] uppercase ${muted}`}>
                {step.duration}
              </p>
              <h3 className="mt-1.5 text-xl font-medium tracking-tight">{step.title}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className={`mt-10 text-xs ${muted}`}>{processNote}</p>
    </div>
  );
}
