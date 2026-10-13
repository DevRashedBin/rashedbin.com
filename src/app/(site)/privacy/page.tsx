import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/site/legal-page";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Rashed collects, uses, stores and protects personal information submitted through this website.",
  path: "/privacy",
});

const contact = site.contactEmail
  ? `by email at ${site.contactEmail}`
  : "using the enquiry form on this website";

const sections: LegalSection[] = [
  {
    heading: "Who is responsible for your data",
    body: [
      `This website is operated by ${site.personName}, trading as ${site.brand} (“I”, “me”). I am the data controller for personal information collected through ${site.domain}. You can contact me about privacy ${contact}.`,
    ],
  },
  {
    heading: "What I collect",
    body: [
      "When you send an enquiry, I collect the information you choose to provide:",
      [
        "Your name, email address and, optionally, your business name",
        "Your website address and details about your project, budget range and timeline",
        "Your consent to be contacted, with the date, time and version of this notice",
      ],
      "To protect the form from abuse, I also process limited technical data such as a one-way hashed form of your IP address and your browser’s user-agent string.",
      "If you become a client, I also keep project records, invoices, payment records and our correspondence. Portal sign-in uses your email address; I do not store passwords for clients.",
    ],
  },
  {
    heading: "How I use it",
    body: [
      [
        "To respond to your enquiry and discuss your project (legitimate interests / steps before entering a contract)",
        "To deliver services, issue invoices and record payments (performance of a contract and legal obligations)",
        "To keep the website and its forms secure and free of spam (legitimate interests)",
      ],
      "I do not sell your information, use it for automated decision-making, or add you to a marketing mailing list.",
    ],
  },
  {
    heading: "Saved and incomplete enquiries",
    body: [
      "Nothing you type into the enquiry form is sent to me until you submit it. If an option to save an enquiry and finish it later is offered, it only stores your details after you choose to save and confirm that I may contact you about it. Saved, unfinished enquiries are deleted automatically after 90 days.",
    ],
  },
  {
    heading: "Who I share it with",
    body: [
      "I use a small number of service providers to run this website and my business. They process data on my instructions and only for these purposes:",
      [
        "Website hosting and delivery (Vercel)",
        "Database and authentication (Supabase, hosted in the United Kingdom / European Economic Area)",
        "Transactional email delivery (Resend)",
        "Spam and abuse protection for forms (Cloudflare Turnstile)",
      ],
      "Some providers may process data outside your country. Where required, transfers are protected by appropriate safeguards such as standard contractual clauses.",
    ],
  },
  {
    heading: "How long I keep it",
    body: [
      [
        "Unfinished saved enquiries: up to 90 days",
        "Enquiries that don’t lead to a project: up to 24 months, then deleted or anonymised",
        "Client, invoice and payment records: at least 6 years after the end of the financial year they relate to, to meet accounting and tax obligations",
      ],
    ],
  },
  {
    heading: "Your rights",
    body: [
      "Depending on where you live, you may have the right to access, correct or delete your personal information, to object to or restrict its use, to data portability, and to withdraw consent at any time. To exercise these rights, contact me " +
        contact +
        ". I may need to verify your identity first.",
      "If you are in the UK or EU and are unhappy with how your data is handled, you can complain to your local data protection authority — in the UK, the Information Commissioner’s Office (ico.org.uk).",
    ],
  },
  {
    heading: "Cookies and analytics",
    body: [
      "This website does not use advertising or tracking cookies. Strictly necessary cookies are used only to keep signed-in clients and administrators logged in. If privacy-friendly, cookieless analytics are enabled, they collect aggregate usage statistics without identifying you.",
    ],
  },
  {
    heading: "Security",
    body: [
      "Data is encrypted in transit, access to records is restricted by authentication and role-based permissions, and administrative actions are logged. No method of transmission or storage is completely secure, but I take reasonable measures to protect your information.",
    ],
  },
  {
    heading: "Changes to this notice",
    body: [
      "If this notice changes, the updated version will be published here with a new date. Consent records reference the version of the notice in force when you submitted your enquiry.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      path="/privacy"
      updated={site.privacyNoticeVersion}
      intro="This notice explains what personal information I collect through this website, why, how long I keep it and the rights you have."
      sections={sections}
    />
  );
}
