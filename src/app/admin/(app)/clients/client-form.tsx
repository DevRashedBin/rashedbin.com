"use client";

import { useActionState } from "react";
import { idle, type ActionState } from "@/components/admin/action-state";
import { Input, Select, Textarea } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { CURRENCIES } from "@/domain/inquiry/schema";

export type ClientFormValues = {
  id?: string;
  displayName: string;
  companyName: string;
  contactName: string;
  billingEmail: string;
  phone: string;
  websiteUrl: string;
  billingAddress: string;
  countryCode: string;
  taxId: string;
  defaultCurrency: string;
};

export function ClientForm({
  action,
  values,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  values: ClientFormValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, idle);
  const e = state.errors ?? {};
  // After a failed submit, show what was typed rather than the saved values.
  const v = { ...values, ...(state.status === "error" ? state.values : {}) } as ClientFormValues;
  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="displayName"
          label="Client name"
          defaultValue={v.displayName}
          error={e.displayName}
          required
          hint="How the client appears in your dashboard."
        />
        <Input
          name="billingEmail"
          label="Billing email"
          type="email"
          defaultValue={v.billingEmail}
          error={e.billingEmail}
          required
        />
        <Input
          name="companyName"
          label="Company name"
          defaultValue={v.companyName}
          error={e.companyName}
        />
        <Input
          name="contactName"
          label="Contact person"
          defaultValue={v.contactName}
          error={e.contactName}
        />
        <Input name="phone" label="Phone" type="tel" defaultValue={v.phone} error={e.phone} />
        <Input
          name="websiteUrl"
          label="Website"
          defaultValue={v.websiteUrl}
          error={e.websiteUrl}
          placeholder="example.com"
        />
        <Input
          name="countryCode"
          label="Country code"
          defaultValue={v.countryCode}
          error={e.countryCode}
          placeholder="GB"
          maxLength={2}
          hint="Two letters, e.g. GB, US, BD."
        />
        <Select
          name="defaultCurrency"
          label="Default currency"
          defaultValue={v.defaultCurrency}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          error={e.defaultCurrency}
        />
        <Input name="taxId" label="Tax / VAT ID" defaultValue={v.taxId} error={e.taxId} />
      </div>
      <Textarea
        name="billingAddress"
        label="Billing address"
        defaultValue={v.billingAddress}
        error={e.billingAddress}
        rows={3}
      />
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
