"use client";

import { useActionState } from "react";
import { Input } from "@/components/admin/fields";
import { SubmitButton } from "@/components/admin/form-controls";
import { requestPortalCode, verifyPortalCode, type PortalLoginState } from "../actions";

export function PortalLoginForm() {
  const [emailState, requestAction] = useActionState<PortalLoginState, FormData>(
    requestPortalCode,
    { step: "email" },
  );
  const [codeState, verifyAction] = useActionState<PortalLoginState, FormData>(verifyPortalCode, {
    step: "email",
  });

  if (emailState.step === "code") {
    const error = codeState.step === "code" ? codeState.error : undefined;
    return (
      <form action={verifyAction} className="mt-7 flex flex-col gap-4">
        <p role="status" className="rounded-xl bg-paper px-3.5 py-3 text-sm">
          If <strong>{emailState.email}</strong> has a client account, a 6-digit code is on its way.
          It expires shortly.
        </p>
        <input type="hidden" name="email" value={emailState.email} />
        <Input
          name="code"
          label="Sign-in code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          error={error}
        />
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>
    );
  }

  return (
    <form action={requestAction} className="mt-7 flex flex-col gap-4">
      <Input
        name="email"
        label="Email address"
        type="email"
        autoComplete="email"
        required
        error={emailState.error}
      />
      <SubmitButton pendingLabel="Sending…">Email me a code</SubmitButton>
      <p className="text-xs text-stone">Access is by invitation for existing clients.</p>
    </form>
  );
}
