"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";

/**
 * Confirmation dialog for consequential actions. The action itself still runs
 * on the server with its own authorisation check.
 */
export function ConfirmAction({
  action,
  label,
  title,
  body,
  confirmLabel,
  hidden,
  variant = "outline",
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  title: string;
  body: string;
  confirmLabel: string;
  hidden?: Record<string, string>;
  variant?: "solid" | "outline";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button variant={variant} onClick={() => ref.current?.showModal()}>
        {label}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby="confirm-title"
        className="m-auto w-[min(92vw,440px)] rounded-[1.5rem] p-0 backdrop:bg-ink/50"
      >
        <form action={action} className="p-6">
          {Object.entries(hidden ?? {}).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <h2 id="confirm-title" className="text-lg font-medium">
            {title}
          </h2>
          <p className="mt-2 text-sm text-graphite">{body}</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => ref.current?.close()}>
              Cancel
            </Button>
            <Button type="submit" onClick={() => ref.current?.close()}>
              {confirmLabel}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
