"use client";

import { useActionState, useRef, useState } from "react";
import { idle } from "@/components/admin/action-state";
import { Input, Select } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { Button } from "@/components/ui/button";
import { PRIORITIES, PRIORITY_LABELS } from "@/domain/leads/format";
import { convertLeadAction, updateLeadStatusAction } from "../actions";

export function LeadStatusForm({
  leadId,
  stage,
  priority,
  stages,
}: {
  leadId: string;
  stage: string;
  priority: string;
  stages: { key: string; label: string }[];
}) {
  const [state, action] = useActionState(updateLeadStatusAction, idle);
  // Controlled, and re-synced when the saved values change (e.g. a follow-up
  // moved the lead to Contacted), without losing the confirmation message.
  const [values, setValues] = useState({ stage, priority });
  const [saved, setSaved] = useState({ stage, priority });
  if (saved.stage !== stage || saved.priority !== priority) {
    setSaved({ stage, priority });
    setValues({ stage, priority });
  }
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="leadId" value={leadId} />
      <Select
        name="stage"
        label="Stage"
        value={values.stage}
        onChange={(e) => setValues((v) => ({ ...v, stage: e.target.value }))}
        options={stages.map((s) => ({ value: s.key, label: s.label }))}
      />
      <Select
        name="priority"
        label="Priority"
        value={values.priority}
        onChange={(e) => setValues((v) => ({ ...v, priority: e.target.value }))}
        options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
      />
      <FormMessage state={state} />
      <div>
        <SubmitButton variant="outline">Update</SubmitButton>
      </div>
    </form>
  );
}

export function ConvertLeadDialog({
  leadId,
  defaultTitle,
  statuses,
}: {
  leadId: string;
  defaultTitle: string;
  statuses: { key: string; label: string }[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState(convertLeadAction, idle);
  return (
    <>
      <Button onClick={() => ref.current?.showModal()}>Convert to project</Button>
      <dialog
        ref={ref}
        aria-labelledby="convert-title"
        className="m-auto w-[min(92vw,480px)] rounded-[1.5rem] p-0 backdrop:bg-ink/50"
      >
        <form action={action} className="flex flex-col gap-4 p-6">
          <input type="hidden" name="leadId" value={leadId} />
          <h2 id="convert-title" className="text-lg font-medium">
            Convert to project
          </h2>
          <p className="text-sm text-graphite">
            Creates the project, links it to an existing client with the same email or creates a new
            client, and marks this lead as Won. Running it again never creates a duplicate.
          </p>
          <FormMessage state={state} />
          <Input
            name="title"
            label="Project title"
            defaultValue={state.values?.title ?? defaultTitle}
            error={state.errors?.title}
            required
          />
          <Select
            name="status"
            label="Starting status"
            defaultValue={state.values?.status ?? "awaiting_deposit"}
            options={statuses.map((s) => ({ value: s.key, label: s.label }))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => ref.current?.close()}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Creating…">Create project</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
