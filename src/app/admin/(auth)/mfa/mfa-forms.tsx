"use client";

import { useActionState, useState, useTransition } from "react";
import { idle } from "@/components/admin/action-state";
import { Input } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { Button } from "@/components/ui/button";
import { startTotpEnrolment, verifyTotp, type EnrolState } from "../actions";

export function MfaVerify({ factorId }: { factorId: string }) {
  const [state, action] = useActionState(verifyTotp, idle);
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <p className="text-sm text-graphite">
        Open your authenticator app and enter the 6-digit code.
      </p>
      <FormMessage state={state} />
      <input type="hidden" name="factorId" value={factorId} />
      <Input
        name="code"
        label="Verification code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        required
        autoFocus
        error={state.errors?.code}
      />
      <SubmitButton pendingLabel="Verifying…">Verify</SubmitButton>
    </form>
  );
}

export function MfaEnrol() {
  const [enrol, setEnrol] = useState<EnrolState>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  if (enrol.status !== "ready") {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <p className="text-sm text-graphite">
          The admin area requires an authenticator app (such as 1Password, Google Authenticator or
          Authy). You&rsquo;ll scan a QR code once, then enter a code each time you sign in.
        </p>
        {enrol.status === "error" && (
          <p role="alert" className="text-sm text-danger">
            {enrol.message}
          </p>
        )}
        <Button
          disabled={pending}
          onClick={() => startTransition(async () => setEnrol(await startTotpEnrolment()))}
        >
          {pending ? "Preparing…" : "Set up authenticator"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      <p className="text-sm text-graphite">
        Scan this QR code with your authenticator app, then enter the code it shows.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URI SVG from Supabase */}
      <img
        src={enrol.qrCode}
        alt="QR code for your authenticator app"
        className="mx-auto size-48 rounded-xl bg-white p-2"
      />
      <details className="text-sm">
        <summary className="cursor-pointer text-stone">
          Can&rsquo;t scan? Enter this key manually
        </summary>
        <code
          className="mt-2 block rounded-lg bg-white p-3 font-mono text-xs break-all"
          data-testid="totp-secret"
        >
          {enrol.secret}
        </code>
      </details>
      <MfaVerify factorId={enrol.factorId} />
    </div>
  );
}
