import { DemoFrame } from "../demo-frame";

const steps = [
  { tag: "reproduce", text: "Contact form submits but no email arrives", state: "confirmed" },
  {
    tag: "isolate",
    text: "Mail sent via PHP mail(); rejected by receiving server",
    state: "cause found",
  },
  { tag: "fix", text: "Route mail through authenticated SMTP on staging", state: "applied" },
  { tag: "verify", text: "Test enquiries delivered; SPF and DKIM pass", state: "passed" },
];

export function BugTraceDemo() {
  return (
    <DemoFrame title="Diagnose → fix → verify" illustrative>
      <ol className="flex flex-col gap-0 font-mono text-[0.78rem]">
        {steps.map((s, i) => (
          <li
            key={s.tag}
            className="reveal relative grid grid-cols-[auto_1fr] gap-4 pb-5 last:pb-0"
          >
            <span className="relative flex flex-col items-center">
              <span className="grid size-6 place-items-center rounded-full border border-paper/30 bg-ink text-[0.65rem]">
                {i + 1}
              </span>
              {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-paper/15" />}
            </span>
            <span className="pt-0.5">
              <span className="text-paper/45">{s.tag}</span>
              <span className="mt-1 block leading-relaxed text-paper/90">{s.text}</span>
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-2 py-0.5 text-[0.65rem] text-paper/80">
                <span className="size-1.5 rounded-full bg-paper" />
                {s.state}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-5 font-mono text-[0.7rem] text-paper/45">
        $ report sent to client<span className="anim-blink">_</span>
      </p>
    </DemoFrame>
  );
}
