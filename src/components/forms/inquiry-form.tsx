"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { DraftActionState, InquiryActionState } from "@/app/(site)/start-a-project/actions";
import { saveInquiryDraftAction, submitInquiryAction } from "@/app/(site)/start-a-project/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Check } from "@/components/ui/icons";
import {
  BUDGET_BANDS,
  BUDGET_LABELS,
  CURRENCIES,
  INQUIRY_STEPS,
  NOT_SURE,
  PLATFORM_OPTIONS,
  SERVICES_REQUIRING_URL,
  STORE_STAGE_OPTIONS,
  TIMELINE_OPTIONS,
  URGENCY_OPTIONS,
  validateStep,
  type Currency,
  type FieldErrors,
  type InquiryService,
  type InquiryStep,
  type ServiceOption,
} from "@/domain/inquiry/schema";
import { cn } from "@/lib/cn";
import { ChoiceGroup, Checkbox, TextArea, TextField } from "./fields";
import { Turnstile } from "./turnstile";

export type InquiryFormData = {
  service?: InquiryService;
  websiteUrl: string;
  platform?: string;
  urgency?: string;
  storeStage?: string;
  description: string;
  currency: Currency;
  budget?: string;
  timeline?: string;
  name: string;
  email: string;
  company: string;
  consent: boolean;
};

const STEP_META: Record<InquiryStep, { title: string; label: string }> = {
  service: { title: "What do you need help with?", label: "Service" },
  details: { title: "Tell me about the project", label: "Project" },
  scope: { title: "Budget and timeline", label: "Scope" },
  contact: { title: "Where should I reply?", label: "Contact" },
};

function toPayload(data: FormData): Record<string, unknown> {
  return {
    ...data,
    websiteUrl: data.websiteUrl || undefined,
    company: data.company || undefined,
  };
}

type FormData = InquiryFormData;

