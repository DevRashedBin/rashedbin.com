import { signOutAdmin } from "@/app/admin/actions";
import type { SessionUser } from "@/server/auth";
import { AdminNavLinks, type AdminNavItem } from "./nav-links";

const nav: AdminNavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads", phase: 4 },
  { href: "/admin/projects", label: "Projects", phase: 5 },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/invoices", label: "Invoices", phase: 6 },
  { href: "/admin/payments", label: "Payments", phase: 6 },
  { href: "/admin/emails", label: "Email activity", phase: 4 },
  { href: "/admin/content", label: "Website content" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/audit", label: "Audit log" },
];

export function AdminShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="bg-ink text-paper lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-5 lg:py-6">
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-full bg-paper text-ink"
            >
              <span className="accent">R</span>
            </span>
            <span className="font-semibold tracking-tight">Admin</span>
          </span>
          <form action={signOutAdmin} className="lg:hidden">
            <button
              type="submit"
              className="rounded-full border border-paper/25 px-3 py-1.5 text-xs"
            >
              Sign out
            </button>
          </form>
        </div>
        <nav aria-label="Admin" className="px-3 pb-3 lg:flex-1 lg:overflow-y-auto">
          <AdminNavLinks items={nav} />
        </nav>
        <div className="hidden border-t border-paper/10 p-4 lg:block">
          <p className="truncate text-xs text-paper/55" title={user.email}>
            {user.email}
          </p>
          <form action={signOutAdmin} className="mt-2">
            <button
              type="submit"
              className="text-sm text-paper/80 underline-offset-4 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-graphite">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.25rem] border border-ink/10 bg-white p-5 sm:p-6 ${className ?? ""}`}
    >
      {title && <h2 className="mb-4 text-base font-medium">{title}</h2>}
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-ink/20 bg-white px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-stone">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
