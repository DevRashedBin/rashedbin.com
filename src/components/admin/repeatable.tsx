"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type FieldDef = { key: string; label: string; multiline?: boolean; maxLength?: number };

/**
 * Editable list of objects (e.g. problems, FAQs). Serialised into one hidden
 * input as JSON; the server validates it with the content schema.
 */
export function RepeatableField<T extends Record<string, string>>({
  name,
  legend,
  fields,
  initial,
  max = 12,
  addLabel = "Add item",
  error,
}: {
  name: string;
  legend: string;
  fields: FieldDef[];
  initial: T[];
  max?: number;
  addLabel?: string;
  error?: string;
}) {
  const empty = Object.fromEntries(fields.map((f) => [f.key, ""])) as T;
  const [items, setItems] = useState<T[]>(initial.length ? initial : [empty]);

  const update = (i: number, key: string, value: string) =>
    setItems((list) => list.map((item, idx) => (idx === i ? { ...item, [key]: value } : item)));
  const move = (i: number, dir: -1 | 1) =>
    setItems((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <fieldset className="rounded-2xl border border-ink/10 p-4">
      <legend className="px-1 text-sm font-medium">{legend}</legend>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <ol className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i} className="rounded-xl bg-paper p-3">
            <div className="grid gap-2">
              {fields.map((f) => {
                const id = `${name}-${i}-${f.key}`;
                const common = {
                  id,
                  value: item[f.key] ?? "",
                  maxLength: f.maxLength,
                  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    update(i, f.key, e.target.value),
                  className:
                    "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-ink",
                };
                return (
                  <div key={f.key}>
                    <label htmlFor={id} className="mb-1 block text-xs text-stone">
                      {f.label} {i + 1}
                    </label>
                    {f.multiline ? <textarea rows={2} {...common} /> : <input {...common} />}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-1 text-xs">
              <ItemButton
                onClick={() => move(i, -1)}
                disabled={i === 0}
                label={`Move item ${i + 1} up`}
              >
                ↑
              </ItemButton>
              <ItemButton
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                label={`Move item ${i + 1} down`}
              >
                ↓
              </ItemButton>
              <ItemButton
                onClick={() => setItems((list) => list.filter((_, idx) => idx !== i))}
                disabled={items.length <= 1}
                label={`Remove item ${i + 1}`}
              >
                Remove
              </ItemButton>
            </div>
          </li>
        ))}
      </ol>
      {items.length < max && (
        <button
          type="button"
          onClick={() => setItems((list) => [...list, empty])}
          className="mt-3 rounded-full border border-ink/20 px-3.5 py-1.5 text-xs hover:border-ink"
        >
          + {addLabel}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </fieldset>
  );
}

/** Editable list of plain strings. */
export function StringListField({
  name,
  legend,
  initial,
  max = 12,
  error,
}: {
  name: string;
  legend: string;
  initial: string[];
  max?: number;
  error?: string;
}) {
  const [items, setItems] = useState<string[]>(initial.length ? initial : [""]);
  return (
    <fieldset className="rounded-2xl border border-ink/10 p-4">
      <legend className="px-1 text-sm font-medium">{legend}</legend>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <ol className="flex flex-col gap-2">
        {items.map((value, i) => (
          <li key={i} className="flex gap-2">
            <label className="sr-only" htmlFor={`${name}-${i}`}>
              {legend} {i + 1}
            </label>
            <input
              id={`${name}-${i}`}
              value={value}
              onChange={(e) => setItems((l) => l.map((v, idx) => (idx === i ? e.target.value : v)))}
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-ink"
            />
            <ItemButton
              onClick={() => setItems((l) => l.filter((_, idx) => idx !== i))}
              disabled={items.length <= 1}
              label={`Remove ${legend} ${i + 1}`}
            >
              ✕
            </ItemButton>
          </li>
        ))}
      </ol>
      {items.length < max && (
        <button
          type="button"
          onClick={() => setItems((l) => [...l, ""])}
          className="mt-3 rounded-full border border-ink/20 px-3.5 py-1.5 text-xs hover:border-ink"
        >
          + Add
        </button>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </fieldset>
  );
}

function ItemButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "shrink-0 rounded-full border border-ink/15 bg-white px-2.5 py-1 hover:border-ink",
        disabled && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}
