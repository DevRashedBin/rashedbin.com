"use client";

import { useActionState, useRef, useState } from "react";
import { idle } from "@/components/admin/action-state";
import { Input, Textarea } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { Button } from "@/components/ui/button";
import { sendFollowUpAction } from "../../actions";

export function ComposeForm(props: {
  leadId: string;
  to: string;
  templateKey: string;
  idempotencyKey: string;
  subject: string;
  body: string;
}) {
  const [state, action] = useActionState(sendFollowUpAction, idle);
  const [subject, setSubject] = useState(state.values?.subject ?? props.subject);
  const [body, setBody] = useState(state.values?.body ?? props.body);
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="leadId" value={props.leadId} />
      <input type="hidden" name="templateKey" value={props.templateKey} />
      <input type="hidden" name="idempotencyKey" value={props.idempotencyKey} />
      <FormMessage state={state} />
      <p className="text-sm">
        <span className="text-stone">To:</span> {props.to}
      </p>
      <Input
        name="subject"
        label="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        error={state.errors?.subject}
        required
      />
      <Textarea
        name="body"
        label="Message"
        rows={14}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        error={state.errors?.body}
        required
      />
      <div>
        <Button onClick={() => dialog.current?.showModal()}>Review and send</Button>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="review-title"
        className="m-auto w-[min(94vw,640px)] rounded-[1.5rem] p-0 backdrop:bg-ink/50"
      >
        <div className="flex max-h-[85dvh] flex-col p-6">
          <h2 id="review-title" className="text-lg font-medium">
            Review before sending
          </h2>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-stone">To</dt>
            <dd data-testid="review-to">{props.to}</dd>
            <dt className="text-stone">Subject</dt>
            <dd>{subject}</dd>
          </dl>
          <pre className="mt-4 flex-1 overflow-auto rounded-xl bg-paper p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {body}
          </pre>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => dialog.current?.close()}>
              Keep editing
            </Button>
            <SubmitButton pendingLabel="Sending…">Send now</SubmitButton>
          </div>
        </div>
      </dialog>
    </form>
  );
}
