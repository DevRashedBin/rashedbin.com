"use client";

import { useActionState } from "react";
import { idle, type ActionState } from "@/components/admin/action-state";
import { Input, Select, Textarea } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { CURRENCY_CODES } from "@/domain/money/money";

export type ProjectFormValues = {
  projectId?: string;
  clientId?: string;
  statusKey?: string;
  title: string;
  description: string;
  serviceSlug: string;
  currency: string;
  value: string;
  startDate: string;
  targetDate: string;
};

type Option = { value: string; label: string };

export function ProjectForm({
  action,
  values,
  submitLabel,
  clients,
  statuses,
  services,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  values: ProjectFormValues;
  submitLabel: string;
  /** Only when creating: choose the client and starting status. */
  clients?: Option[];
  statuses?: Option[];
  services: Option[];
}) {
  const [state, formAction] = useActionState(action, idle);
  const e = state.errors ?? {};
  const v = { ...values, ...(state.status === "error" ? state.values : {}) } as ProjectFormValues;
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {values.projectId && <input type="hidden" name="projectId" value={values.projectId} />}
      <FormMessage state={state} />
      {clients && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            name="clientId"
            label="Client"
            defaultValue={v.clientId ?? ""}
            options={[{ value: "", label: "Choose a client…" }, ...clients]}
            error={e.clientId}
            required
          />
          {statuses && (
            <Select
              name="statusKey"
              label="Status"
              defaultValue={v.statusKey ?? "confirmed"}
              options={statuses}
            />
          )}
        </div>
      )}
      <Input name="title" label="Project title" defaultValue={v.title} error={e.title} required />
      <Select
        name="serviceSlug"
        label="Service"
        defaultValue={v.serviceSlug}
        options={[{ value: "", label: "—" }, ...services]}
      />
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Input
          name="value"
          label="Agreed value"
          inputMode="decimal"
          defaultValue={v.value}
          error={e.value}
          placeholder="e.g. 2,000.00"
          hint="Leave empty until agreed."
        />
        <Select
          name="currency"
          label="Currency"
          defaultValue={v.currency}
          options={CURRENCY_CODES.map((c) => ({ value: c, label: c }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="startDate"
          label="Start date"
          type="date"
          defaultValue={v.startDate}
          error={e.startDate}
        />
        <Input
          name="targetDate"
          label="Target completion"
          type="date"
          defaultValue={v.targetDate}
          error={e.targetDate}
        />
      </div>
      <Textarea
        name="description"
        label="Description"
        rows={4}
        defaultValue={v.description}
        error={e.description}
        hint="Visible to the client in their project area."
      />
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
