"use client";

import { useActionState } from "react";
import { idle } from "@/components/admin/action-state";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { deleteStageAction, saveStagesAction } from "./actions";

type Stage = {
  key: string;
  label: string;
  position: number;
  kind: string;
  is_system: boolean;
  inUse: boolean;
};

export function StagesForm({ stages }: { stages: Stage[] }) {
  const [state, action] = useActionState(saveStagesAction, idle);
  return (
    <>
      <form action={action} className="flex flex-col gap-4">
        <FormMessage state={state} />
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-stone">
            <tr>
              <th className="pb-2 font-normal">Name</th>
              <th className="w-24 pb-2 font-normal">Order</th>
              <th className="w-20 pb-2" />
            </tr>
          </thead>
          <tbody>
            {stages.map((s) => (
              <tr key={s.key}>
                <td className="py-1.5 pr-2">
                  <input type="hidden" name="key" value={s.key} />
                  <label className="sr-only" htmlFor={`label-${s.key}`}>
                    Name for {s.label}
                  </label>
                  <input
                    id={`label-${s.key}`}
                    name="label"
                    defaultValue={s.label}
                    maxLength={60}
                    className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 outline-none focus:border-ink"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <label className="sr-only" htmlFor={`pos-${s.key}`}>
                    Order for {s.label}
                  </label>
                  <input
                    id={`pos-${s.key}`}
                    name="position"
                    type="number"
                    defaultValue={s.position}
                    className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 outline-none focus:border-ink"
                  />
                </td>
                <td className="py-1.5 text-xs text-stone">
                  {s.is_system ? "Core" : s.inUse ? "In use" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <label htmlFor="new-stage" className="mb-1.5 block text-sm font-medium">
            Add a stage
          </label>
          <input
            id="new-stage"
            name="newLabel"
            maxLength={60}
            placeholder="e.g. Discovery call booked"
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </div>
        <div>
          <SubmitButton>Save pipeline</SubmitButton>
        </div>
      </form>
      {stages.some((s) => !s.is_system && !s.inUse) && (
        <div className="mt-6 border-t border-ink/10 pt-4">
          <p className="mb-2 text-xs text-stone">Remove an unused stage</p>
          <div className="flex flex-wrap gap-2">
            {stages
              .filter((s) => !s.is_system && !s.inUse)
              .map((s) => (
                <form key={s.key} action={deleteStageAction}>
                  <input type="hidden" name="key" value={s.key} />
                  <button className="rounded-full border border-ink/15 px-3 py-1 text-xs hover:border-danger hover:text-danger">
                    Remove “{s.label}”
                  </button>
                </form>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
