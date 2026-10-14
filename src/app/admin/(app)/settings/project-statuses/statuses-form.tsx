"use client";

import { useActionState } from "react";
import { idle } from "@/components/admin/action-state";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { saveProjectStatusesAction } from "./actions";

type Status = {
  key: string;
  label: string;
  client_label: string;
  position: number;
  notify_client_by_default: boolean;
};

const input =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-ink";

export function StatusesForm({ statuses }: { statuses: Status[] }) {
  const [state, action] = useActionState(saveProjectStatusesAction, idle);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-stone">
            <tr>
              <th className="pb-2 font-normal">Your name</th>
              <th className="pb-2 font-normal">Client sees</th>
              <th className="w-20 pb-2 font-normal">Order</th>
              <th className="w-28 pb-2 font-normal">Email client</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s) => (
              <tr key={s.key}>
                <td className="py-1.5 pr-2">
                  <input type="hidden" name="key" value={s.key} />
                  <input
                    aria-label={`Name for ${s.label}`}
                    name="label"
                    defaultValue={s.label}
                    maxLength={60}
                    className={input}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    aria-label={`Client label for ${s.label}`}
                    name="clientLabel"
                    defaultValue={s.client_label}
                    maxLength={60}
                    className={input}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    aria-label={`Order for ${s.label}`}
                    name="position"
                    type="number"
                    defaultValue={s.position}
                    className={input}
                  />
                </td>
                <td className="py-1.5">
                  <input
                    aria-label={`Email the client by default when moving to ${s.label}`}
                    type="checkbox"
                    name="notify"
                    value={s.key}
                    defaultChecked={s.notify_client_by_default}
                    className="size-4 accent-ink"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <SubmitButton>Save statuses</SubmitButton>
      </div>
    </form>
  );
}
