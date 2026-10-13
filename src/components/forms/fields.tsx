"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

const inputBase =
  "w-full rounded-2xl border bg-white px-4 py-3.5 text-base text-ink placeholder:text-ash transition-colors duration-150 outline-none focus:border-ink focus-visible:outline-none focus:ring-4 focus:ring-ink/10";

function Message({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error)
    return (
      <p id={id} className="mt-2 text-sm text-danger">
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={id} className="mt-2 text-sm text-stone">
        {hint}
      </p>
    );
  return null;
}

type BaseProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  optionalLabel?: boolean;
};

export function TextField({
  name,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  optionalLabel,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
}: BaseProps & {
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
}) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between text-sm font-medium">
        <span>{label}</span>
        {optionalLabel && <span className="text-xs font-normal text-stone">Optional</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? msgId : undefined}
        className={cn(inputBase, error ? "border-danger" : "border-ink/15")}
      />
      <Message id={msgId} error={error} hint={hint} />
    </div>
  );
}

export function TextArea({
  name,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  maxLength,
  rows = 6,
  placeholder,
}: BaseProps & { maxLength?: number; rows?: number; placeholder?: string }) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between text-sm font-medium">
        <span>{label}</span>
        {maxLength && (
          <span className="font-mono text-xs font-normal text-stone" aria-hidden>
            {value.length}/{maxLength}
          </span>
        )}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? msgId : undefined}
        className={cn(
          inputBase,
          "resize-y leading-relaxed",
          error ? "border-danger" : "border-ink/15",
        )}
      />
      <Message id={msgId} error={error} hint={hint} />
    </div>
  );
}

type Option = { value: string; label: string; description?: string };

/** Radio group rendered as selectable cards or pills, built on native radios. */
export function ChoiceGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  hint,
  variant = "card",
  columns = "sm:grid-cols-2",
  hideLegend,
}: {
  name: string;
  legend: string;
  options: readonly Option[];
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  variant?: "card" | "pill";
  columns?: string;
  hideLegend?: boolean;
}) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <fieldset
      aria-describedby={error || hint ? msgId : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className={cn("mb-3 text-sm font-medium", hideLegend && "sr-only")}>{legend}</legend>
      <div
        className={cn(variant === "card" ? cn("grid gap-2.5", columns) : "flex flex-wrap gap-2")}
      >
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "relative cursor-pointer border transition-colors duration-150 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ink/15",
                variant === "card"
                  ? "flex flex-col rounded-2xl px-4 py-3.5"
                  : "rounded-full px-4 py-2.5 text-sm",
                checked
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/15 bg-white hover:border-ink/40",
                error && !checked && "border-danger/60",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span className={cn(variant === "card" && "font-medium")}>{opt.label}</span>
              {opt.description && (
                <span className={cn("mt-1 text-xs", checked ? "text-paper/65" : "text-stone")}>
                  {opt.description}
                </span>
              )}
            </label>
          );
        })}
      </div>
      <Message id={msgId} error={error} hint={hint} />
    </fieldset>
  );
}

export function Checkbox({
  name,
  checked,
  onChange,
  error,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div>
      <div className="flex gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? msgId : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-ink"
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-graphite">
          {children}
        </label>
      </div>
      <Message id={msgId} error={error} />
    </div>
  );
}
