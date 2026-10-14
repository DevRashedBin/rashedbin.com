/** Shape returned by every admin Server Action used with useActionState. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<string, string>>;
  /** Submitted values, echoed back on error so React's post-action form reset keeps them. */
  values?: Record<string, string>;
};

export function submittedValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries())
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
}

export const idle: ActionState = { status: "idle" };
