"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ActionState } from "./action-state";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "solid" | "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant} aria-disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

/** Announces the result of the last submission to all users, including screen readers. */
export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  const ok = state.status === "success";
  return (
    <p
      role={ok ? "status" : "alert"}
      className={
        ok
          ? "rounded-xl border border-success/25 bg-success/5 px-3.5 py-2.5 text-sm text-success"
          : "rounded-xl border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
      }
    >
      {state.message}
    </p>
  );
}
