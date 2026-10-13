import { cn } from "@/lib/cn";

/** Numbered editorial label, e.g. "01 — Services". */
export function SectionLabel({
  index,
  children,
  className,
}: {
  index?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-mono text-xs tracking-[0.14em] uppercase opacity-70",
        className,
      )}
    >
      {index && <span>{index}</span>}
      {index && <span aria-hidden className="h-px w-8 bg-current opacity-50" />}
      <span>{children}</span>
    </p>
  );
}
