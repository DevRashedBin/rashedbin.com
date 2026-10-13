import { serializeJsonLd } from "@/lib/seo";

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Content is generated from trusted site data and `<` is escaped.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
