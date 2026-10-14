import "server-only";
import { NOT_SURE, type ServiceOption } from "@/domain/inquiry/schema";
import { getServices } from "@/server/content";

/** Published services as enquiry-form choices, plus "Not sure yet". */
export async function inquiryServiceOptions(): Promise<ServiceOption[]> {
  const services = await getServices();
  return [
    ...services.map((s) => ({ value: s.slug, label: s.shortName })),
    { value: NOT_SURE, label: "Not sure yet" },
  ];
}
