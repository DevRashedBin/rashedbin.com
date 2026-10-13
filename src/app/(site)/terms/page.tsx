import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/site/legal-page";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "Terms governing the use of this website and the general basis on which website services are provided.",
  path: "/terms",
});

const sections: LegalSection[] = [
  {
    heading: "About these terms",
    body: [
      `These terms apply to your use of ${site.domain}, operated by ${site.personName} (“${site.brand}”, “I”, “me”). Specific projects are governed by the written proposal or agreement for that project, which takes precedence over these terms where they differ.`,
    ],
  },
  {
    heading: "Information on this website",
    body: [
      "Content on this website is general information about my services. It is not a binding offer. Scope, price and timeline are confirmed only in a written proposal.",
      "I do not guarantee specific search rankings, traffic, revenue or other business outcomes. Results depend on many factors outside my control.",
    ],
  },
  {
    heading: "Enquiries and proposals",
    body: [
      "Sending an enquiry does not create a contract. A project begins when we both agree a written proposal and, where applicable, the first invoice or deposit has been paid.",
    ],
  },
  {
    heading: "Payments",
    body: [
      "Invoices state the amount, currency, due date and accepted payment methods. Payments are recorded against an invoice only once they have been received and confirmed. Any deposit, instalment or milestone arrangements are set out in the proposal.",
    ],
  },
  {
    heading: "Client responsibilities",
    body: [
      [
        "Provide accurate information, content and access needed for the project in good time",
        "Ensure you have the rights to any materials you supply",
        "Keep your own account credentials secure and revoke access you no longer want me to have",
      ],
    ],
  },
  {
    heading: "Ownership",
    body: [
      "On full payment, you own the deliverables created specifically for your project, subject to third-party licences for themes, plugins, fonts or other components. Accounts for domains and hosting remain in your name.",
    ],
  },
  {
    heading: "Client portal",
    body: [
      "If you are given access to the client portal, it is for your own use in relation to your projects. Do not share your sign-in links. Access may be suspended to protect the security of the service.",
    ],
  },
  {
    heading: "Liability",
    body: [
      "Nothing in these terms limits liability that cannot legally be limited. Otherwise, my total liability in connection with a project is limited to the fees paid for that project, and I am not liable for indirect or consequential losses, including lost profits or data, to the extent permitted by law.",
    ],
  },
  {
    heading: "Changes",
    body: [
      "I may update these terms from time to time. The version published here applies to use of the website from the date shown.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      path="/terms"
      updated={site.termsVersion}
      intro="Please read these terms before using this website or engaging my services."
      sections={sections}
    />
  );
}
