import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" aria-label="Rashed — home" className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={cn(
          "grid size-8 place-items-center rounded-full text-[1.05rem] leading-none",
          inverse ? "bg-paper text-ink" : "bg-ink text-paper",
        )}
      >
        <span className="accent">R</span>
      </span>
      <span className="text-lg font-semibold tracking-tight">Rashed</span>
    </Link>
  );
}
