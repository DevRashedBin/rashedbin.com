import "server-only";
import { parseEmailMode, type EmailMode } from "@/domain/email/policy";

export type EmailConfig = {
  provider: "resend" | "mailpit";
  mode: EmailMode;
  allowlist: string[];
  from: string;
  replyTo: string;
};

/** Reads email settings. Defaults are safe: log-only, nothing leaves the server. */
export function emailConfig(): EmailConfig {
  return {
    provider: process.env.EMAIL_PROVIDER === "mailpit" ? "mailpit" : "resend",
    mode: parseEmailMode(process.env.EMAIL_MODE),
    allowlist: (process.env.EMAIL_ALLOWLIST ?? "").split(","),
    from: process.env.EMAIL_FROM ?? "Rashed <hello@rashedbin.com>",
    replyTo: process.env.EMAIL_REPLY_TO ?? "hello@rashedbin.com",
  };
}

/** Absolute origin for links in emails (resume links, dashboard links). */
export function appOrigin(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://rashedbin.com"
  ).replace(/\/$/, "");
}
