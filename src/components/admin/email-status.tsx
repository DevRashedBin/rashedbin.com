import { cn } from "@/lib/cn";

/**
 * Honest status labels: "Sent" means the provider accepted the message;
 * "Delivered" only appears once the provider has confirmed delivery.
 */
const STATUS: Record<string, { label: string; tone: "ok" | "warn" | "bad" | "muted" }> = {
  queued: { label: "Queued", tone: "muted" },
  sending: { label: "Sending", tone: "muted" },
  sent: { label: "Sent", tone: "ok" },
  failed: { label: "Failed", tone: "bad" },
  suppressed: { label: "Not sent (safety mode)", tone: "warn" },
};
const DELIVERY: Record<
  string,
  { label: string; tone: "ok" | "warn" | "bad" | "muted" } | undefined
> = {
  delivered: { label: "Delivered", tone: "ok" },
  delayed: { label: "Delayed", tone: "warn" },
  bounced: { label: "Bounced", tone: "bad" },
  complained: { label: "Marked as spam", tone: "bad" },
};

const toneClass = {
  ok: "border-success/30 bg-success/5 text-success",
  warn: "border-ink/20 bg-paper text-graphite",
  bad: "border-danger/30 bg-danger/5 text-danger",
  muted: "border-ink/15 text-stone",
};

export function EmailStatus({ status, delivery }: { status: string; delivery?: string | null }) {
  const s = STATUS[status] ?? { label: status, tone: "muted" as const };
  const d = delivery ? DELIVERY[delivery] : undefined;
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Chip {...s} />
      {status === "sent" && d && <Chip {...d} />}
      {status === "sent" && !d && <Chip label="Delivery not confirmed yet" tone="muted" />}
    </span>
  );
}

function Chip({ label, tone }: { label: string; tone: keyof typeof toneClass }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[0.7rem] whitespace-nowrap",
        toneClass[tone],
      )}
    >
      {label}
    </span>
  );
}
