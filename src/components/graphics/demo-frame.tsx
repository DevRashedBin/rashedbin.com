import { cn } from "@/lib/cn";

/**
 * Dark rounded panel that hosts a service explainer graphic.
 * `illustrative` adds a visible label so diagrams are never mistaken for
 * real client results.
 */
export function DemoFrame({
  title,
  illustrative = false,
  className,
  children,
}: {
  title: string;
  illustrative?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <figure
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[var(--radius-panel)] bg-ink text-paper",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines opacity-50" />
      <figcaption className="relative flex items-center justify-between gap-4 border-b border-paper/10 px-5 py-3.5 font-mono text-[0.7rem] tracking-[0.12em] uppercase">
        <span className="text-paper/70">{title}</span>
        {illustrative && (
          <span className="rounded-full border border-paper/20 px-2.5 py-1 text-[0.62rem] text-paper/60">
            Illustration
          </span>
        )}
      </figcaption>
      <div className="relative flex flex-1 flex-col justify-center p-5 sm:p-7">{children}</div>
    </figure>
  );
}
