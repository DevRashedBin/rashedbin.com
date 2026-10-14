"use client";

import { useActionState, useState } from "react";
import { idle } from "@/components/admin/action-state";
import { Input, Select, Textarea, Toggle } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { CURRENCIES } from "@/domain/inquiry/schema";
import { formatBusinessNumber } from "@/domain/settings/schema";
import { saveSettingsAction } from "./actions";

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [state, action] = useActionState(saveSettingsAction, idle);
  const e = state.errors ?? {};
  const v = { ...values, ...(state.status === "error" ? state.values : {}) };
  const [prefix, setPrefix] = useState(v.invoicePrefix);
  const [padding, setPadding] = useState(Number(v.numberPadding));
  const preview =
    /^[A-Za-z0-9]{1,10}$/.test(prefix) && padding >= 3 && padding <= 8
      ? formatBusinessNumber(prefix.toUpperCase(), new Date().getFullYear(), 1, padding)
      : "—";

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormMessage state={state} />
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-sm font-medium">Business</legend>
        <Input
          name="businessName"
          label="Business name"
          defaultValue={v.businessName}
          error={e.businessName}
          required
        />
        <Input name="legalName" label="Legal name" defaultValue={v.legalName} error={e.legalName} />
        <Input
          name="contactEmail"
          label="Contact email"
          type="email"
          defaultValue={v.contactEmail}
          error={e.contactEmail}
        />
        <Input
          name="notificationEmail"
          label="Notification email"
          type="email"
          defaultValue={v.notificationEmail}
          error={e.notificationEmail}
          hint="New enquiry alerts are sent here."
        />
        <Input
          name="consultationUrl"
          label="Booking link"
          defaultValue={v.consultationUrl}
          error={e.consultationUrl}
          placeholder="https://cal.com/…"
          hint="Used as {{consultation_link}} in follow-up emails."
        />
        <Input name="phone" label="Phone" defaultValue={v.phone} error={e.phone} />
        <Input name="website" label="Website" defaultValue={v.website} error={e.website} />
        <Input
          name="taxId"
          label="Tax / trade licence / VAT ID"
          defaultValue={v.taxId}
          error={e.taxId}
        />
        <Textarea
          name="address"
          label="Business address"
          defaultValue={v.address}
          error={e.address}
          rows={3}
          className="sm:col-span-2"
          hint="Shown on invoices. Leave empty if you don't want an address printed."
        />
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">Client notifications (defaults)</legend>
        <Toggle
          name="notifyClientUpdates"
          label="Email clients when I publish a project update"
          description="You can still untick it for an individual update."
          defaultChecked={v.notifyClientUpdates === "on"}
        />
        <Toggle
          name="notifyClientMilestones"
          label="Email clients when I complete a visible milestone"
          defaultChecked={v.notifyClientMilestones === "on"}
        />
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-sm font-medium">Numbering & invoices</legend>
        <Input
          name="invoicePrefix"
          label="Invoice prefix"
          defaultValue={v.invoicePrefix}
          error={e.invoicePrefix}
          onChange={(ev) => setPrefix(ev.target.value)}
        />
        <Input
          name="projectPrefix"
          label="Project reference prefix"
          defaultValue={v.projectPrefix}
          error={e.projectPrefix}
        />
        <Input
          name="numberPadding"
          label="Number digits"
          type="number"
          min={3}
          max={8}
          defaultValue={v.numberPadding}
          error={e.numberPadding}
          onChange={(ev) => setPadding(Number(ev.target.value))}
          hint={`Next invoice looks like ${preview}`}
        />
        <Input
          name="defaultPaymentTermsDays"
          label="Default payment terms (days)"
          type="number"
          min={0}
          max={365}
          defaultValue={v.defaultPaymentTermsDays}
          error={e.defaultPaymentTermsDays}
        />
        <Select
          name="defaultCurrency"
          label="Default currency"
          defaultValue={v.defaultCurrency}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          error={e.defaultCurrency}
        />
        <Textarea
          name="invoiceFooter"
          label="Invoice footer"
          defaultValue={v.invoiceFooter}
          error={e.invoiceFooter}
          rows={2}
          className="sm:col-span-2"
        />
        <Textarea
          name="defaultTerms"
          label="Default terms"
          defaultValue={v.defaultTerms}
          error={e.defaultTerms}
          rows={4}
          className="sm:col-span-2"
        />
      </fieldset>
      <div>
        <SubmitButton>Save settings</SubmitButton>
      </div>
    </form>
  );
}
