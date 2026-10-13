"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function SiteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <p className="font-mono text-xs tracking-[0.14em] text-stone uppercase">
          Something went wrong
        </p>
        <h1 className="mt-6 max-w-3xl text-headline font-medium">
          Sorry — this page couldn&rsquo;t be loaded.
        </h1>
        <p className="mt-5 max-w-lg text-graphite">
          Please try again. If the problem continues, come back a little later.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-xs text-stone">Reference: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => retry()}>
            Try again
          </Button>
          <ButtonLink href="/" size="lg" variant="outline">
            Go to the homepage
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
