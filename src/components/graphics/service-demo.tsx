import type { ServiceDemo as DemoKey } from "@/content/services";
import { BeforeAfterDemo } from "./demos/before-after";
import { BlueprintDemo } from "./demos/blueprint";
import { BugTraceDemo } from "./demos/bug-trace";
import { CheckoutFlowDemo } from "./demos/checkout-flow";
import { CrawlIndexDemo } from "./demos/crawl-index";
import { EditableBlocksDemo } from "./demos/editable-blocks";
import { SecurityLayersDemo } from "./demos/security-layers";
import { VitalsDemo } from "./demos/vitals";

/** Registry mapping a service's `demo` key to its explainer graphic. */
const demos: Record<DemoKey, () => React.ReactNode> = {
  blueprint: BlueprintDemo,
  "before-after": BeforeAfterDemo,
  "editable-blocks": EditableBlocksDemo,
  "bug-trace": BugTraceDemo,
  "crawl-index": CrawlIndexDemo,
  "security-layers": SecurityLayersDemo,
  vitals: VitalsDemo,
  "checkout-flow": CheckoutFlowDemo,
};

export function ServiceDemo({ demo }: { demo: DemoKey }) {
  const Demo = demos[demo];
  return <Demo />;
}
