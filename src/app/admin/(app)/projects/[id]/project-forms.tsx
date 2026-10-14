"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { idle } from "@/components/admin/action-state";
import { Input, Select, Textarea } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { cn } from "@/lib/cn";
import {
  addMilestoneAction,
  changeProjectStatusAction,
  milestoneOpAction,
  postUpdateAction,
} from "../actions";

type Status = {
  key: string;
  label: string;
  client_label: string;
  notify_client_by_default: boolean;
};

export function StatusForm({
  projectId,
  current,
  statuses,
  idempotencyKey,
}: {
  projectId: string;
  current: string;
  statuses: Status[];
  idempotencyKey: string;
}) {
  const [state, action] = useActionState(changeProjectStatusAction, idle);
  const [selected, setSelected] = useState(current);
  const [synced, setSynced] = useState(current);
  if (synced !== current) {
    setSynced(current);
    setSelected(current);
  }
  const status = statuses.find((s) => s.key === selected);
  const [notify, setNotify] = useState(false);
  const [notifyFor, setNotifyFor] = useState(selected);
  if (notifyFor !== selected) {
    setNotifyFor(selected);
    setNotify(selected !== current && Boolean(status?.notify_client_by_default));
  }
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <Select
        name="status"
        label="Status"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        options={statuses.map((s) => ({ value: s.key, label: s.label }))}
      />
      {status && <p className="text-xs text-stone">The client sees: “{status.client_label}”</p>}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="notify"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          disabled={selected === current}
          className="size-4 accent-ink"
        />
        Email the client about this change
      </label>
      <FormMessage state={state} />
      <div>
        <SubmitButton variant="outline">Change status</SubmitButton>
      </div>
    </form>
  );
}

export function UpdateComposer({
  projectId,
  idempotencyKey,
  notifyByDefault,
}: {
  projectId: string;
  idempotencyKey: string;
  notifyByDefault: boolean;
}) {
  const [state, action] = useActionState(postUpdateAction, idle);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") ref.current?.reset();
  }, [state]);
  const v = state.status === "error" ? (state.values ?? {}) : {};
  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <p className="rounded-xl bg-paper px-3 py-2 text-xs text-graphite">
        Updates are published to the client area. Use private notes for anything the client
        shouldn&rsquo;t see.
      </p>
      <Input
        name="title"
        label="Title (optional)"
        defaultValue={v.title}
        error={state.errors?.title}
      />
      <Textarea
        name="body"
        label="Update for the client"
        rows={4}
        defaultValue={v.body}
        error={state.errors?.body}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="notify"
          defaultChecked={notifyByDefault}
          className="size-4 accent-ink"
        />
        Email this update to the client
      </label>
      <FormMessage state={state} />
      <div>
        <SubmitButton pendingLabel="Publishing…">Publish update</SubmitButton>
      </div>
    </form>
  );
}

export function AddMilestoneForm({ projectId }: { projectId: string }) {
  const [state, action] = useActionState(addMilestoneAction, idle);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") ref.current?.reset();
  }, [state]);
  const v = state.status === "error" ? (state.values ?? {}) : {};
  return (
    <form
      ref={ref}
      action={action}
      className="grid gap-3 rounded-xl border border-dashed border-ink/20 p-3 sm:grid-cols-[1fr_160px]"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <Input
        name="title"
        label="New milestone"
        defaultValue={v.title}
        error={state.errors?.title}
      />
      <Input
        name="dueDate"
        label="Due"
        type="date"
        defaultValue={v.dueDate}
        error={state.errors?.dueDate}
      />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="clientVisible" defaultChecked className="size-4 accent-ink" />
        Visible to the client
      </label>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
        <SubmitButton variant="outline">Add milestone</SubmitButton>
      </div>
    </form>
  );
}

export type MilestoneRowData = {
  id: string;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  client_visible: boolean;
  dueLabel: string;
  overdue: boolean;
};

export function MilestoneRow({
  m,
  first,
  last,
  notifyByDefault,
}: {
  m: MilestoneRowData;
  first: boolean;
  last: boolean;
  notifyByDefault: boolean;
}) {
  const [state, action] = useActionState(milestoneOpAction, idle);
  const done = Boolean(m.completed_at);
  const btn =
    "rounded-full border border-ink/15 px-2.5 py-1 text-xs hover:border-ink disabled:opacity-40";
  return (
    <li className="rounded-xl border border-ink/10 p-3">
      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="milestoneId" value={m.id} />
        <div className="flex items-start justify-between gap-3">
          <span>
            <span className={cn("block text-sm font-medium", done && "text-stone line-through")}>
              {m.title}
            </span>
            <span className={cn("block text-xs", m.overdue ? "text-danger" : "text-stone")}>
              {done ? "Completed" : m.dueLabel}
              {!m.client_visible && " · Hidden from client"}
            </span>
          </span>
          <span className="flex shrink-0 gap-1">
            <button
              className={btn}
              name="op"
              value="up"
              disabled={first}
              aria-label={`Move ${m.title} up`}
            >
              ↑
            </button>
            <button
              className={btn}
              name="op"
              value="down"
              disabled={last}
              aria-label={`Move ${m.title} down`}
            >
              ↓
            </button>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {done ? (
            <button className={btn} name="op" value="reopen">
              Reopen
            </button>
          ) : (
            <>
              <button
                className={cn(btn, "border-ink bg-ink text-paper hover:bg-graphite")}
                name="op"
                value="complete"
              >
                Mark complete
              </button>
              {m.client_visible && (
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    name="notify"
                    defaultChecked={notifyByDefault}
                    className="size-3.5 accent-ink"
                  />
                  Email the client
                </label>
              )}
            </>
          )}
          <button className={btn} name="op" value={m.client_visible ? "hide" : "show"}>
            {m.client_visible ? "Hide from client" : "Show to client"}
          </button>
          <button
            className={cn(btn, "hover:border-danger hover:text-danger")}
            name="op"
            value="delete"
            onClick={(e) => {
              if (!confirm(`Remove the milestone “${m.title}”?`)) e.preventDefault();
            }}
          >
            Remove
          </button>
        </div>
        <FormMessage state={state} />
      </form>
    </li>
  );
}
