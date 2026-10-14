"use client";

import { useActionState } from "react";
import { idle } from "@/components/admin/action-state";
import { FormMessage, SubmitButton } from "@/components/admin/form-controls";
import { RepeatableField } from "@/components/admin/repeatable";
import { saveGeneralFaqsAction } from "../actions";

export function FaqEditor({ initial }: { initial: { question: string; answer: string }[] }) {
  const [state, action] = useActionState(saveGeneralFaqsAction, idle);
  return (
    <form action={action} className="flex flex-col gap-5">
      <FormMessage state={state} />
      <RepeatableField
        name="faqs"
        legend="Questions"
        addLabel="Add question"
        max={20}
        fields={[
          { key: "question", label: "Question", maxLength: 200 },
          { key: "answer", label: "Answer", multiline: true, maxLength: 2000 },
        ]}
        initial={initial}
      />
      <div>
        <SubmitButton>Save FAQs</SubmitButton>
      </div>
    </form>
  );
}
