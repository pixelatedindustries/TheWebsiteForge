<script setup lang="ts">
// NOTE: Starter legal template — review with a qualified attorney before relying on it.
useSeoMeta({
  title: "Terms of Service — TheWebsiteForge",
  description:
    "The terms that govern your use of TheWebsiteForge's website design, build, and hosting services.",
});

defineOgImageComponent("Forge", {
  title: "Terms of Service",
  description:
    "The terms governing TheWebsiteForge's design, build, and hosting services.",
});

const effectiveDate = "6 June 2026";
const contactEmail = "support@pixelatedindustries.com";

const sections = [
  {
    heading: "1. Who we are",
    body: [
      'These Terms of Service ("Terms") govern your access to and use of the websites, design and development services, hosting, domain management, and related services (collectively, the "Services") provided by TheWebsiteForge ("we", "us", "our").',
      'By engaging us, paying an invoice, or using the Services, you ("you", "the Client") agree to these Terms. If you do not agree, do not use the Services.',
    ],
  },
  {
    heading: "2. Services we provide",
    body: [
      "We offer one-time website builds, recurring website hosting, domain registration and management on your behalf, optional care/maintenance plans, and one-time feature or change work. The specific scope, deliverables, and price for your engagement are set out in your quote, proposal, or order confirmation, which forms part of these Terms.",
      "Recurring services (hosting, care) are billed on a subscription basis as described at the time of purchase. One-time services (builds, feature work, domains) are billed as quoted.",
    ],
  },
  {
    heading: "3. Quotes, orders, and pricing",
    body: [
      "All prices are quoted and charged in United States Dollars (USD) unless we agree otherwise in writing. Quotes are valid for the period stated; if no period is stated, for 30 days.",
      "Recurring prices may be reviewed from time to time. We will give you reasonable advance notice of any change to a recurring price before it takes effect, and you may cancel before the change applies in accordance with these Terms.",
      "Where applicable taxes (such as VAT) apply to your purchase, they will be shown on your invoice and added to the amounts payable.",
    ],
  },
  {
    heading: "4. Payment",
    body: [
      "Build and feature work may require a deposit before work begins, with the balance due on completion or as set out in your quote. Recurring services are billed in advance for each billing period.",
      "Payments are processed by third-party payment providers such as Paystack. By paying, you also agree to the applicable provider's terms. We do not store full card details ourselves.",
      "If a payment fails or is overdue, we may suspend the affected Services in accordance with Section 7 and our Hosting Agreement.",
      "You may add prepaid credit to your TheWebsiteForge wallet. Available credit can be applied to website builds, recurring services, domains, and approved change work, with any remaining checkout amount paid through our payment provider.",
      "Wallet credit is not a bank deposit, does not earn interest, and is subject to the wallet-refund terms in our Refund Policy.",
    ],
  },
  {
    heading: "5. Client responsibilities",
    body: [
      "You agree to provide content, materials, access, and approvals we reasonably need to deliver the Services, and to do so in a timely way. Delays in providing these may delay delivery.",
      "You confirm that any content, code, or materials you supply do not infringe the rights of others and comply with applicable law. You are responsible for the lawfulness of the website and content we host for you.",
      "You must keep your account credentials secure and notify us promptly of any suspected unauthorised use.",
    ],
  },
  {
    heading: "6. Intellectual property and ownership",
    body: [
      'For one-time "own it" builds, ownership of the final, paid-for website code and delivered assets transfers to you upon receipt of full payment. We may retain the right to display the work in our portfolio unless you ask us in writing not to.',
      "For managed (hosted) builds, ownership of the delivered website transfers on full payment; the terms of any source-code handover are as set out in your quote or the Hosting Agreement.",
      "We retain ownership of our pre-existing tools, libraries, frameworks, and know-how. Third-party components remain subject to their own licences.",
    ],
  },
  {
    heading: "7. Suspension and termination",
    body: [
      "We may suspend or terminate Services for non-payment, breach of these Terms or our Hosting Agreement, or unlawful or abusive use. Where reasonable, we will give notice and an opportunity to fix the issue first.",
      "You may cancel recurring Services as described in your plan and the Hosting Agreement. Cancellation stops future renewals; it does not entitle you to a refund of fees already paid except as set out in our Refund Policy.",
      "On termination, the offboarding terms in the Hosting Agreement apply (including any data export and domain hand-off).",
    ],
  },
  {
    heading: "8. Service levels and availability",
    body: [
      "We aim to keep hosted sites available and performant, but we do not guarantee uninterrupted or error-free service unless a specific service level is stated in writing. Hosting infrastructure, backups, and support response targets are described per plan.",
      "We are not responsible for downtime or issues caused by factors outside our reasonable control, including third-party providers, your code or content, or force majeure events.",
    ],
  },
  {
    heading: "9. Warranties and liability",
    body: [
      "The Services are provided on a commercially reasonable basis. To the maximum extent permitted by law, we disclaim implied warranties not expressly stated in these Terms.",
      "To the maximum extent permitted by law, our total liability arising out of or relating to the Services is limited to the amount you paid us for the specific Service giving rise to the claim in the three (3) months before the event. We are not liable for indirect, incidental, or consequential losses, including lost profits or data.",
      "Nothing in these Terms limits liability that cannot be limited by law.",
    ],
  },
  {
    heading: "10. Changes to these Terms",
    body: [
      "We may update these Terms from time to time. The current version will always be available on our website with its effective date. Material changes to recurring Services will be notified to you in advance. Continued use of the Services after changes take effect constitutes acceptance.",
    ],
  },
  {
    heading: "11. Governing law and contact",
    body: [
      "These Terms are governed by the laws of the Republic of South Africa, and the courts of South Africa have jurisdiction, unless mandatory local law provides otherwise.",
      `Questions about these Terms can be sent to ${contactEmail}.`,
    ],
  },
];
</script>

<template>
  <LegalDocument
    title="Terms of Service"
    subtitle="The terms that govern our website design, build, hosting, and related services."
    :effective-date="effectiveDate"
    document-code="TWF / TOS / 01"
    :sections="sections"
  />
</template>
