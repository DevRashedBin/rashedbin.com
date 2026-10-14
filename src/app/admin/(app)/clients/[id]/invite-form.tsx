"use client";

import { useActionState, useEffect, useRef } from "react";
import { idle } from "@/components/admin/action-state";
import { Input } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { inviteClientUserAction } from "../actions";

export function InviteForm({
  clientId,
  defaultName,
  defaultEmail,
}: {
  clientId: string;
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, action] = useActionState(inviteClientUserAction, idle);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") ref.current?.reset();
  }, [state]);
  const v = state.status === "error" ? (state.values ?? {}) : {};
  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          name="name"
          label="Name"
          defaultValue={v.name ?? defaultName}
          error={state.errors?.name}
        />
        <Input
          name="email"
          label="Email"
          type="email"
          defaultValue={v.email ?? defaultEmail}
          error={state.errors?.email}
        />
      </div>
      <FormMessage state={state} />
      <div>
        <SubmitButton variant="outline" pendingLabel="Inviting…">
          Give access and send invitation
        </SubmitButton>
      </div>
    </form>
  );
}
