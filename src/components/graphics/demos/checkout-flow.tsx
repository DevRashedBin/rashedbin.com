import { DemoFrame } from "../demo-frame";

const steps = ["Product", "Cart", "Checkout", "Confirmed"];
const removed = [
  "Forced account creation",
  "Surprise shipping costs",
  "Repeated address fields",
  "Unclear delivery dates",
];

export function CheckoutFlowDemo() {
  return (
    <DemoFrame title="A shorter path to purchase">
      <div className="relative">
        <div className="absolute top-5 right-[12%] left-[12%] h-px bg-paper/20" aria-hidden />
        <div
          className="reveal-fill absolute top-5 right-[12%] left-[12%] h-px bg-paper"
          aria-hidden
        />
        <ol className="relative grid grid-cols-4 gap-2">
          {steps.map((s, i) => (
            <li key={s} className="flex flex-col items-center gap-2 text-center">
              <span
                className={`grid size-10 place-items-center rounded-full border text-xs ${
                  i === steps.length - 1
                    ? "border-paper bg-paper text-ink"
                    : "border-paper/30 bg-ink"
                }`}
              >
                {i === steps.length - 1 ? "✓" : i + 1}
              </span>
              <span className="text-[0.72rem] text-paper/80 sm:text-xs">{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-8">
        <p className="mb-3 font-mono text-[0.65rem] tracking-[0.12em] text-paper/50 uppercase">
          Common friction removed
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {removed.map((r) => (
            <li
              key={r}
              className="reveal flex items-center gap-2.5 rounded-xl border border-paper/10 px-3 py-2.5 text-xs text-paper/75"
            >
              <span aria-hidden className="text-paper/40">
                ✕
              </span>
              <span className="line-through decoration-paper/30">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </DemoFrame>
  );
}
