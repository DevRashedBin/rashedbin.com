"use client";

import { useActionState, useEffect, useRef } from "react";
import { idle } from "@/components/admin/action-state";
import { Textarea } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { addClientNoteAction } from "../actions";

export function NoteForm({ clientId }: { clientId: string }) {
  const [state, action] = useActionState(addClientNoteAction, idle);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="clientId" value={clientId} />
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
