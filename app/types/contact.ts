/**
 * Contact form types (technical / UI).
 *
 * Field values + step metadata for the multi-step contact form, and the shape
 * of the validation error envelope the `/api/contact` endpoint returns.
 */

/** All field values held by the multi-step contact form. */
export interface ContactFormValues {
  name: string;
  email: string;
  company: string;
  phone: string;
  businessType: string;
  siteType: string;
  existingWebsite: string;
  budget: string;
  deadline: string;
  goals: string;
  pages: string;
  features: string[];
  references: string;
  extraDetails: string;
  website: string; // honeypot
}

/** Heading metadata for one step of the contact form. */
export interface ContactFormStep {
  title: string;
  eyebrow: string;
  description: string;
}

/** Shape of the error thrown by `$fetch` when /api/contact returns a 422. */
export interface ContactErrorBody {
  data?: { data?: { errors?: Record<string, string> } };
}