export function InquiryForm({
  privacyHref,
  serviceOptions,
  initial,
  resumeToken,
  turnstileSiteKey,
}: {
  privacyHref: string;
  serviceOptions: ServiceOption[];
  /** Answers restored from a saved draft (resume link). */
  initial?: Partial<FormData>;
  resumeToken?: string;
  turnstileSiteKey?: string;
}) {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("service");
  const isService = (v: string | null | undefined): v is InquiryService =>
    !!v && serviceOptions.some((o) => o.value === v);

  const [data, setData] = useState<FormData>(() => ({
    websiteUrl: "",
    description: "",
    currency: "USD",
    name: "",
    email: "",
    company: "",
    consent: false,
    ...initial,
    service: isService(initial?.service)
      ? initial.service
      : isService(preselected)
        ? preselected
        : undefined,
  }));
  // A resumed draft opens at the first step that still needs an answer.
  const [step, setStep] = useState(() => {
    if (!initial) return 0;
    const idx = INQUIRY_STEPS.findIndex(
      (s) => Object.keys(validateStep(s, toPayload(data))).length > 0,
    );
    return idx < 0 ? INQUIRY_STEPS.length - 1 : idx;
  });
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<InquiryActionState>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  const [hp, setHp] = useState("");

  // Set on mount so they are generated per visit in the browser, not at build time.
  const meta = useRef<{ startedAt: number; idempotencyKey: string } | null>(null);
  useEffect(() => {
    meta.current = { startedAt: Date.now(), idempotencyKey: crypto.randomUUID() };
  }, []);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, result.status]);

  const current = INQUIRY_STEPS[step];
  const last = step === INQUIRY_STEPS.length - 1;

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function next() {
    const stepErrors = validateStep(current, toPayload(data));
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) return;
    if (last) submit();
    else setStep((s) => s + 1);
  }

  function submit() {
    if (!meta.current || pending) return;
    const envelope = { ...meta.current, hp, turnstileToken, resumeToken, data: toPayload(data) };
    startTransition(async () => {
      const res = await submitInquiryAction(envelope);
      if (res.status === "invalid") {
        setErrors(res.errors);
        // Return to the first step that contains an error.
        const idx = INQUIRY_STEPS.findIndex(
          (s) => Object.keys(validateStep(s, toPayload(data))).length > 0,
        );
        if (idx >= 0) setStep(idx);
      }
      setResult(res);
    });
  }

  if (result.status === "success") {
    return (
      <div className="rounded-[var(--radius-panel)] bg-ink p-8 text-paper sm:p-12" role="status">
        <span className="grid size-12 place-items-center rounded-full bg-paper text-ink">
          <Check className="size-5" />
        </span>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-6 text-3xl font-medium tracking-tight outline-none"
        >
          Thanks{data.name ? `, ${data.name.split(" ")[0]}` : ""} — your enquiry is in.
        </h2>
        <p className="mt-4 max-w-lg text-paper/70">
          I&rsquo;ll review the details and reply personally to <strong>{data.email}</strong>. If
          you don&rsquo;t see a reply, please check your spam folder.
        </p>
        <ButtonLink href="/services" variant="inverse" arrow className="mt-8">
          Back to services
        </ButtonLink>
      </div>
    );
  }

  const service = data.service;
  const needsUrl = service ? SERVICES_REQUIRING_URL.includes(service) : false;
  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
      {/* Progress */}
      <ol aria-label="Progress" className="flex gap-2 lg:flex-col lg:gap-1">
        {INQUIRY_STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={s} className="flex-1 lg:flex-none">
              <span
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "flex flex-col gap-2 text-xs lg:flex-row lg:items-center lg:gap-3 lg:rounded-2xl lg:px-3 lg:py-3 lg:text-sm",
                  state === "current" && "lg:bg-white",
                  state === "todo" && "text-stone",
                )}
              >
                <span
                  className={cn(
                    "h-1 rounded-full lg:grid lg:size-7 lg:h-auto lg:place-items-center lg:font-mono lg:text-[0.7rem]",
                    state === "todo"
                      ? "bg-ink/10 lg:border lg:border-ink/15 lg:bg-transparent"
                      : "bg-ink lg:text-paper",
                  )}
                >
                  <span className="hidden lg:inline">{state === "done" ? "✓" : i + 1}</span>
                </span>
                <span className="hidden sm:inline">{STEP_META[s].label}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
        className="relative rounded-[var(--radius-panel)] border border-ink/10 bg-white p-5 sm:p-8 lg:p-10"
      >
        <p className="font-mono text-xs tracking-[0.14em] text-stone uppercase">
          Step {step + 1} of {INQUIRY_STEPS.length}
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 text-2xl font-medium tracking-tight outline-none sm:text-3xl"
        >
          {STEP_META[current].title}
        </h2>

        {errorCount > 0 && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
          >
            Please check the{" "}
            {errorCount === 1 ? "highlighted field" : `${errorCount} highlighted fields`}.
          </p>
        )}
        {result.status === "unavailable" && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-sm"
          >
            Sorry — online enquiries aren&rsquo;t being accepted right now, so your answers have{" "}
            <strong>not</strong> been sent. Please try again later.
          </p>
        )}
        {result.status === "rate_limited" && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-sm"
          >
            You&rsquo;ve sent several enquiries in a short time, so this one was{" "}
            <strong>not</strong> sent. Please wait a few minutes and try again.
          </p>
        )}
        {result.status === "verification_failed" && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-sm"
          >
            We couldn&rsquo;t verify the security check, so your enquiry was <strong>not</strong>{" "}
            sent. Please try again.
          </p>
        )}
        {result.status === "error" && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
          >
            Something went wrong and your enquiry was not sent. Please try again in a moment.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-7">
          {current === "service" && (
            <ChoiceGroup
              name="service"
              legend="Service"
              hideLegend
              options={serviceOptions}
              columns="grid-cols-2 lg:grid-cols-3"
              value={data.service}
              onChange={(v) => update("service", v as InquiryService)}
              error={errors.service}
            />
          )}

          {current === "details" && (
            <>
              {service === "woocommerce-development" && (
                <ChoiceGroup
                  name="storeStage"
                  legend="Where is your store at?"
                  options={STORE_STAGE_OPTIONS}
                  value={data.storeStage}
                  onChange={(v) => update("storeStage", v)}
                  error={errors.storeStage}
                  columns="sm:grid-cols-3"
                />
              )}
              {service === "website-bug-fixes" && (
                <ChoiceGroup
                  name="urgency"
                  legend="How urgent is it?"
                  options={URGENCY_OPTIONS}
                  value={data.urgency}
                  onChange={(v) => update("urgency", v)}
                  error={errors.urgency}
                  columns="sm:grid-cols-3"
                />
              )}
              <TextField
                name="websiteUrl"
                label={needsUrl ? "Website address" : "Current website, if you have one"}
                optionalLabel={!needsUrl}
                value={data.websiteUrl}
                onChange={(v) => update("websiteUrl", v)}
                error={errors.websiteUrl}
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="example.com"
              />
              {service !== "website-design-development" && service !== NOT_SURE && (
                <ChoiceGroup
                  name="platform"
                  legend="What is it built with?"
                  options={PLATFORM_OPTIONS}
                  value={data.platform}
                  onChange={(v) => update("platform", v)}
                  error={errors.platform}
                  variant="pill"
                  hint="Optional — choose “Not sure” if you don’t know."
                />
              )}
              <TextArea
                name="description"
                label={
                  service === "website-bug-fixes"
                    ? "What’s going wrong, and when did it start?"
                    : "What do you need?"
                }
                value={data.description}
                onChange={(v) => update("description", v)}
                error={errors.description}
                maxLength={5000}
                placeholder={
                  service === "website-bug-fixes"
                    ? "E.g. Since a plugin update on Monday, the contact form shows an error when submitted."
                    : "Your business, what the website should achieve, and anything you already know you need."
                }
              />
            </>
          )}

          {current === "scope" && (
            <>
              <ChoiceGroup
                name="currency"
                legend="Preferred currency"
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                value={data.currency}
                onChange={(v) => {
                  update("currency", v as Currency);
                }}
                error={errors.currency}
                variant="pill"
              />
              <ChoiceGroup
                name="budget"
                legend={`Approximate budget (${data.currency})`}
                options={BUDGET_BANDS.map((b) => ({
                  value: b,
                  label: b === "not-sure" ? "Not sure yet" : BUDGET_LABELS[data.currency][b],
                }))}
                value={data.budget}
                onChange={(v) => update("budget", v)}
                error={errors.budget}
                columns="grid-cols-2 sm:grid-cols-3"
                hint="A rough range helps me suggest the right scope. It isn’t a commitment."
              />
              <ChoiceGroup
                name="timeline"
                legend="Timeline"
                options={TIMELINE_OPTIONS}
                value={data.timeline}
                onChange={(v) => update("timeline", v)}
                error={errors.timeline}
                columns="grid-cols-2 sm:grid-cols-4"
              />
            </>
          )}

          {current === "contact" && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  name="name"
                  label="Your name"
                  value={data.name}
                  onChange={(v) => update("name", v)}
                  error={errors.name}
                  autoComplete="name"
                  required
                />
                <TextField
                  name="email"
                  label="Email address"
                  type="email"
                  inputMode="email"
                  value={data.email}
                  onChange={(v) => update("email", v)}
                  error={errors.email}
                  autoComplete="email"
                  required
                />
              </div>
              <TextField
                name="company"
                label="Business or company name"
                optionalLabel
                value={data.company}
                onChange={(v) => update("company", v)}
                error={errors.company}
                autoComplete="organization"
              />
              <Checkbox
                name="consent"
                checked={data.consent}
                onChange={(v) => update("consent", v)}
                error={errors.consent}
              >
                I agree that Rashed may store these details and contact me about this enquiry, as
                described in the{" "}
                <Link href={privacyHref} className="text-ink underline underline-offset-2">
                  privacy policy
                </Link>
                . You won&rsquo;t be added to any mailing list.
              </Checkbox>
            </>
          )}

          {/* Honeypot: visually hidden and skipped by assistive tech. */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Leave this field empty
              <input
                tabIndex={-1}
                autoComplete="off"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                name="fax_number"
              />
            </label>
          </div>
        </div>

        {last && turnstileSiteKey && (
          <div className="mt-6">
            <Turnstile siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
          </div>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              className="self-start"
              disabled={pending}
            >
              ← Back
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="submit"
            size="lg"
            arrow={!last}
            disabled={pending}
            className="w-full sm:w-auto"
          >
            {pending ? "Sending…" : last ? "Send enquiry" : "Continue"}
          </Button>
        </div>
      </form>
      {step > 0 && (
        <div className="lg:col-start-2">
          <SaveForLater data={data} meta={meta} privacyHref={privacyHref} />
        </div>
      )}
    </div>
  );
}

/**
 * Optional "save and finish later". Nothing typed into the form is stored
 * until the visitor opens this, gives an email address and ticks the consent box.
 */
function SaveForLater({
  data,
  meta,
  privacyHref,
}: {
  data: FormData;
  meta: React.RefObject<{ startedAt: number; idempotencyKey: string } | null>;
  privacyHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(data.name);
  const [email, setEmail] = useState(data.email);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<DraftActionState>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  if (state.status === "saved") {
    return (
      <p role="status" className="rounded-2xl border border-ink/10 bg-white px-5 py-4 text-sm">
        Saved. A link to finish your enquiry is on its way to{" "}
        <strong>{state.email || email}</strong>. It works once and expires in 14 days.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-graphite underline underline-offset-4 hover:text-ink"
      >
        Not ready to finish? Save and finish later
      </button>
    );
  }

  const errors = state.status === "invalid" ? state.errors : {};
  return (
    <section
      aria-labelledby="save-later-title"
      className="rounded-[var(--radius-card)] border border-ink/10 bg-white p-5 sm:p-6"
    >
      <h3 id="save-later-title" className="text-lg font-medium">
        Save and finish later
      </h3>
      <p className="mt-1.5 text-sm text-graphite">
        I&rsquo;ll store your answers so far and email you a link to finish. Unfinished enquiries
        are deleted automatically after 90 days, and you won&rsquo;t be added to any mailing list.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextField
          name="draftName"
          label="Your name"
          value={name}
          onChange={setName}
          error={errors.name}
          autoComplete="name"
        />
        <TextField
          name="draftEmail"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
        />
      </div>
      <div className="mt-4">
        <Checkbox
          name="draftConsent"
          checked={consent}
          onChange={setConsent}
          error={errors.consent}
        >
          Store my answers and email me a link to finish this enquiry, as described in the{" "}
          <Link href={privacyHref} className="text-ink underline underline-offset-2">
            privacy policy
          </Link>
          .
        </Checkbox>
      </div>
      {["rate_limited", "error", "unavailable", "already_submitted"].includes(state.status) && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {state.status === "already_submitted"
            ? "This enquiry has already been sent."
            : state.status === "rate_limited"
              ? "Too many attempts. Please wait a few minutes and try again."
              : "Your answers couldn’t be saved. Please try again."}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (!meta.current) return;
              setState(
                await saveInquiryDraftAction({
                  ...meta.current,
                  data: { ...toPayload(data), name, email, consent: consent || undefined },
                }),
              );
            })
          }
        >
          {pending ? "Saving…" : "Save and email me a link"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
