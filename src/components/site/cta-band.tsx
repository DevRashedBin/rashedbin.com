import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function CtaBand({
  title,
  body,
  label = "Start a project",
  href = "/start-a-project",
}: {
  title: string;
  body: string;
  label?: string;
  href?: string;
}) {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="relative overflow-hidden rounded-[var(--radius-panel)] bg-ink px-6 py-12 text-paper sm:px-12 sm:py-16">
          <div aria-hidden className="absolute inset-0 grid-lines opacity-40" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-headline font-medium">{title}</h2>
              <p className="mt-4 max-w-xl text-paper/65">{body}</p>
            </div>
            <ButtonLink
              href={href}
              variant="inverse"
              size="lg"
              arrow
              className="self-start lg:self-auto"
            >
              {label}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
