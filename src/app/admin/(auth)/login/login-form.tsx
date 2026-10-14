"use client";

import { useActionState } from "react";
import { idle } from "@/components/admin/action-state";
import { Input } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { signInAdmin } from "../actions";

export function AdminLoginForm() {
  const [state, action] = useActionState(signInAdmin, idle);
  return (
    <form action={action} className="mt-7 flex flex-col gap-4">
      <FormMessage state={state} />
      <Input name="email" label="Email" type="email" autoComplete="username" required />
      <Input
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
      />
      <SubmitButton pendingLabel="Signing in…">Continue</SubmitButton>
    </form>
  );
}
