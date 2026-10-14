"use client";

import { useActionState, useEffect, useRef } from "react";
import { idle, type ActionState } from "./action-state";
import { Textarea } from "./fields";
import { FormMessage, SubmitButton } from "./form-controls";

/** Private note form for any record (client, lead, project). */
export function NoteForm({
  subjectId,
  action,
}: {
  subjectId: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, idle);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="subjectId" value={subjectId} />
      <Textarea
        name="body"
        label="New note"
        rows={3}
        error={state.errors?.body}
        defaultValue={state.status === "error" ? state.values?.body : undefined}
      />
      <FormMessage state={state} />
      <div>
        <SubmitButton variant="outline" pendingLabel="Adding…">
          Add note
        </SubmitButton>
      </div>
    </form>
  );
}
