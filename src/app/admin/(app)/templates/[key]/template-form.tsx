"use client";

import { useActionState, useState } from "react";
import { idle } from "@/components/admin/action-state";
import { Input, Textarea } from "@/components/admin/fields";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { renderTemplate, type TemplateValues } from "@/domain/email/template";
import { saveTemplateAction } from "../actions";

export function TemplateForm({
  template,
  sample,
}: {
  template: { key: string; name: string; subject: string; body: string };
  sample: TemplateValues;
}) {
  const [state, action] = useActionState(saveTemplateAction, idle);
  const [subject, setSubject] = useState(state.values?.subject ?? template.subject);
  const [body, setBody] = useState(state.values?.body ?? template.body);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="key" value={template.key} />
      <FormMessage state={state} />
      <Input
        name="name"
        label="Template name"
        defaultValue={state.values?.name ?? template.name}
        error={state.errors?.name}
      />
      <Input
        name="subject"
        label="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        error={state.errors?.subject}
      />
      <Textarea
        name="body"
        label="Message"
        rows={12}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        error={state.errors?.body}
      />
      <div>
        <SubmitButton>Save template</SubmitButton>
      </div>
      <section
        aria-labelledby="preview-title"
        className="rounded-2xl border border-ink/10 bg-paper p-4"
      >
        <h2 id="preview-title" className="text-xs font-medium tracking-wide text-stone uppercase">
          Preview with sample details
        </h2>
        <p className="mt-2 text-sm font-medium">{renderTemplate(subject, sample).text}</p>
        <pre className="mt-2 font-sans text-sm leading-relaxed whitespace-pre-wrap">
          {renderTemplate(body, sample).text}
        </pre>
      </section>
    </form>
  );
}
