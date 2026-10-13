import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10", className)}
      {...props}
    />
  );
}

type SectionProps = ComponentProps<"section"> & { tone?: "paper" | "white" | "ink" };

/** Page band. Alternating tones give rhythm without decorative gradients. */
export function Section({ tone = "paper", className, ...props }: SectionProps) {
  return (
    <section
      className={cn(
        "py-16 sm:py-20 lg:py-24",
        tone === "ink" && "bg-ink text-paper",
        tone === "white" && "bg-white",
        className,
      )}
      {...props}
    />
  );
}
