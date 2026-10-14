import type { Faq } from "@/domain/content/service";
import { Plus } from "./icons";

/** Accessible accordion built on native <details>, so it works without JavaScript. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-current/15 border-y border-current/15">
      {faqs.map((faq) => (
        <details key={faq.question} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left text-base font-medium sm:text-lg [&::-webkit-details-marker]:hidden">
            <span>{faq.question}</span>
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-current/20 transition-transform duration-300 group-open:rotate-45">
              <Plus className="size-3.5" />
            </span>
          </summary>
          <p className="max-w-3xl pb-6 text-[0.95rem] leading-relaxed opacity-75">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
