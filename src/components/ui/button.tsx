import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { ArrowRight } from "./icons";

type Variant = "solid" | "outline" | "inverse" | "ghost";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,color,border-color,transform] duration-200 ease-out-soft active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  solid: "bg-ink text-paper hover:bg-graphite",
  outline: "border border-current/25 hover:border-current hover:bg-current/[0.04]",
  inverse: "bg-paper text-ink hover:bg-white",
  ghost: "underline-offset-4 hover:underline",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[0.95rem]",
};

export function buttonClasses({
  variant = "solid",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], variant !== "ghost" && sizes[size], className);
}

function Arrow() {
  return (
    <ArrowRight className="size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-0.5" />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
};

export function ButtonLink({
  variant,
  size,
  arrow,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; arrow?: boolean };

export function Button({
  variant,
  size,
  arrow,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}
