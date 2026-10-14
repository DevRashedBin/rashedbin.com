"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ash focus:border-ink focus:ring-4 focus:ring-ink/10";

type Common = {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  required?: boolean;
};

function Wrapper({
  id,
  label,
  error,
  hint,
  className,
  required,
  children,
}: Omit<Common, "name"> & { id: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && (
          <span className="ml-1 text-stone" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="mt-1.5 text-xs text-stone">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({
  name,
  label,
  error,
  hint,
  className,
  required,
  ...props
}: Common & Omit<React.ComponentProps<"input">, "name">) {
  // Unique per instance: several forms on one page can share a field name.
  const id = `f-${name}-${useId().replace(/:/g, "")}`;
  return (
    <Wrapper
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
      required={required}
    >
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={cn(control, error ? "border-danger" : "border-ink/15")}
        {...props}
      />
    </Wrapper>
  );
}

export function Textarea({
  name,
  label,
  error,
  hint,
  className,
  required,
  rows = 4,
  ...props
}: Common & Omit<React.ComponentProps<"textarea">, "name">) {
  // Unique per instance: several forms on one page can share a field name.
  const id = `f-${name}-${useId().replace(/:/g, "")}`;
  return (
    <Wrapper
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
      required={required}
    >
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={cn(
          control,
          "resize-y leading-relaxed",
          error ? "border-danger" : "border-ink/15",
        )}
        {...props}
      />
    </Wrapper>
  );
}

export function Select({
  name,
  label,
  error,
  hint,
  className,
  required,
  options,
  ...props
}: Common &
  Omit<React.ComponentProps<"select">, "name"> & {
    options: readonly { value: string; label: string }[];
  }) {
  // Unique per instance: several forms on one page can share a field name.
  const id = `f-${name}-${useId().replace(/:/g, "")}`;
  return (
    <Wrapper
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
      required={required}
    >
      <select
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(control, "appearance-none", error ? "border-danger" : "border-ink/15")}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function Toggle({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-ink"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-stone">{description}</span>}
      </span>
    </label>
  );
}
